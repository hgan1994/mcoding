import { z } from "zod";
import type { ToolCallDetail } from "../agent-sdk-types.js";
export declare const CommandValueSchema: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
export declare const ToolShellInputSchema: z.ZodEffects<z.ZodUnion<[z.ZodObject<{
    command: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    cwd: z.ZodOptional<z.ZodString>;
    directory: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    command: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    cwd: z.ZodOptional<z.ZodString>;
    directory: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    command: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    cwd: z.ZodOptional<z.ZodString>;
    directory: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    cmd: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    cwd: z.ZodOptional<z.ZodString>;
    directory: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    cmd: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    cwd: z.ZodOptional<z.ZodString>;
    directory: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    cmd: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    cwd: z.ZodOptional<z.ZodString>;
    directory: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>]>, {
    command: string | undefined;
    cwd: string | undefined;
}, z.objectInputType<{
    command: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    cwd: z.ZodOptional<z.ZodString>;
    directory: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    cmd: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    cwd: z.ZodOptional<z.ZodString>;
    directory: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolShellOutputSchema: z.ZodUnion<[z.ZodEffects<z.ZodString, {
    command: undefined;
    output: string | undefined;
    exitCode: undefined;
}, string>, z.ZodEffects<z.ZodObject<{
    command: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    aggregated_output: z.ZodOptional<z.ZodString>;
    aggregatedOutput: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    metadata: z.ZodOptional<z.ZodObject<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>;
    structuredContent: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    structured_content: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    result: z.ZodOptional<z.ZodObject<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    command: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    aggregated_output: z.ZodOptional<z.ZodString>;
    aggregatedOutput: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    metadata: z.ZodOptional<z.ZodObject<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>;
    structuredContent: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    structured_content: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    result: z.ZodOptional<z.ZodObject<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    command: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    aggregated_output: z.ZodOptional<z.ZodString>;
    aggregatedOutput: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    metadata: z.ZodOptional<z.ZodObject<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>;
    structuredContent: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    structured_content: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    result: z.ZodOptional<z.ZodObject<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>, {
    command: string | undefined;
    output: string | undefined;
    exitCode: number | undefined;
}, z.objectInputType<{
    command: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    aggregated_output: z.ZodOptional<z.ZodString>;
    aggregatedOutput: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    metadata: z.ZodOptional<z.ZodObject<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        exitCode: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        exit_code: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>>;
    structuredContent: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    structured_content: z.ZodOptional<z.ZodObject<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    result: z.ZodOptional<z.ZodObject<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        command: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
}, z.ZodTypeAny, "passthrough">>]>;
export declare const ToolPathInputSchema: z.ZodUnion<[z.ZodEffects<z.ZodObject<{
    path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    file_path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    filePath: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>]>;
export declare const ToolReadInputSchema: z.ZodUnion<[z.ZodEffects<z.ZodObject<{
    path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
    offset: number | undefined;
    limit: number | undefined;
}, z.objectInputType<{
    path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    file_path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    file_path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    file_path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
    offset: number | undefined;
    limit: number | undefined;
}, z.objectInputType<{
    file_path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    filePath: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    filePath: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    filePath: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
    offset: number | undefined;
    limit: number | undefined;
}, z.objectInputType<{
    filePath: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>]>;
type ToolReadOutputValue = {
    filePath?: string;
    content?: string;
};
export declare const ToolReadOutputSchema: z.ZodType<ToolReadOutputValue, z.ZodTypeDef, unknown>;
export declare const ToolReadOutputWithPathSchema: z.ZodType<ToolReadOutputValue, z.ZodTypeDef, unknown>;
export declare const ToolWriteContentSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolWriteInputSchema: z.ZodEffects<z.ZodIntersection<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
    path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    file_path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    filePath: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>]>, z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>>, {
    filePath: string;
    content: string | undefined;
}, (z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">) & {
    content?: string | undefined;
    new_content?: string | undefined;
    newContent?: string | undefined;
} & {
    [k: string]: unknown;
}>;
export declare const ToolWriteOutputSchema: z.ZodUnion<[z.ZodEffects<z.ZodIntersection<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
    path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    file_path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    filePath: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>]>, z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>>, {
    filePath: string;
    content: string | undefined;
}, (z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">) & {
    content?: string | undefined;
    new_content?: string | undefined;
    newContent?: string | undefined;
} & {
    [k: string]: unknown;
}>, z.ZodEffects<z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: undefined;
    content: string | undefined;
}, z.objectInputType<{
    content: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>]>;
export declare const ToolEditTextSchema: z.ZodObject<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolEditInputSchema: z.ZodEffects<z.ZodIntersection<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
    path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    file_path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    filePath: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>]>, z.ZodObject<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>>, {
    filePath: string;
    oldString: string | undefined;
    newString: string | undefined;
    unifiedDiff: string | undefined;
}, (z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">) & {
    content?: string | undefined;
    unifiedDiff?: string | undefined;
    diff?: string | undefined;
    new_content?: string | undefined;
    newContent?: string | undefined;
    old_string?: string | undefined;
    old_str?: string | undefined;
    oldContent?: string | undefined;
    old_content?: string | undefined;
    new_string?: string | undefined;
    new_str?: string | undefined;
    patch?: string | undefined;
    unified_diff?: string | undefined;
} & {
    [k: string]: unknown;
}>;
export declare const ToolEditOutputSchema: z.ZodUnion<[z.ZodEffects<z.ZodIntersection<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
    path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    file_path: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    filePath: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
}, z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">>]>, z.ZodObject<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>>, {
    filePath: string;
    newString: string | undefined;
    unifiedDiff: string | undefined;
}, (z.objectInputType<{
    path: z.ZodString;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    file_path: z.ZodString;
}, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
    filePath: z.ZodString;
}, z.ZodTypeAny, "passthrough">) & {
    content?: string | undefined;
    unifiedDiff?: string | undefined;
    diff?: string | undefined;
    new_content?: string | undefined;
    newContent?: string | undefined;
    old_string?: string | undefined;
    old_str?: string | undefined;
    oldContent?: string | undefined;
    old_content?: string | undefined;
    new_string?: string | undefined;
    new_str?: string | undefined;
    patch?: string | undefined;
    unified_diff?: string | undefined;
} & {
    [k: string]: unknown;
}>, z.ZodEffects<z.ZodObject<{
    files: z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>]>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    files: z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>]>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    files: z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>]>, "many">;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: string;
    unifiedDiff: string | undefined;
    newString: undefined;
}, z.objectInputType<{
    files: z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        file_path: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, {
        filePath: string;
        unifiedDiff: string | undefined;
    }, z.objectInputType<{
        filePath: z.ZodString;
        patch: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        unified_diff: z.ZodOptional<z.ZodString>;
        unifiedDiff: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>]>, "many">;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>, {
    filePath: undefined;
    newString: string | undefined;
    unifiedDiff: string | undefined;
}, z.objectInputType<{
    old_string: z.ZodOptional<z.ZodString>;
    old_str: z.ZodOptional<z.ZodString>;
    oldContent: z.ZodOptional<z.ZodString>;
    old_content: z.ZodOptional<z.ZodString>;
    new_string: z.ZodOptional<z.ZodString>;
    new_str: z.ZodOptional<z.ZodString>;
    newContent: z.ZodOptional<z.ZodString>;
    new_content: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    unified_diff: z.ZodOptional<z.ZodString>;
    unifiedDiff: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>]>;
export declare const ToolSearchInputSchema: z.ZodUnion<[z.ZodEffects<z.ZodObject<{
    query: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    query: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    query: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    query: string;
}, z.objectInputType<{
    query: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    q: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    q: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    q: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    query: string;
}, z.objectInputType<{
    q: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
    pattern: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    pattern: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    pattern: z.ZodString;
}, z.ZodTypeAny, "passthrough">>, {
    query: string;
}, z.objectInputType<{
    pattern: z.ZodString;
}, z.ZodTypeAny, "passthrough">>]>;
export declare const ToolGlobOutputSchema: z.ZodObject<{
    durationMs: z.ZodNumber;
    numFiles: z.ZodNumber;
    filenames: z.ZodArray<z.ZodString, "many">;
    truncated: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    durationMs: z.ZodNumber;
    numFiles: z.ZodNumber;
    filenames: z.ZodArray<z.ZodString, "many">;
    truncated: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    durationMs: z.ZodNumber;
    numFiles: z.ZodNumber;
    filenames: z.ZodArray<z.ZodString, "many">;
    truncated: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolGrepOutputSchema: z.ZodObject<{
    mode: z.ZodOptional<z.ZodEnum<["content", "files_with_matches", "count"]>>;
    numFiles: z.ZodNumber;
    filenames: z.ZodArray<z.ZodString, "many">;
    content: z.ZodOptional<z.ZodString>;
    numLines: z.ZodOptional<z.ZodNumber>;
    numMatches: z.ZodOptional<z.ZodNumber>;
    appliedLimit: z.ZodOptional<z.ZodNumber>;
    appliedOffset: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    mode: z.ZodOptional<z.ZodEnum<["content", "files_with_matches", "count"]>>;
    numFiles: z.ZodNumber;
    filenames: z.ZodArray<z.ZodString, "many">;
    content: z.ZodOptional<z.ZodString>;
    numLines: z.ZodOptional<z.ZodNumber>;
    numMatches: z.ZodOptional<z.ZodNumber>;
    appliedLimit: z.ZodOptional<z.ZodNumber>;
    appliedOffset: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    mode: z.ZodOptional<z.ZodEnum<["content", "files_with_matches", "count"]>>;
    numFiles: z.ZodNumber;
    filenames: z.ZodArray<z.ZodString, "many">;
    content: z.ZodOptional<z.ZodString>;
    numLines: z.ZodOptional<z.ZodNumber>;
    numMatches: z.ZodOptional<z.ZodNumber>;
    appliedLimit: z.ZodOptional<z.ZodNumber>;
    appliedOffset: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolWebFetchInputSchema: z.ZodObject<{
    url: z.ZodString;
    prompt: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    url: z.ZodString;
    prompt: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    url: z.ZodString;
    prompt: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolWebFetchOutputSchema: z.ZodObject<{
    bytes: z.ZodNumber;
    code: z.ZodNumber;
    codeText: z.ZodString;
    result: z.ZodString;
    durationMs: z.ZodNumber;
    url: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    bytes: z.ZodNumber;
    code: z.ZodNumber;
    codeText: z.ZodString;
    result: z.ZodString;
    durationMs: z.ZodNumber;
    url: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    bytes: z.ZodNumber;
    code: z.ZodNumber;
    codeText: z.ZodString;
    result: z.ZodString;
    durationMs: z.ZodNumber;
    url: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolWebSearchOutputSchema: z.ZodObject<{
    query: z.ZodString;
    results: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.ZodString]>, "many">;
    durationSeconds: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    query: z.ZodString;
    results: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.ZodString]>, "many">;
    durationSeconds: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    query: z.ZodString;
    results: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        tool_use_id: z.ZodString;
        content: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            url: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            title: z.ZodString;
            url: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, z.ZodTypeAny, "passthrough">>, z.ZodString]>, "many">;
    durationSeconds: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export type ParsedToolShellInput = z.infer<typeof ToolShellInputSchema>;
export type ParsedToolShellOutput = z.infer<typeof ToolShellOutputSchema>;
export type ParsedToolReadInput = z.infer<typeof ToolReadInputSchema>;
export type ParsedToolReadOutput = ToolReadOutputValue;
export type ParsedToolReadOutputWithPath = ToolReadOutputValue;
export type ParsedToolWriteInput = z.infer<typeof ToolWriteInputSchema>;
export type ParsedToolWriteOutput = z.infer<typeof ToolWriteOutputSchema>;
export type ParsedToolEditInput = z.infer<typeof ToolEditInputSchema>;
export type ParsedToolEditOutput = z.infer<typeof ToolEditOutputSchema>;
export type ParsedToolSearchInput = z.infer<typeof ToolSearchInputSchema>;
export type ParsedToolGlobOutput = z.infer<typeof ToolGlobOutputSchema>;
export type ParsedToolGrepOutput = z.infer<typeof ToolGrepOutputSchema>;
export type ParsedToolWebFetchInput = z.infer<typeof ToolWebFetchInputSchema>;
export type ParsedToolWebFetchOutput = z.infer<typeof ToolWebFetchOutputSchema>;
export type ParsedToolWebSearchOutput = z.infer<typeof ToolWebSearchOutputSchema>;
type NormalizePathFn = (filePath: string) => string | undefined;
export declare function toShellToolDetail(input: ParsedToolShellInput | null, output: ParsedToolShellOutput | null): ToolCallDetail | undefined;
export declare function toReadToolDetail(input: ParsedToolReadInput | null, output: ParsedToolReadOutput | ParsedToolReadOutputWithPath | null, options?: {
    normalizePath?: NormalizePathFn;
}): ToolCallDetail | undefined;
export declare function toWriteToolDetail(input: ParsedToolWriteInput | null, output: ParsedToolWriteOutput | null, options?: {
    normalizePath?: NormalizePathFn;
}): ToolCallDetail | undefined;
export declare function toEditToolDetail(input: ParsedToolEditInput | null, output: ParsedToolEditOutput | null, options?: {
    normalizePath?: NormalizePathFn;
}): ToolCallDetail | undefined;
export declare function toSearchToolDetail(params: {
    input: ParsedToolSearchInput | null;
    output?: ParsedToolGrepOutput | ParsedToolGlobOutput | ParsedToolWebSearchOutput | null;
    toolName?: "search" | "grep" | "glob" | "web_search";
}): ToolCallDetail | undefined;
export declare function toFetchToolDetail(input: ParsedToolWebFetchInput | null, output: ParsedToolWebFetchOutput | null): ToolCallDetail | undefined;
export declare function toolDetailBranchByName<Name extends string, InputSchema extends z.ZodTypeAny, OutputSchema extends z.ZodTypeAny>(name: Name, inputSchema: InputSchema, outputSchema: OutputSchema, mapper: (input: z.infer<InputSchema> | null, output: z.infer<OutputSchema> | null) => ToolCallDetail | undefined): z.ZodEffects<z.ZodObject<{
    name: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    name: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
}>, any> extends infer T ? { [k in keyof T]: T[k]; } : never, z.baseObjectInputType<{
    name: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
}> extends infer T_1 ? { [k_1 in keyof T_1]: T_1[k_1]; } : never>, {
    type: "shell";
    command: string;
    cwd?: string;
    output?: string;
    exitCode?: number | null;
} | {
    type: "read";
    filePath: string;
    content?: string;
    offset?: number;
    limit?: number;
} | {
    type: "edit";
    filePath: string;
    oldString?: string;
    newString?: string;
    unifiedDiff?: string;
} | {
    type: "write";
    filePath: string;
    content?: string;
} | {
    type: "search";
    query: string;
    toolName?: "search" | "grep" | "glob" | "web_search";
    content?: string;
    filePaths?: string[];
    webResults?: Array<{
        title: string;
        url: string;
    }>;
    annotations?: string[];
    numFiles?: number;
    numMatches?: number;
    durationMs?: number;
    durationSeconds?: number;
    truncated?: boolean;
    mode?: "content" | "files_with_matches" | "count";
} | {
    type: "fetch";
    url: string;
    prompt?: string;
    result?: string;
    code?: number;
    codeText?: string;
    bytes?: number;
    durationMs?: number;
} | {
    type: "worktree_setup";
    worktreePath: string;
    branchName: string;
    log: string;
    commands: Array<{
        index: number;
        command: string;
        cwd: string;
        log: string;
        status: "running" | "completed" | "failed";
        exitCode: number | null;
        durationMs?: number;
    }>;
    truncated?: boolean;
} | {
    type: "sub_agent";
    subAgentType?: string;
    description?: string;
    log: string;
    actions: Array<{
        index: number;
        toolName: string;
        summary?: string;
    }>;
} | {
    type: "plain_text";
    label?: string;
    text?: string;
    icon?: import("../agent-sdk-types.js").ToolCallIconName;
} | {
    type: "plan";
    text: string;
} | {
    type: "unknown";
    input: unknown | null;
    output: unknown | null;
} | undefined, z.baseObjectInputType<{
    name: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare function toolDetailBranchByToolName<Name extends string, InputSchema extends z.ZodTypeAny, OutputSchema extends z.ZodTypeAny>(toolName: Name, inputSchema: InputSchema, outputSchema: OutputSchema, mapper: (input: z.infer<InputSchema> | null, output: z.infer<OutputSchema> | null) => ToolCallDetail | undefined): z.ZodEffects<z.ZodObject<{
    toolName: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    toolName: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
}>, any> extends infer T ? { [k in keyof T]: T[k]; } : never, z.baseObjectInputType<{
    toolName: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
}> extends infer T_1 ? { [k_1 in keyof T_1]: T_1[k_1]; } : never>, {
    type: "shell";
    command: string;
    cwd?: string;
    output?: string;
    exitCode?: number | null;
} | {
    type: "read";
    filePath: string;
    content?: string;
    offset?: number;
    limit?: number;
} | {
    type: "edit";
    filePath: string;
    oldString?: string;
    newString?: string;
    unifiedDiff?: string;
} | {
    type: "write";
    filePath: string;
    content?: string;
} | {
    type: "search";
    query: string;
    toolName?: "search" | "grep" | "glob" | "web_search";
    content?: string;
    filePaths?: string[];
    webResults?: Array<{
        title: string;
        url: string;
    }>;
    annotations?: string[];
    numFiles?: number;
    numMatches?: number;
    durationMs?: number;
    durationSeconds?: number;
    truncated?: boolean;
    mode?: "content" | "files_with_matches" | "count";
} | {
    type: "fetch";
    url: string;
    prompt?: string;
    result?: string;
    code?: number;
    codeText?: string;
    bytes?: number;
    durationMs?: number;
} | {
    type: "worktree_setup";
    worktreePath: string;
    branchName: string;
    log: string;
    commands: Array<{
        index: number;
        command: string;
        cwd: string;
        log: string;
        status: "running" | "completed" | "failed";
        exitCode: number | null;
        durationMs?: number;
    }>;
    truncated?: boolean;
} | {
    type: "sub_agent";
    subAgentType?: string;
    description?: string;
    log: string;
    actions: Array<{
        index: number;
        toolName: string;
        summary?: string;
    }>;
} | {
    type: "plain_text";
    label?: string;
    text?: string;
    icon?: import("../agent-sdk-types.js").ToolCallIconName;
} | {
    type: "plan";
    text: string;
} | {
    type: "unknown";
    input: unknown | null;
    output: unknown | null;
} | undefined, z.baseObjectInputType<{
    toolName: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare function toolDetailBranchByNameWithCwd<Name extends string, InputSchema extends z.ZodTypeAny, OutputSchema extends z.ZodTypeAny>(name: Name, inputSchema: InputSchema, outputSchema: OutputSchema, mapper: (input: z.infer<InputSchema> | null, output: z.infer<OutputSchema> | null, cwd: string | null) => ToolCallDetail | undefined): z.ZodEffects<z.ZodObject<{
    name: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
    cwd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    name: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
    cwd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}>, any> extends infer T ? { [k in keyof T]: T[k]; } : never, z.baseObjectInputType<{
    name: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
    cwd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}> extends infer T_1 ? { [k_1 in keyof T_1]: T_1[k_1]; } : never>, {
    type: "shell";
    command: string;
    cwd?: string;
    output?: string;
    exitCode?: number | null;
} | {
    type: "read";
    filePath: string;
    content?: string;
    offset?: number;
    limit?: number;
} | {
    type: "edit";
    filePath: string;
    oldString?: string;
    newString?: string;
    unifiedDiff?: string;
} | {
    type: "write";
    filePath: string;
    content?: string;
} | {
    type: "search";
    query: string;
    toolName?: "search" | "grep" | "glob" | "web_search";
    content?: string;
    filePaths?: string[];
    webResults?: Array<{
        title: string;
        url: string;
    }>;
    annotations?: string[];
    numFiles?: number;
    numMatches?: number;
    durationMs?: number;
    durationSeconds?: number;
    truncated?: boolean;
    mode?: "content" | "files_with_matches" | "count";
} | {
    type: "fetch";
    url: string;
    prompt?: string;
    result?: string;
    code?: number;
    codeText?: string;
    bytes?: number;
    durationMs?: number;
} | {
    type: "worktree_setup";
    worktreePath: string;
    branchName: string;
    log: string;
    commands: Array<{
        index: number;
        command: string;
        cwd: string;
        log: string;
        status: "running" | "completed" | "failed";
        exitCode: number | null;
        durationMs?: number;
    }>;
    truncated?: boolean;
} | {
    type: "sub_agent";
    subAgentType?: string;
    description?: string;
    log: string;
    actions: Array<{
        index: number;
        toolName: string;
        summary?: string;
    }>;
} | {
    type: "plain_text";
    label?: string;
    text?: string;
    icon?: import("../agent-sdk-types.js").ToolCallIconName;
} | {
    type: "plan";
    text: string;
} | {
    type: "unknown";
    input: unknown | null;
    output: unknown | null;
} | undefined, z.baseObjectInputType<{
    name: z.ZodLiteral<Name>;
    input: z.ZodNullable<InputSchema>;
    output: z.ZodNullable<OutputSchema>;
    cwd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export {};
//# sourceMappingURL=tool-call-detail-primitives.d.ts.map