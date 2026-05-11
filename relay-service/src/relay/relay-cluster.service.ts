import { Injectable } from "@nestjs/common";

import type { RelayProtocolVersion, RelaySessionSnapshot } from "./relay.types";

type StickySessionDecision =
  | { accepted: true; ownerInstanceId: string }
  | { accepted: false; ownerInstanceId: string | null };

@Injectable()
export class RelayClusterService {
  async ensureSessionOwnership(
    version: RelayProtocolVersion,
    serverId: string,
  ): Promise<StickySessionDecision> {
    return {
      accepted: true,
      ownerInstanceId: `${version}:${serverId}`,
    };
  }

  syncSessionSnapshot(_snapshot: RelaySessionSnapshot): void {}
}
