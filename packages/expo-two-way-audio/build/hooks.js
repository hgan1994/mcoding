import { createPermissionHook } from "expo-modules-core";
import { useEffect, useSyncExternalStore } from "react";
import { getMicrophonePermissionsAsync, isRecording, requestMicrophonePermissionsAsync, } from "./core";
import { addExpoTwoWayAudioEventListener } from "./events";
export const useMicrophonePermissions = createPermissionHook({
    getMethod: getMicrophonePermissionsAsync,
    requestMethod: requestMicrophonePermissionsAsync,
});
export function useIsRecording() {
    const subscribe = (cb) => {
        const sub = addExpoTwoWayAudioEventListener("onRecordingChange", cb);
        return () => sub.remove();
    };
    const getSnapshot = () => isRecording();
    const getServerSnapshot = () => false;
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export function useExpoTwoWayAudioEventListener(eventName, listener) {
    useEffect(() => {
        const sub = addExpoTwoWayAudioEventListener(eventName, listener);
        return () => sub.remove();
    }, [listener]);
}
//# sourceMappingURL=hooks.js.map