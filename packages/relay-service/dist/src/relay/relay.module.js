"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayModule = void 0;
const common_1 = require("@nestjs/common");
const relay_cluster_service_1 = require("./relay-cluster.service");
const relay_persistence_service_1 = require("./relay-persistence.service");
const relay_registry_service_1 = require("./relay-registry.service");
const relay_websocket_server_service_1 = require("./relay-websocket-server.service");
let RelayModule = class RelayModule {
};
exports.RelayModule = RelayModule;
exports.RelayModule = RelayModule = __decorate([
    (0, common_1.Module)({
        providers: [
            relay_cluster_service_1.RelayClusterService,
            relay_persistence_service_1.RelayPersistenceService,
            relay_registry_service_1.RelayRegistryService,
            relay_websocket_server_service_1.RelayWebSocketServerService,
        ],
        exports: [relay_websocket_server_service_1.RelayWebSocketServerService],
    })
], RelayModule);
//# sourceMappingURL=relay.module.js.map