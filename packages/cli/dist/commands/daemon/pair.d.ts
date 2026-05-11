import { Command } from "commander";
interface PairOptions {
    home?: string;
    json?: boolean;
}
export declare function pairCommand(): Command;
export declare function runPairCommand(options: PairOptions): Promise<void>;
export {};
//# sourceMappingURL=pair.d.ts.map