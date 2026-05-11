import type { Server as HttpServer } from "node:http";
import { RelayClusterService } from "./relay-cluster.service";
import { RelayRegistryService } from "./relay-registry.service";
export declare class RelayWebSocketServerService {
    private readonly relayRegistryService;
    private readonly relayClusterService;
    private readonly logger;
    private readonly webSocketServer;
    private attached;
    constructor(relayRegistryService: RelayRegistryService, relayClusterService: RelayClusterService);
    attach(httpServer: HttpServer): void;
    private handleUpgrade;
    private handleAcceptedSocket;
    private createRelayPeerSocket;
    private normalizeRawData;
    private rejectUpgrade;
}
