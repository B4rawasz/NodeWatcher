import type { IpcMainToRenderer, IpcRendererInvoke } from "./shared/ipc";

namespace messages {
	enum MessageType {
		UNKNOWN = "UNKNOWN",
		ERROR = "ERROR",
		AUTH_CHALLENGE = "AUTH_CHALLENGE",
		AUTH_RESPONSE = "AUTH_RESPONSE",
		AUTH_RESULT = "AUTH_RESULT",
		SYSTEM_INFO_STATIC = "SYSTEM_INFO_STATIC",
		SYSTEM_INFO = "SYSTEM_INFO",
		CPU_INFO_STATIC = "CPU_INFO_STATIC",
		CPU_INFO = "CPU_INFO",
	}
	export interface Message {
		type: MessageType;
	}

	export interface Error extends Message {
		type: MessageType.ERROR;
		code: number;
		message: string;
	}

	export interface AuthChallenge extends Message {
		type: MessageType.AUTH_CHALLENGE;
		nonce: string;
	}

	export interface AuthResponse extends Message {
		type: MessageType.AUTH_RESPONSE;
		hmac: string;
	}

	export interface AuthResult extends Message {
		type: MessageType.AUTH_RESULT;
		success: boolean;
		reason: string;
	}

	export interface SystemInfoStatic extends Message {
		type: MessageType.SYSTEM_INFO_STATIC;
		hostname: string;
		system_name: string;
		version_id: string;
		kernel_version: string;
		timezone: string;
	}

	export interface SystemInfo extends Message {
		type: MessageType.SYSTEM_INFO;
		uptime: string;
		local_time: string;
	}

	export interface CpuInfoStatic extends Message {
		type: MessageType.CPU_INFO_STATIC;
		cpu_model: string;
		cpu_architecture: string;
		cpu_max_frequency: number;
		cpu_cores: number;
		cpu_threads: number;
	}

	export interface CpuInfo extends Message {
		type: MessageType.CPU_INFO;
		cpu_load_average_1min: number;
		cpu_load_average_5min: number;
		cpu_load_average_15min: number;
		cpu_usage: number;
		per_core_usage: number[];
		cpu_frequency: number;
	}
}

declare global {
	interface Window {
		electron: {
			on<K extends keyof IpcMainToRenderer>(channel: K, cb: (data: IpcMainToRenderer[K]) => void): void;

			send<K extends keyof IpcRendererSend>(channel: K, data: IpcRendererSend[K]): void;

			invoke<K extends keyof IpcRendererInvoke>(
				channel: K,
				data: IpcRendererInvoke[K]["request"]
			): Promise<IpcRendererInvoke[K]["response"]>;
		};
	}
}
export {};
