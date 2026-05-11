export declare const DESKTOP_CLI_ENV = "PASEO_DESKTOP_CLI";
export type NodeEntrypointSpec = {
    entryPath: string;
    execArgv: string[];
};
export type NodeEntrypointInvocation = {
    command: string;
    args: string[];
    env: NodeJS.ProcessEnv;
};
export type NodeEntrypointArgvMode = "bare" | "node-script";
type CreateNodeEntrypointInvocationInput = {
    execPath: string;
    isPackaged: boolean;
    packagedRunnerPath: string | null;
    entrypoint: NodeEntrypointSpec;
    argvMode: NodeEntrypointArgvMode;
    args: string[];
    baseEnv: NodeJS.ProcessEnv;
};
type ParseCliPassthroughArgsFromArgvInput = {
    argv: string[];
    isDefaultApp: boolean;
    forceCli: boolean;
};
export declare function createElectronNodeEnv(baseEnv: NodeJS.ProcessEnv, options?: {
    isPackaged?: boolean;
}): NodeJS.ProcessEnv;
export declare function parseCliPassthroughArgsFromArgv(input: ParseCliPassthroughArgsFromArgvInput): string[] | null;
export declare function createNodeEntrypointInvocation(input: CreateNodeEntrypointInvocationInput): NodeEntrypointInvocation;
export {};
//# sourceMappingURL=node-entrypoint-launcher.d.ts.map