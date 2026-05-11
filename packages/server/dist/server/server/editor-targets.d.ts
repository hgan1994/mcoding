import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import type { EditorTargetDescriptorPayload, EditorTargetId } from "../shared/messages.js";
type ListAvailableEditorTargetsDependencies = {
    platform?: NodeJS.Platform;
    findExecutable?: (command: string) => string | null | Promise<string | null>;
};
type OpenInEditorTargetDependencies = ListAvailableEditorTargetsDependencies & {
    existsSync?: typeof existsSync;
    spawn?: typeof spawn;
};
export declare function listAvailableEditorTargets(dependencies?: ListAvailableEditorTargetsDependencies): Promise<EditorTargetDescriptorPayload[]>;
export declare function openInEditorTarget(input: {
    editorId: EditorTargetId;
    path: string;
}, dependencies?: OpenInEditorTargetDependencies): Promise<void>;
export {};
//# sourceMappingURL=editor-targets.d.ts.map