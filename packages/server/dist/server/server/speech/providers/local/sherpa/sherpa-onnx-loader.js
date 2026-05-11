import { createRequire } from "node:module";
let cached = null;
export function loadSherpaOnnx() {
    if (cached) {
        return cached;
    }
    const require = createRequire(import.meta.url);
    cached = require("sherpa-onnx");
    return cached;
}
//# sourceMappingURL=sherpa-onnx-loader.js.map