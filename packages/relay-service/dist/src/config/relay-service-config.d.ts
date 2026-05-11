export type RelayServiceConfig = {
    host: string;
    port: number;
    mysql: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        synchronize: boolean;
    };
    redis: {
        enabled: boolean;
        url: string | null;
        instanceId: string;
        ownerTtlMs: number;
        ownerRefreshMs: number;
    };
};
export declare function loadRelayServiceConfig(): RelayServiceConfig;
