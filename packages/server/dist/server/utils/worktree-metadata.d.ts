import { z } from "zod";
declare const PaseoWorktreeMetadataSchema: z.ZodUnion<[z.ZodObject<{
    version: z.ZodLiteral<1>;
    baseRefName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    version: 1;
    baseRefName: string;
}, {
    version: 1;
    baseRefName: string;
}>, z.ZodObject<{
    version: z.ZodLiteral<2>;
    baseRefName: z.ZodString;
    runtime: z.ZodOptional<z.ZodObject<{
        worktreePort: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        worktreePort: number;
    }, {
        worktreePort: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    version: 2;
    baseRefName: string;
    runtime?: {
        worktreePort: number;
    } | undefined;
}, {
    version: 2;
    baseRefName: string;
    runtime?: {
        worktreePort: number;
    } | undefined;
}>]>;
export type PaseoWorktreeMetadata = z.infer<typeof PaseoWorktreeMetadataSchema>;
export declare function getPaseoWorktreeMetadataPath(worktreeRoot: string): string;
export declare function normalizeBaseRefName(input: string): string;
export declare function writePaseoWorktreeMetadata(worktreeRoot: string, options: {
    baseRefName: string;
}): void;
export declare function writePaseoWorktreeRuntimeMetadata(worktreeRoot: string, options: {
    worktreePort: number;
}): void;
export declare function readPaseoWorktreeMetadata(worktreeRoot: string): PaseoWorktreeMetadata | null;
export declare function requirePaseoWorktreeBaseRefName(worktreeRoot: string): string;
export declare function readPaseoWorktreeRuntimePort(worktreeRoot: string): number | null;
export {};
//# sourceMappingURL=worktree-metadata.d.ts.map