import { existsSync } from "node:fs";
import { loadSherpaOnnx } from "./sherpa-onnx-loader.js";
function assertFileExists(filePath, label) {
    if (!existsSync(filePath)) {
        throw new Error(`Missing ${label}: ${filePath}`);
    }
}
export class SherpaOnlineRecognizerEngine {
    constructor(config, logger) {
        this.logger = logger.child({
            module: "speech",
            provider: "local",
            component: "online-recognizer",
        });
        const { model } = config;
        if (model.kind === "transducer") {
            assertFileExists(model.encoder, "transducer encoder");
            assertFileExists(model.decoder, "transducer decoder");
            assertFileExists(model.joiner, "transducer joiner");
            assertFileExists(model.tokens, "tokens");
        }
        else {
            assertFileExists(model.encoder, "paraformer encoder");
            assertFileExists(model.decoder, "paraformer decoder");
            assertFileExists(model.tokens, "tokens");
        }
        const sherpa = loadSherpaOnnx();
        const modelConfig = model.kind === "transducer"
            ? {
                transducer: {
                    encoder: model.encoder,
                    decoder: model.decoder,
                    joiner: model.joiner,
                },
                tokens: model.tokens,
                modelType: model.modelType ?? "zipformer",
            }
            : {
                paraformer: {
                    encoder: model.encoder,
                    decoder: model.decoder,
                },
                tokens: model.tokens,
            };
        const featConfig = {
            sampleRate: config.sampleRate ?? 16000,
            featureDim: config.featureDim ?? 80,
        };
        const recognizerConfig = {
            featConfig,
            modelConfig: {
                ...modelConfig,
                // NOTE: In the WASM-backed `sherpa-onnx` npm package, online recognizers
                // error when `numThreads > 1`. Keep the default conservative.
                numThreads: config.numThreads ?? 1,
                provider: config.provider ?? "cpu",
                debug: config.debug ?? 0,
            },
            decodingMethod: config.decodingMethod ?? "greedy_search",
            maxActivePaths: config.maxActivePaths ?? 4,
            enableEndpoint: config.enableEndpoint ?? 0,
            rule1MinTrailingSilence: config.rule1MinTrailingSilence ?? 2.4,
            rule2MinTrailingSilence: config.rule2MinTrailingSilence ?? 1.2,
            rule3MinUtteranceLength: config.rule3MinUtteranceLength ?? 20,
        };
        this.recognizer = sherpa.createOnlineRecognizer(recognizerConfig);
        const sr = this.recognizer?.config?.featConfig?.sampleRate;
        this.sampleRate =
            typeof sr === "number" && Number.isFinite(sr) && sr > 0 ? sr : featConfig.sampleRate;
        this.logger.info({ sampleRate: this.sampleRate, modelKind: model.kind, numThreads: config.numThreads ?? 2 }, "Sherpa online recognizer initialized");
    }
    createStream() {
        return this.recognizer.createStream();
    }
    free() {
        try {
            this.recognizer?.free?.();
        }
        catch (err) {
            this.logger.warn({ err }, "Failed to free sherpa recognizer");
        }
    }
}
//# sourceMappingURL=sherpa-online-recognizer.js.map