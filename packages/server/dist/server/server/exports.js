// CLI exports for @getpaseo/server
export { createPaseoDaemon } from "./bootstrap.js";
export { loadConfig } from "./config.js";
export { resolvePaseoHome } from "./paseo-home.js";
export { getOrCreateServerId } from "./server-id.js";
export { createRootLogger } from "./logger.js";
export { loadPersistedConfig } from "./persisted-config.js";
export { generateLocalPairingOffer } from "./pairing-offer.js";
export { DaemonClient, } from "../client/daemon-client.js";
export { ensureLocalSpeechModels, listLocalSpeechModels, } from "./speech/providers/local/models.js";
export { applySherpaLoaderEnv, resolveSherpaLoaderEnv, sherpaLoaderEnvKey, sherpaPlatformArch, sherpaPlatformPackageName, } from "./speech/providers/local/sherpa/sherpa-runtime-env.js";
// Provider binary resolution
export { applyProviderEnv, } from "./agent/provider-launch-config.js";
export { findExecutable, quoteWindowsArgument, quoteWindowsCommand, } from "../utils/executable.js";
export { execCommand, spawnProcess } from "../utils/spawn.js";
// Provider manifest (source of truth for provider definitions)
export { AGENT_PROVIDER_DEFINITIONS, BUILTIN_PROVIDER_IDS, } from "./agent/provider-manifest.js";
// Agent activity curator for CLI logs
export { curateAgentActivity } from "./agent/activity-curator.js";
export { getStructuredAgentResponse, StructuredAgentResponseError, StructuredAgentFallbackError, DEFAULT_STRUCTURED_GENERATION_PROVIDERS, generateStructuredAgentResponseWithFallback, } from "./agent/agent-response-loop.js";
//# sourceMappingURL=exports.js.map