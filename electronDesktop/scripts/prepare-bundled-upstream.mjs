import { existsSync, mkdirSync, rmSync, cpSync, lstatSync, realpathSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { execSync } from "node:child_process";

const SCRIPT_DIR = resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const UPSTREAM_SOURCE = join(PROJECT_ROOT, "upstream", "paseo-0.1.64", "paseo-0.1.64");
const STAGE_ROOT = join(PROJECT_ROOT, ".bundled-upstream", "paseo-0.1.64", "paseo-0.1.64");

function copyTree(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  let resolvedSrc = src;
  try {
    const stat = lstatSync(src);
    if (stat.isSymbolicLink()) {
      resolvedSrc = realpathSync(src);
    }
  } catch {}
  cpSync(resolvedSrc, dest, { recursive: true, force: true });
}

function copyDep(dep) {
  const src = join(UPSTREAM_SOURCE, "node_modules", dep);
  const dest = join(STAGE_ROOT, "node_modules", dep);
  if (!existsSync(src)) {
    console.error(`Missing upstream dependency: ${src}`);
    process.exit(1);
  }
  copyTree(src, dest);
}

function copyRuntimeDependencyClosure() {
  let dependencyPaths;
  try {
    dependencyPaths = execSync(
      `npm ls --omit=dev --all --parseable --workspace=@getpaseo/server --workspace=@getpaseo/cli --workspace=@getpaseo/relay --workspace=@getpaseo/highlight`,
      { cwd: UPSTREAM_SOURCE, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
  } catch (e) {
    dependencyPaths = e.stdout || "";
  }

  for (const rawPath of dependencyPaths.split(/\r?\n/)) {
    if (!rawPath || rawPath === UPSTREAM_SOURCE) continue;

    const absolutePath = resolve(rawPath);
    const relativePath = relative(UPSTREAM_SOURCE, absolutePath);
    if (!relativePath || relativePath.startsWith("..")) continue;

    if (
      relativePath.startsWith("packages\\cli") ||
      relativePath.startsWith("packages\\server") ||
      relativePath.startsWith("packages\\relay") ||
      relativePath.startsWith("packages\\highlight") ||
      relativePath.startsWith("packages/cli") ||
      relativePath.startsWith("packages/server") ||
      relativePath.startsWith("packages/relay") ||
      relativePath.startsWith("packages/highlight") ||
      relativePath.startsWith("node_modules\\@getpaseo") ||
      relativePath.startsWith("node_modules/@getpaseo")
    ) {
      continue;
    }

    copyTree(absolutePath, join(STAGE_ROOT, relativePath));
  }
}

if (!existsSync(UPSTREAM_SOURCE)) {
  console.error(`Upstream source is missing at ${UPSTREAM_SOURCE}`);
  process.exit(1);
}

rmSync(join(PROJECT_ROOT, ".bundled-upstream"), { recursive: true, force: true });
mkdirSync(join(STAGE_ROOT, "packages"), { recursive: true });
mkdirSync(join(STAGE_ROOT, "node_modules", "@getpaseo"), { recursive: true });

copyTree(join(UPSTREAM_SOURCE, "package.json"), join(STAGE_ROOT, "package.json"));
copyTree(join(UPSTREAM_SOURCE, "packages", "cli"), join(STAGE_ROOT, "packages", "cli"));
copyTree(join(UPSTREAM_SOURCE, "packages", "server"), join(STAGE_ROOT, "packages", "server"));
copyTree(join(UPSTREAM_SOURCE, "packages", "relay"), join(STAGE_ROOT, "packages", "relay"));
copyTree(join(UPSTREAM_SOURCE, "packages", "highlight"), join(STAGE_ROOT, "packages", "highlight"));

copyTree(
  join(STAGE_ROOT, "packages", "cli"),
  join(STAGE_ROOT, "node_modules", "@getpaseo", "cli")
);
copyTree(
  join(STAGE_ROOT, "packages", "server"),
  join(STAGE_ROOT, "node_modules", "@getpaseo", "server")
);
copyTree(
  join(STAGE_ROOT, "packages", "relay"),
  join(STAGE_ROOT, "node_modules", "@getpaseo", "relay")
);
copyTree(
  join(STAGE_ROOT, "packages", "highlight"),
  join(STAGE_ROOT, "node_modules", "@getpaseo", "highlight")
);

copyRuntimeDependencyClosure();

console.log(`Prepared bundled upstream runtime at ${STAGE_ROOT}`);
