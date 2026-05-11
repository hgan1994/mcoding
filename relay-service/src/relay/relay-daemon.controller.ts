import { Controller, Get, Param } from "@nestjs/common";
import { RelayPersistenceService } from "./relay-persistence.service";

@Controller("relay/daemon")
export class RelayDaemonController {
  constructor(private readonly relayPersistenceService: RelayPersistenceService) {}

  @Get(":serverId/stats")
  async getDaemonStats(@Param("serverId") serverId: string) {
    const { activeConnections, totalConnections } =
      this.relayPersistenceService.getDaemonStats(serverId);

    return {
      serverId,
      activeConnections,
      totalConnections,
    };
  }
}
