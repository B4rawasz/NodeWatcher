import WebSocketClient, { TerminationReason } from "./client.js";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../logger/logger.js";
import { messages, Statistics, Notification } from "@nodewatcher/shared";

export class WebSocketManager {
	private sockets = new Map<string, WebSocketClient>();
	private logger = logger.registerModule("WebSocketManager");

	private sendStatistics: (stats: Statistics<messages.StatisticsMessageType>) => void;
	private sendNotifications: (notification: Notification) => void;

	constructor(
		sendStatistics: (stats: Statistics<messages.StatisticsMessageType>) => void,
		sendNotifications: (notification: Notification) => void,
	) {
		this.sendStatistics = sendStatistics;
		this.sendNotifications = sendNotifications;
	}

	create(url: string, user: string, key: string, name?: string) {
		this.logger.info(`Creating WebSocket client for URL ${url} with user ${user}`);

		const uuid = uuidv4();
		const ws = new WebSocketClient(url, user, key, name, uuid);

		ws.on("terminated", (reason) => this.handleTermination(uuid, reason));
		ws.on("statistics", (stats) => this.handleStatistics(stats.type, stats, uuid));
		ws.on("notification", (notification) => this.sendNotifications(notification));

		this.sockets.set(uuid, ws);
		return ws;
	}

	get(id: string) {
		this.logger.verbose(`Retrieving WebSocket client with id ${id}`);
		return this.sockets.get(id);
	}

	close(id: string) {
		this.logger.info(`Closing WebSocket client with id ${id}`);
		this.sockets.get(id)?.close();
		this.sockets.delete(id);
	}

	/* ==== EVENT HANDLING ==== */

	handleTermination(uuid: string, reason: TerminationReason) {
		this.logger.info(`WebSocket client with id ${uuid} terminated: ${reason.message}`);
		this.logger.debug(`Termination reason details:`, reason);
		this.sockets.delete(uuid);
		console.log(this.sockets);
	}

	/* ==== SYSTEM STATS ==== */

	handleStatistics<K extends messages.StatisticsMessageType>(
		type: K,
		stats: messages.StatisticsMessageMap[K],
		uuid: string,
	) {
		const stat: Statistics<K> = {
			source: uuid,
			type: type,
			message: stats,
		};

		this.sendStatistics(stat);
	}
}
