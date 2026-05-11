import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listDirectoryEntries, readExplorerFile } from "./service.js";

async function createHomeTempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(os.homedir(), prefix));
}

async function createTempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("file explorer service", () => {
  it("lists directory entries even when a dangling symlink exists", async () => {
    const root = await createTempDir("paseo-file-explorer-");

    try {
      await mkdir(path.join(root, "packages", "server"), { recursive: true });
      const serverDir = path.join(root, "packages", "server");
      await writeFile(path.join(serverDir, "README.md"), "# server\n", "utf-8");
      await symlink("CLAUDE.md", path.join(serverDir, "AGENTS.md"));

      const result = await listDirectoryEntries({
        root,
        relativePath: "packages/server",
      });

      expect(result.path).toBe("packages/server");
      const names = result.entries.map((entry) => entry.name);
      expect(names).toContain("README.md");
      expect(names).not.toContain("AGENTS.md");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("searches matching directories below the requested path", async () => {
    const root = await createTempDir("paseo-file-explorer-search-");

    try {
      await mkdir(path.join(root, "Users", "hgan", "Desktop", "paseo-app"), {
        recursive: true,
      });
      await mkdir(path.join(root, "Users", "hgan", "Downloads", "archive"), {
        recursive: true,
      });
      await writeFile(path.join(root, "Users", "hgan", "Desktop", "notes.txt"), "paseo\n");

      const result = await listDirectoryEntries({
        root,
        relativePath: ".",
        searchQuery: "paseo",
        recursive: true,
        directoriesOnly: true,
      });

      expect(result.path).toBe(".");
      expect(result.entries.map((entry) => entry.path)).toEqual(["Users/hgan/Desktop/paseo-app"]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not return descendants of a matching directory during directory search", async () => {
    const root = await createTempDir("paseo-file-explorer-parent-match-");

    try {
      await mkdir(path.join(root, "Users", "mypaseo", "my-nested"), {
        recursive: true,
      });
      await mkdir(path.join(root, "Users", "other", "my-leaf"), {
        recursive: true,
      });

      const result = await listDirectoryEntries({
        root,
        relativePath: ".",
        searchQuery: "my",
        recursive: true,
        directoriesOnly: true,
      });

      expect(result.entries.map((entry) => entry.path)).toEqual([
        "Users/mypaseo",
        "Users/other/my-leaf",
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("filters regular directory listings to directories only", async () => {
    const root = await createTempDir("paseo-file-explorer-directories-only-");

    try {
      await mkdir(path.join(root, "workspace"), { recursive: true });
      await writeFile(path.join(root, "README.md"), "# root\n");

      const result = await listDirectoryEntries({
        root,
        relativePath: ".",
        directoriesOnly: true,
      });

      expect(result.entries.map((entry) => entry.path)).toEqual(["workspace"]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("reads .ex files as text", async () => {
    const root = await createTempDir("paseo-file-explorer-");

    try {
      const filePath = path.join(root, "sample.ex");
      const content = "defmodule Sample do\nend\n";
      await writeFile(filePath, content, "utf-8");

      const result = await readExplorerFile({
        root,
        relativePath: "sample.ex",
      });

      expect(result.kind).toBe("text");
      expect(result.encoding).toBe("utf-8");
      expect(result.mimeType).toBe("text/plain");
      expect(result.content).toBe(content);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("reads unknown extension text files as text", async () => {
    const root = await createTempDir("paseo-file-explorer-");

    try {
      const filePath = path.join(root, "notes.customext");
      const content = "hello from a custom text file\n";
      await writeFile(filePath, content, "utf-8");

      const result = await readExplorerFile({
        root,
        relativePath: "notes.customext",
      });

      expect(result.kind).toBe("text");
      expect(result.encoding).toBe("utf-8");
      expect(result.mimeType).toBe("text/plain");
      expect(result.content).toBe(content);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("classifies files with null bytes as binary", async () => {
    const root = await createTempDir("paseo-file-explorer-");

    try {
      const filePath = path.join(root, "blob.weird");
      await writeFile(filePath, Buffer.from([0x48, 0x65, 0x00, 0x6c, 0x6f]));

      const result = await readExplorerFile({
        root,
        relativePath: "blob.weird",
      });

      expect(result.kind).toBe("binary");
      expect(result.encoding).toBe("none");
      expect(result.content).toBeUndefined();
      expect(result.mimeType).toBe("application/octet-stream");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("expands a ~ prefix in relative paths against the user home directory", async () => {
    const root = await createHomeTempDir(".paseo-file-explorer-home-");

    try {
      const filePath = path.join(root, "sample.txt");
      await writeFile(filePath, "hello from home\n", "utf-8");

      const tildePath = `~/${path.relative(os.homedir(), filePath)}`;
      const result = await readExplorerFile({
        root,
        relativePath: tildePath,
      });

      expect(result.kind).toBe("text");
      expect(result.content).toBe("hello from home\n");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects ~-prefixed paths that resolve outside the workspace", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "paseo-file-explorer-outside-home-"));

    try {
      await expect(
        readExplorerFile({
          root,
          relativePath: "~/some/file.txt",
        }),
      ).rejects.toThrow("Access outside of workspace is not allowed");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects symlinked files that resolve outside the workspace", async () => {
    const root = await createTempDir("paseo-file-explorer-");
    const outsideRoot = await createTempDir("paseo-file-explorer-outside-");

    try {
      const externalFile = path.join(outsideRoot, "secret.txt");
      await writeFile(externalFile, "top secret\n", "utf-8");
      await symlink(externalFile, path.join(root, "secret-link.txt"));

      await expect(
        readExplorerFile({
          root,
          relativePath: "secret-link.txt",
        }),
      ).rejects.toThrow("Access outside of workspace is not allowed");
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outsideRoot, { recursive: true, force: true });
    }
  });
});
