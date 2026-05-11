import { z } from "zod";
/**
 * Relay-only pairing offer.
 *
 * `serverId` is a stable daemon identifier scoped to `PASEO_HOME`, and is also
 * used as the relay session identifier.
 */
export declare const ConnectionOfferV2Schema: z.ZodObject<{
    v: z.ZodLiteral<2>;
    serverId: z.ZodString;
    daemonPublicKeyB64: z.ZodString;
    relay: z.ZodObject<{
        endpoint: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        endpoint: string;
    }, {
        endpoint: string;
    }>;
}, "strip", z.ZodTypeAny, {
    serverId: string;
    relay: {
        endpoint: string;
    };
    v: 2;
    daemonPublicKeyB64: string;
}, {
    serverId: string;
    relay: {
        endpoint: string;
    };
    v: 2;
    daemonPublicKeyB64: string;
}>;
export type ConnectionOfferV2 = z.infer<typeof ConnectionOfferV2Schema>;
export declare const ConnectionOfferSchema: z.ZodObject<{
    v: z.ZodLiteral<2>;
    serverId: z.ZodString;
    daemonPublicKeyB64: z.ZodString;
    relay: z.ZodObject<{
        endpoint: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        endpoint: string;
    }, {
        endpoint: string;
    }>;
}, "strip", z.ZodTypeAny, {
    serverId: string;
    relay: {
        endpoint: string;
    };
    v: 2;
    daemonPublicKeyB64: string;
}, {
    serverId: string;
    relay: {
        endpoint: string;
    };
    v: 2;
    daemonPublicKeyB64: string;
}>;
export type ConnectionOffer = ConnectionOfferV2;
//# sourceMappingURL=connection-offer.d.ts.map