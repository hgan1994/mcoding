export declare class FixedDurationPcmRingBuffer {
    private readonly maxBytes;
    private chunks;
    private totalBytes;
    constructor(params: {
        sampleRate: number;
        channels: number;
        bitsPerSample: number;
        durationMs: number;
    });
    append(chunk: Buffer): void;
    drain(): Buffer;
    get byteLength(): number;
    clear(): void;
}
//# sourceMappingURL=fixed-duration-pcm-ring-buffer.d.ts.map