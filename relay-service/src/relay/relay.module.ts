import { Module } from "@nestjs/common";
import { RelayClusterService } from "./relay-cluster.service";
import { RelayDaemonController } from "./relay-daemon.controller";
import { RelayPersistenceService } from "./relay-persistence.service";
import { RelayRegistryService } from "./relay-registry.service";
import { RelayWebSocketServerService } from "./relay-websocket-server.service";

@Module({
  controllers: [RelayDaemonController],
  providers: [
    RelayClusterService,
    RelayPersistenceService,
    RelayRegistryService,
    RelayWebSocketServerService,
  ],
  exports: [RelayWebSocketServerService],
})
export class RelayModule {}
