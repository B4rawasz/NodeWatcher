import { EventEmitter } from "events";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

enum ClientState {
	DISCONNECTED = "DISCONNECTED",
	CONNECTING = "CONNECTING",
	AUTHENTICATING = "AUTHENTICATING",
	AUTHENTICATED = "AUTHENTICATED",
	DISCONNECTING = "DISCONNECTING",
	ERROR = "ERROR",
	WAITING_FOR_USER = "WAITING_FOR_USER",
}

interface ClientData {
	uuid: string;
	url: string;
	name: string;
	user: string;
	key: string;
	state: ClientState;
}

interface Error {
	uuid: string;
	ws_uuid: string;
	message: string;
}

interface SelfSignedError extends Error {
	url: string;
}

interface WebSocketClientEvents {
	selfSignedCert: (error: SelfSignedError) => void;
}

abstract class EventEmmiterTyped extends EventEmitter {
	override on<K extends keyof WebSocketClientEvents>(event: K, listener: WebSocketClientEvents[K]): this {
		return super.on(event, listener);
	}
	override emit<K extends keyof WebSocketClientEvents>(
		event: K,
		...args: Parameters<WebSocketClientEvents[K]>
	): boolean {
		return super.emit(event, ...args);
	}
}

class WebSocketClient extends EventEmmiterTyped {
	#ws: WebSocket | null = null;
	#clientData: ClientData | null = null;

	connect(url: string, user: string, key: string, name?: string) {
		if (!name) {
			name = user;
		}

		this.#clientData = {
			uuid: uuidv4(),
			url,
			name,
			user,
			key,
			state: ClientState.DISCONNECTED,
		};

		this.#ws = new WebSocket(url);

		this.#ws.on("error", (error: any) => {
			if (error.code === "SELF_SIGNED_CERT_IN_CHAIN" || error.code === "DEPTH_ZERO_SELF_SIGNED_CERT") {
				const selfSignedError: SelfSignedError = {
					uuid: uuidv4(),
					ws_uuid: this.#clientData!.uuid,
					message: "Self-signed certificate detected",
					url: this.#clientData!.url,
				};
				this.emit("selfSignedCert", selfSignedError);
			} else {
			}
		});
	}
}

export default WebSocketClient;
