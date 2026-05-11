import type { Logger } from "pino";
export declare function renderPairingQr(url: string): Promise<string>;
export declare function printPairingQrIfEnabled(args: {
    url: string;
    logger?: Logger;
}): Promise<void>;
//# sourceMappingURL=pairing-qr.d.ts.map