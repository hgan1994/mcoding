"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const relay_registry_service_1 = require("./relay-registry.service");
function createPersistenceStub() {
    return {
        syncSession: vitest_1.vi.fn(),
        syncConnection: vitest_1.vi.fn(),
    };
}
function createClusterStub() {
    return {
        syncSessionSnapshot: vitest_1.vi.fn(),
    };
}
function createSocket(id) {
    const sent = [];
    const closeCalls = [];
    const socket = {
        id,
        send: (data) => {
            if (typeof data === "string" || Buffer.isBuffer(data)) {
                sent.push(data);
                return;
            }
            sent.push(Buffer.from(data instanceof Uint8Array ? data : Buffer.from(data)));
        },
        close: (code, reason) => {
            closeCalls.push({ code, reason });
        },
    };
    return { socket, sent, closeCalls };
}
(0, vitest_1.describe)("RelayRegistryService", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.test)("assigns connection ids to v2 clients and notifies the control socket", () => {
        const persistence = createPersistenceStub();
        const cluster = createClusterStub();
        const service = new relay_registry_service_1.RelayRegistryService(persistence, cluster);
        const control = createSocket("control");
        service.registerSocket({
            socket: control.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: null,
        });
        const client = createSocket("client");
        const context = service.registerSocket({
            socket: client.socket,
            version: "2",
            serverId: "srv_test",
            role: "client",
            connectionId: null,
        });
        (0, vitest_1.expect)(context.connectionId).toMatch(/^conn_/);
        (0, vitest_1.expect)(control.sent).toContainEqual(JSON.stringify({ type: "connected", connectionId: context.connectionId }));
    });
    (0, vitest_1.test)("sends a sync message when the control socket attaches after clients already exist", () => {
        const persistence = createPersistenceStub();
        const cluster = createClusterStub();
        const service = new relay_registry_service_1.RelayRegistryService(persistence, cluster);
        service.registerSocket({
            socket: createSocket("client").socket,
            version: "2",
            serverId: "srv_test",
            role: "client",
            connectionId: "conn_existing",
        });
        const control = createSocket("control");
        service.registerSocket({
            socket: control.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: null,
        });
        (0, vitest_1.expect)(control.sent).toContainEqual(JSON.stringify({ type: "sync", connectionIds: ["conn_existing"] }));
    });
    (0, vitest_1.test)("buffers client frames until the server data socket connects, then flushes them", () => {
        const persistence = createPersistenceStub();
        const cluster = createClusterStub();
        const service = new relay_registry_service_1.RelayRegistryService(persistence, cluster);
        const control = createSocket("control");
        service.registerSocket({
            socket: control.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: null,
        });
        const client = createSocket("client");
        const clientContext = service.registerSocket({
            socket: client.socket,
            version: "2",
            serverId: "srv_test",
            role: "client",
            connectionId: "conn_123",
        });
        service.handleMessage(clientContext, "hello");
        const serverData = createSocket("server-data");
        service.registerSocket({
            socket: serverData.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: "conn_123",
        });
        (0, vitest_1.expect)(serverData.sent).toContain("hello");
    });
    (0, vitest_1.test)("responds to control ping messages with pong", () => {
        const persistence = createPersistenceStub();
        const cluster = createClusterStub();
        const service = new relay_registry_service_1.RelayRegistryService(persistence, cluster);
        const control = createSocket("control");
        const controlContext = service.registerSocket({
            socket: control.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: null,
        });
        service.handleMessage(controlContext, JSON.stringify({ type: "ping", ts: 123 }));
        const pongMessage = control.sent.find((message) => typeof message === "string" && JSON.parse(message).type === "pong");
        (0, vitest_1.expect)(pongMessage).toBeTypeOf("string");
        (0, vitest_1.expect)(JSON.parse(pongMessage)).toMatchObject({ type: "pong" });
    });
    (0, vitest_1.test)("closes the daemon data socket and notifies control when the last client disconnects", () => {
        const persistence = createPersistenceStub();
        const cluster = createClusterStub();
        const service = new relay_registry_service_1.RelayRegistryService(persistence, cluster);
        const control = createSocket("control");
        service.registerSocket({
            socket: control.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: null,
        });
        const client = createSocket("client");
        const clientContext = service.registerSocket({
            socket: client.socket,
            version: "2",
            serverId: "srv_test",
            role: "client",
            connectionId: "conn_abc",
        });
        const serverData = createSocket("server-data");
        service.registerSocket({
            socket: serverData.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: "conn_abc",
        });
        service.handleClose(clientContext);
        (0, vitest_1.expect)(serverData.closeCalls).toContainEqual({
            code: 1001,
            reason: "Client disconnected",
        });
        (0, vitest_1.expect)(control.sent).toContainEqual(JSON.stringify({ type: "disconnected", connectionId: "conn_abc" }));
    });
    (0, vitest_1.test)("closes client sockets when the daemon data socket disconnects", () => {
        const persistence = createPersistenceStub();
        const cluster = createClusterStub();
        const service = new relay_registry_service_1.RelayRegistryService(persistence, cluster);
        const client = createSocket("client");
        service.registerSocket({
            socket: client.socket,
            version: "2",
            serverId: "srv_test",
            role: "client",
            connectionId: "conn_abc",
        });
        const serverData = createSocket("server-data");
        const serverContext = service.registerSocket({
            socket: serverData.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: "conn_abc",
        });
        service.handleClose(serverContext);
        (0, vitest_1.expect)(client.closeCalls).toContainEqual({
            code: 1012,
            reason: "Server disconnected",
        });
    });
    (0, vitest_1.test)("nudges and then resets the control socket when a daemon data socket never appears", () => {
        const persistence = createPersistenceStub();
        const cluster = createClusterStub();
        const service = new relay_registry_service_1.RelayRegistryService(persistence, cluster);
        const control = createSocket("control");
        service.registerSocket({
            socket: control.socket,
            version: "2",
            serverId: "srv_test",
            role: "server",
            connectionId: null,
        });
        service.registerSocket({
            socket: createSocket("client").socket,
            version: "2",
            serverId: "srv_test",
            role: "client",
            connectionId: "conn_waiting",
        });
        vitest_1.vi.advanceTimersByTime(10000);
        (0, vitest_1.expect)(control.sent).toContainEqual(JSON.stringify({ type: "sync", connectionIds: ["conn_waiting"] }));
        vitest_1.vi.advanceTimersByTime(5000);
        (0, vitest_1.expect)(control.closeCalls).toContainEqual({
            code: 1011,
            reason: "Control unresponsive",
        });
    });
    (0, vitest_1.test)("relays v1 traffic between server and client sockets", () => {
        const persistence = createPersistenceStub();
        const cluster = createClusterStub();
        const service = new relay_registry_service_1.RelayRegistryService(persistence, cluster);
        const server = createSocket("server");
        const serverContext = service.registerSocket({
            socket: server.socket,
            version: "1",
            serverId: "srv_v1",
            role: "server",
            connectionId: null,
        });
        const client = createSocket("client");
        service.registerSocket({
            socket: client.socket,
            version: "1",
            serverId: "srv_v1",
            role: "client",
            connectionId: null,
        });
        service.handleMessage(serverContext, "legacy-hello");
        (0, vitest_1.expect)(client.sent).toContain("legacy-hello");
    });
});
//# sourceMappingURL=relay-registry.service.test.js.map