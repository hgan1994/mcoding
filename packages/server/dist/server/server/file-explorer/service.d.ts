export type ExplorerEntryKind = "file" | "directory";
export type ExplorerFileKind = "text" | "image" | "binary";
export type ExplorerEncoding = "utf-8" | "base64" | "none";
export interface ListDirectoryParams {
    root: string;
    relativePath?: string;
}
export interface ReadFileParams {
    root: string;
    relativePath: string;
}
export interface FileExplorerEntry {
    name: string;
    path: string;
    kind: ExplorerEntryKind;
    size: number;
    modifiedAt: string;
}
export interface FileExplorerDirectory {
    path: string;
    entries: FileExplorerEntry[];
}
export interface FileExplorerFile {
    path: string;
    kind: ExplorerFileKind;
    encoding: ExplorerEncoding;
    content?: string;
    mimeType?: string;
    size: number;
    modifiedAt: string;
}
export declare function listDirectoryEntries({ root, relativePath, }: ListDirectoryParams): Promise<FileExplorerDirectory>;
export declare function readExplorerFile({ root, relativePath, }: ReadFileParams): Promise<FileExplorerFile>;
export declare function getDownloadableFileInfo({ root, relativePath }: ReadFileParams): Promise<{
    path: string;
    absolutePath: string;
    fileName: string;
    mimeType: string;
    size: number;
}>;
//# sourceMappingURL=service.d.ts.map