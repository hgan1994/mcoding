import type { PersistedConfig } from "../../../persisted-config.js";
import type { RequestedSpeechProviders } from "../../speech-types.js";
import type { STTConfig } from "./stt.js";
import type { TTSConfig } from "./tts.js";
export declare const DEFAULT_OPENAI_REALTIME_TRANSCRIPTION_MODEL = "gpt-4o-transcribe";
export declare const DEFAULT_OPENAI_TTS_MODEL = "tts-1";
export type OpenAiSpeechProviderConfig = {
    apiKey?: string;
    stt?: Partial<STTConfig> & {
        apiKey?: string;
    };
    tts?: Partial<TTSConfig> & {
        apiKey?: string;
    };
    realtimeTranscriptionModel?: string;
};
export declare function resolveOpenAiSpeechConfig(params: {
    env: NodeJS.ProcessEnv;
    persisted: PersistedConfig;
    providers: RequestedSpeechProviders;
}): OpenAiSpeechProviderConfig | undefined;
//# sourceMappingURL=config.d.ts.map