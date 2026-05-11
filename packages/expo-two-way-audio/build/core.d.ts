import { type PermissionResponse } from "expo-modules-core";
export declare function initialize(): Promise<any>;
export declare function playPCMData(audioData: Uint8Array): any;
export declare function bypassVoiceProcessing(bypass: boolean): any;
export declare function toggleRecording(val: boolean): boolean;
export declare function isRecording(): boolean;
export declare function tearDown(): any;
export declare function restart(): any;
export declare function getMicrophonePermissionsAsync(): Promise<PermissionResponse>;
export declare function requestMicrophonePermissionsAsync(): Promise<PermissionResponse>;
export declare function getMicrophoneModeIOS(): any;
export declare function setMicrophoneModeIOS(): any;
export declare function isPlaying(): boolean;
export declare function stopPlayback(): any;
export declare function pausePlayback(): any;
export declare function resumePlayback(): any;
//# sourceMappingURL=core.d.ts.map