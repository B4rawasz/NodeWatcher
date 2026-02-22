import type { messages } from "./ws_messages.js";

export type Statistics<K extends keyof messages.StatisticsMessageMap> = {
	source: string;
	type: K;
	message: messages.StatisticsMessageMap[K];
};

export type Notification = {
	source: string;
	type: "info" | "success" | "error";
	title: string;
	message: string;
};
