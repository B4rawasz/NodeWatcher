import { EventEmitter } from "events";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { UiTaskBroker } from "../task_broker/task_broker.js";
import { logger, LoggerInstance } from "../logger/logger.js";
import { messages, Notification } from "@nodewatcher/shared";
import crypto from "crypto";

interface WebSocketClientOptions {
	rejectUnauthorized: boolean;
}

interface ClientData {
	uuid: string;
	ws_uuid?: string;
	url: string;
	name: string;
	user: string;
	key: string;
	termimationReason?: string;
	options: WebSocketClientOptions;
}

export interface TerminationReason {
	uuid: string;
	ws_uuid: string;
	message: string;
}

interface WebSocketClientEvents {
	terminated: (reason: TerminationReason) => void;
	statistics: (stats: messages.StatisticsMessage) => void;
	notification: (notification: Notification) => void;
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
	private ws: WebSocket | null = null;
	private clientData: ClientData;
	private broker = UiTaskBroker.getInstance();
	private logger: LoggerInstance;
	private hasTerminated: boolean = false;

	constructor(url: string, user: string, key: string, name?: string, uuid?: string) {
		super();

		if (!name) {
			name = user;
		}

		this.clientData = {
			uuid: uuid || uuidv4(),
			url,
			name,
			user,
			key,
			options: {
				rejectUnauthorized: true,
			},
		};

		this.logger = logger.registerModule(`WS-${this.clientData.name}-${this.clientData.uuid}`);
		this.logger.info(`Initializing WebSocket client for URL ${url} with user ${user}`);

		this.connect();
	}

	private connect() {
		this.ws = new WebSocket(this.clientData.url, {
			rejectUnauthorized: this.clientData.options.rejectUnauthorized,
		});

		this.ws.on("error", (error: any) => {
			if (error.code === "SELF_SIGNED_CERT_IN_CHAIN" || error.code === "DEPTH_ZERO_SELF_SIGNED_CERT") {
				this.broker
					.requestTask(
						"sslSelfSigned",
						{ url: this.clientData.url },
						`WS-${this.clientData.name}-${this.clientData.uuid}`,
					)
					.then((res) => {
						if (res) {
							this.logger.warn(`User accepted self-signed certificate for URL ${this.clientData.url}`);
							this.clientData.options.rejectUnauthorized = false;
							this.close();
							this.connect();
						} else {
							this.logger.warn(
								`User denied self-signed certificate for URL ${this.clientData.url}. Terminating connection.`,
							);
							this.hasTerminated = true;
							this.emit("terminated", {
								uuid: this.clientData.uuid,
								ws_uuid: this.clientData.ws_uuid || "connection_not_established",
								message: "Connection terminated due to self-signed certificate and user denied trust",
							});
						}
					})
					.catch((err) => {
						this.emit("terminated", {
							uuid: this.clientData.uuid,
							ws_uuid: this.clientData.ws_uuid || "connection_not_established",
							message: `Connection terminated due to error while requesting SSL trust decision: ${err.message}`,
						});
					});
				return;
			}
		});

		this.ws.on("open", () => {
			this.logger.info(`WebSocket connection established to ${this.clientData.url}`);
		});

		this.ws.on("close", (code, reason) => {
			this.logger.warn(`WebSocket connection closed. Code: ${code}, Reason: ${reason.toString()}`);
			if (!this.hasTerminated) {
				this.hasTerminated = true;
				this.emit("terminated", {
					uuid: this.clientData.uuid,
					ws_uuid: this.clientData.ws_uuid || "connection_established_no_uuid",
					message: `Connection closed by server. Code: ${code}, Reason: ${reason.toString()}`,
				});
			}
		});

		this.ws.on("message", (data) => {
			this.logger.verbose(`Received message`, data.toString());

			const message = this.parseMessage(data.toString());

			if (!message) {
				this.logger.error(`Failed to parse incoming message. Ignoring.`);
				return;
			}

			switch (message.type) {
				case messages.MessageType.UNKNOWN:
					this.logger.warn(`Received message with unknown type. Message:`, message);
					break;
				case messages.MessageType.ERROR:
					this.logger.error(`Received error message from server. Code: ${message.code}, Message: ${message.message}`);
					break;
				case messages.MessageType.AUTH_CHALLENGE:
					this.logger.info(`Received authentication challenge from server. Handling authentication.`);
					this.handleAuthChallenge(message);
					break;
				case messages.MessageType.AUTH_RESULT:
					this.logger.info(`Received authentication result from server.`);
					this.handleAuthResult(message);
					break;
				default:
					this.logger.info(`Received valid message of type ${message.type}. Processing...`);
					// Here you would add logic to handle the different message types as needed
					break;
			}
		});
	}

	close() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	private parseMessage(data: string): messages.Message | null {
		try {
			const msg = JSON.parse(data);

			if (!msg.type || typeof msg.type !== "string") {
				this.logger.error("Message missing or invalid type field");
				return null;
			}

			const validTypes = Object.values(messages.MessageType);
			if (!validTypes.includes(msg.type)) {
				this.logger.error(`Unknown message type: ${msg.type}`);
				return {
					type: messages.MessageType.UNKNOWN,
					...msg,
				} as messages.Unknown;
			}

			return msg as messages.Message;
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			this.logger.error(`Failed to parse message: ${error.message}`);
			return null;
		}
	}

	private handleAuthChallenge(message: messages.AuthChallenge) {
		if (this.ws === null) {
			this.logger.error(`Cannot handle auth challenge because WebSocket connection is not established`);
			return;
		}

		this.clientData.ws_uuid = message.uuid;

		const key = "f86f15625d3e48929fb2a608d3028a5c3c3194d8db728fc546fa2c902610b319";

		const hmac = crypto.createHmac("sha256", key);
		hmac.update(message.nonce);
		const token = hmac.digest("hex");

		const authResponse: messages.AuthResponse = {
			type: messages.MessageType.AUTH_RESPONSE,
			hmac: "test-user_" + token,
		};

		this.logger.info(`Sending authentication response to server`);
		this.logger.verbose(`Auth response content:`, authResponse);
		this.ws.send(JSON.stringify(authResponse));
	}

	private handleAuthResult(message: messages.AuthResult) {
		if (message.success) {
			this.logger.info(`Authentication successful`);
		} else {
			this.logger.warn(`Authentication failed. Reason: ${message.reason}`);
			this.hasTerminated = true;
			this.emit("terminated", {
				uuid: this.clientData.uuid,
				ws_uuid: this.clientData.ws_uuid || "auth_failed_no_uuid",
				message: `Authentication failed. Reason: ${message.reason}`,
			});
			this.close();
		}
	}
}

export default WebSocketClient;
