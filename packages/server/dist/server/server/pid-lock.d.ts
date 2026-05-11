export interface PidLockInfo {
    pid: number;
    startedAt: string;
    hostname: string;
    uid: number;
    listen: string | null;
    desktopManaged?: boolean;
}
export declare class PidLockError extends Error {
    readonly existingLock?: PidLockInfo | undefined;
    constructor(message: string, existingLock?: PidLockInfo | undefined);
}
export declare function acquirePidLock(paseoHome: string, listen: string | null, options?: {
    ownerPid?: number;
}): Promise<void>;
export declare function updatePidLock(paseoHome: string, patch: {
    listen: string;
}, options?: {
    ownerPid?: number;
}): Promise<void>;
export declare function releasePidLock(paseoHome: string, options?: {
    ownerPid?: number;
}): Promise<void>;
export declare function getPidLockInfo(paseoHome: string): Promise<PidLockInfo | null>;
export declare function isLocked(paseoHome: string): Promise<{
    locked: boolean;
    info?: PidLockInfo;
}>;
//# sourceMappingURL=pid-lock.d.ts.map