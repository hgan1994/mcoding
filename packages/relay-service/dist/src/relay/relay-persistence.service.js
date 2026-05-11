"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RelayPersistenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayPersistenceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const relay_entities_1 = require("./relay.entities");
let RelayPersistenceService = RelayPersistenceService_1 = class RelayPersistenceService {
    constructor(dataSource) {
        this.logger = new common_1.Logger(RelayPersistenceService_1.name);
        this.relaySessionRepository = dataSource.getRepository(relay_entities_1.RelaySessionEntity);
        this.relayConnectionRepository = dataSource.getRepository(relay_entities_1.RelayConnectionEntity);
    }
    syncSession(snapshot) {
        void this.persistSession(snapshot).catch((error) => {
            this.logger.warn(`Failed to persist relay session ${snapshot.version}:${snapshot.serverId}: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    syncConnection(snapshot) {
        void this.persistConnection(snapshot).catch((error) => {
            this.logger.warn(`Failed to persist relay connection ${snapshot.version}:${snapshot.serverId}:${snapshot.connectionId}: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    async persistSession(snapshot) {
        const existing = await this.relaySessionRepository.findOne({
            where: {
                version: snapshot.version,
                serverId: snapshot.serverId,
            },
        });
        const entity = existing ??
            this.relaySessionRepository.create({
                version: snapshot.version,
                serverId: snapshot.serverId,
            });
        entity.status = snapshot.status;
        entity.serverSocketConnected = snapshot.serverSocketConnected;
        entity.controlSocketConnected = snapshot.controlSocketConnected;
        entity.clientSocketCount = snapshot.clientSocketCount;
        entity.lastSeenAt = new Date();
        await this.relaySessionRepository.save(entity);
    }
    async persistConnection(snapshot) {
        const existing = await this.relayConnectionRepository.findOne({
            where: {
                version: snapshot.version,
                serverId: snapshot.serverId,
                connectionId: snapshot.connectionId,
            },
        });
        const entity = existing ??
            this.relayConnectionRepository.create({
                version: snapshot.version,
                serverId: snapshot.serverId,
                connectionId: snapshot.connectionId,
            });
        entity.status = snapshot.status;
        entity.clientSocketCount = snapshot.clientSocketCount;
        entity.serverDataConnected = snapshot.serverDataConnected;
        entity.pendingFrameCount = snapshot.pendingFrameCount;
        entity.lastSeenAt = new Date();
        await this.relayConnectionRepository.save(entity);
    }
};
exports.RelayPersistenceService = RelayPersistenceService;
exports.RelayPersistenceService = RelayPersistenceService = RelayPersistenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], RelayPersistenceService);
//# sourceMappingURL=relay-persistence.service.js.map