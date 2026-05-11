import { z } from "zod";
/**
 * Relay-only pairing offer.
 *
 * `serverId` is a stable daemon identifier scoped to `PASEO_HOME`, and is also
 * used as the relay session identifier.
 */
export const ConnectionOfferV2Schema = z.object({
    v: z.literal(2),
    serverId: z.string().min(1),
    daemonPublicKeyB64: z.string().min(1),
    relay: z.object({
        endpoint: z.string().min(1),
    }),
});
export const ConnectionOfferSchema = ConnectionOfferV2Schema;
//# sourceMappingURL=connection-offer.js.map