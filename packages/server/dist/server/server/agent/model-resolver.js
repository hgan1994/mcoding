import { buildProviderRegistry } from "./provider-registry.js";
import { resolveSnapshotCwd } from "./provider-snapshot-manager.js";
import { expandTilde } from "../../utils/path.js";
export async function resolveAgentModel(options) {
    const trimmed = options.requestedModel?.trim();
    if (trimmed) {
        return trimmed;
    }
    try {
        const providerRegistry = buildProviderRegistry(options.logger);
        const models = await providerRegistry[options.provider].fetchModels({
            cwd: resolveSnapshotCwd(options.cwd ? expandTilde(options.cwd) : undefined),
            force: false,
        });
        const preferred = models.find((model) => model.isDefault) ?? models[0];
        return preferred?.id;
    }
    catch (error) {
        options.logger.warn({ err: error, provider: options.provider }, "Failed to resolve default model");
        return undefined;
    }
}
//# sourceMappingURL=model-resolver.js.map