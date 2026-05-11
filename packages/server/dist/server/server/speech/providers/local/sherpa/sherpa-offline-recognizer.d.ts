import type pino from "pino";
export type SherpaOfflineRecognizerModel = {
    kind: "nemo_transducer";
    encoder: string;
    decoder: string;
    joiner: string;
    tokens: string;
};
export type SherpaOfflineRecognizerConfig = {
    model: SherpaOfflineRecognizerModel;
    numThreads?: number;
    provider?: "cpu";
    debug?: 0 | 1;
    sampleRate?: number;
    featureDim?: number;
    decodingMethod?: "greedy_search";
    maxActivePaths?: number;
};
export declare class SherpaOfflineRecognizerEngine {
    readonly recognizer: any;
    readonly sampleRate: number;
    private readonly logger;
    constructor(config: SherpaOfflineRecognizerConfig, logger: pino.Logger);
    createStream(): any;
    acceptWaveform(stream: any, sampleRate: number, samples: Float32Array): void;
    free(): void;
}
//# sourceMappingURL=sherpa-offline-recognizer.d.ts.map