import { z } from "zod";
export declare const SpeechProviderIdSchema: z.ZodEnum<["openai", "local"]>;
export type SpeechProviderId = z.infer<typeof SpeechProviderIdSchema>;
export declare const RequestedSpeechProviderSchema: z.ZodObject<{
    provider: z.ZodEnum<["openai", "local"]>;
    explicit: z.ZodBoolean;
    enabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    provider: "local" | "openai";
    explicit: boolean;
    enabled?: boolean | undefined;
}, {
    provider: "local" | "openai";
    explicit: boolean;
    enabled?: boolean | undefined;
}>;
export type RequestedSpeechProvider = z.infer<typeof RequestedSpeechProviderSchema>;
export type RequestedSpeechProviders = {
    dictationStt: RequestedSpeechProvider;
    voiceTurnDetection: RequestedSpeechProvider;
    voiceStt: RequestedSpeechProvider;
    voiceTts: RequestedSpeechProvider;
};
//# sourceMappingURL=speech-types.d.ts.map