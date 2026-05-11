import WebSocket from "ws";
import { EventEmitter } from "node:events";
export class OpenAIRealtimeTranscriptionSession extends EventEmitter {
    constructor(params) {
        super();
        this.requiredSampleRate = 24000;
        this.ws = null;
        this.ready = null;
        this.closing = false;
        this.partialByItemId = new Map();
        this.apiKey = params.apiKey;
        this.logger = params.logger.child({ provider: "openai", component: "realtime-transcription" });
        this.transcriptionModel = params.transcriptionModel;
        this.language = params.language;
        this.prompt = params.prompt;
        this.turnDetection = params.turnDetection ?? null;
    }
    async connect() {
        if (this.ready) {
            return this.ready;
        }
        this.closing = false;
        this.ready = new Promise((resolve, reject) => {
            const url = "wss://api.openai.com/v1/realtime?intent=transcription";
            const ws = new WebSocket(url, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            this.ws = ws;
            let resolved = false;
            const fail = (error) => {
                if (resolved) {
                    this.emit("error", error);
                    return;
                }
                resolved = true;
                reject(error);
            };
            ws.on("open", () => {
                this.logger.debug("OpenAI realtime transcription websocket connected");
                const update = {
                    type: "session.update",
                    session: {
                        type: "transcription",
                        audio: {
                            input: {
                                format: { type: "audio/pcm", rate: 24000 },
                                transcription: {
                                    model: this.transcriptionModel,
                                    ...(this.language ? { language: this.language } : {}),
                                    ...(this.prompt ? { prompt: this.prompt } : {}),
                                },
                                turn_detection: this.turnDetection,
                            },
                        },
                    },
                };
                ws.send(JSON.stringify(update));
            });
            ws.on("message", (data) => {
                const text = typeof data === "string" ? data : data.toString("utf-8");
                let parsed;
                try {
                    parsed = JSON.parse(text);
                }
                catch {
                    return;
                }
                const event = parsed;
                if (event.type === "session.created" || event.type === "session.updated") {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                    return;
                }
                if (event.type === "input_audio_buffer.committed") {
                    this.emit("committed", {
                        segmentId: event.item_id,
                        previousSegmentId: event.previous_item_id,
                    });
                    return;
                }
                if (event.type === "input_audio_buffer.speech_started") {
                    this.emit("speech_started");
                    return;
                }
                if (event.type === "input_audio_buffer.speech_stopped") {
                    this.emit("speech_stopped");
                    return;
                }
                if (event.type === "conversation.item.input_audio_transcription.delta") {
                    const replaceDelta = this.transcriptionModel === "whisper-1";
                    const prev = this.partialByItemId.get(event.item_id) ?? "";
                    const next = replaceDelta ? event.delta : prev + event.delta;
                    this.partialByItemId.set(event.item_id, next);
                    this.emit("transcript", { segmentId: event.item_id, transcript: next, isFinal: false });
                    return;
                }
                if (event.type === "conversation.item.input_audio_transcription.completed") {
                    this.partialByItemId.set(event.item_id, event.transcript);
                    this.emit("transcript", {
                        segmentId: event.item_id,
                        transcript: event.transcript,
                        isFinal: true,
                    });
                    return;
                }
                if (event.type === "error") {
                    const message = event.error?.message ?? "OpenAI realtime error";
                    fail(new Error(message));
                }
            });
            ws.on("error", (err) => {
                fail(err instanceof Error ? err : new Error(String(err)));
            });
            ws.on("close", () => {
                this.logger.debug("OpenAI realtime websocket closed");
                if (this.closing) {
                    return;
                }
                if (!resolved) {
                    fail(new Error("OpenAI realtime websocket closed before ready"));
                    return;
                }
                fail(new Error("OpenAI realtime websocket closed"));
            });
        });
        return this.ready;
    }
    appendPcm16(pcm16le) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("OpenAI realtime websocket not connected");
        }
        const base64Audio = pcm16le.toString("base64");
        const event = { type: "input_audio_buffer.append", audio: base64Audio };
        this.ws.send(JSON.stringify(event));
    }
    commit() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("OpenAI realtime websocket not connected");
        }
        const event = { type: "input_audio_buffer.commit" };
        this.ws.send(JSON.stringify(event));
    }
    clear() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        const event = { type: "input_audio_buffer.clear" };
        this.ws.send(JSON.stringify(event));
    }
    close() {
        try {
            this.closing = true;
            this.ws?.close();
        }
        catch {
            // no-op
        }
        finally {
            this.ws = null;
            this.ready = null;
        }
    }
}
//# sourceMappingURL=realtime-transcription-session.js.map