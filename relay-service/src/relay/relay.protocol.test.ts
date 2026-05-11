import { describe, expect, test } from "vitest";

import { parseRelayUpgradeRequest } from "./relay.protocol";

function createRequest(url: string) {
  return {
    url,
    headers: {
      host: "relay.local:8787",
    },
  } as any;
}

describe("parseRelayUpgradeRequest", () => {
  test("defaults missing versions to relay v1 for backward compatibility", () => {
    const parsed = parseRelayUpgradeRequest(createRequest("/ws?serverId=srv_test&role=server"));

    expect(parsed).toEqual({
      serverId: "srv_test",
      role: "server",
      version: "1",
      connectionId: null,
      hostname: null,
    });
  });

  test("parses relay v2 client upgrades without a connectionId", () => {
    const parsed = parseRelayUpgradeRequest(createRequest("/ws?serverId=srv_test&role=client&v=2"));

    expect(parsed).toEqual({
      serverId: "srv_test",
      role: "client",
      version: "2",
      connectionId: null,
      hostname: null,
    });
  });

  test("parses hostname when supplied by the daemon", () => {
    const parsed = parseRelayUpgradeRequest(
      createRequest("/ws?serverId=srv_test&role=server&v=2&hostname=MacBook-Pro"),
    );

    expect(parsed.hostname).toBe("MacBook-Pro");
  });

  test("rejects invalid versions", () => {
    expect(() =>
      parseRelayUpgradeRequest(createRequest("/ws?serverId=srv_test&role=client&v=3")),
    ).toThrow("Invalid v parameter (expected 1 or 2)");
  });
});
