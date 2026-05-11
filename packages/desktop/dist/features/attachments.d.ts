type AttachmentFileResult = {
    path: string;
    byteSize: number;
};
export declare function writeAttachmentBase64(input: {
    attachmentId?: unknown;
    base64?: unknown;
    extension?: unknown;
}): Promise<AttachmentFileResult>;
export declare function copyAttachmentFileToManagedStorage(input: {
    attachmentId?: unknown;
    sourcePath?: unknown;
    extension?: unknown;
}): Promise<AttachmentFileResult>;
export declare function readManagedFileBase64(input: {
    path?: unknown;
}): Promise<string>;
export declare function deleteManagedAttachmentFile(input: {
    path?: unknown;
}): Promise<boolean>;
export declare function garbageCollectManagedAttachmentFiles(input: {
    referencedIds?: unknown;
}): Promise<number>;
export {};
//# sourceMappingURL=attachments.d.ts.map