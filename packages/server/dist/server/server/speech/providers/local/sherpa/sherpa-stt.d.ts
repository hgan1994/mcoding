import type pino from "pino";
import type { SpeechToTextProvider, StreamingTranscriptionSession, TranscriptionResult } from "../../../speech-provider.js";
import { SherpaOnlineRecognizerEngine } from "./sherpa-online-recognizer.js";
export type SherpaSttConfig = {
    engine: SherpaOnlineRecognizerEngine;
    silencePeakThreshold?: number;
    tailPaddingMs?: number;
};
export declare class SherpaOnnxSTT implements SpeechToTextProvider {
    private readonly engine;
    private readonly silencePeakThreshold;
    private readonly tailPaddingMs;
    private readonly logger;
    readonly id: "local";
    constructor(config: SherpaSttConfig, logger: pino.Logger);
    createSession(params: {
        logger: pino.Logger;
        language?: string;
        prompt?: string;
    }): StreamingTranscriptionSession;
    transcribeAudio(audioBuffer: Buffer, format: string): Promise<TranscriptionResult>;
}
//# sourceMappingURL=sherpa-stt.d.ts.map