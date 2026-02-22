export namespace messages {
	export enum MessageType {
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

	export interface BaseMessage {
		type: MessageType;
	}

	export interface Unknown extends BaseMessage {
		type: MessageType.UNKNOWN;
		[key: string]: any;
	}

	export interface Error extends BaseMessage {
		type: MessageType.ERROR;
		code: number;
		message: string;
	}

	export interface AuthChallenge extends BaseMessage {
		type: MessageType.AUTH_CHALLENGE;
		nonce: string;
		uuid: string;
	}

	export interface AuthResponse extends BaseMessage {
		type: MessageType.AUTH_RESPONSE;
		hmac: string;
	}

	export interface AuthResult extends BaseMessage {
		type: MessageType.AUTH_RESULT;
		success: boolean;
		reason: string;
	}

	export interface SystemInfoStatic extends BaseMessage {
		type: MessageType.SYSTEM_INFO_STATIC;
		hostname: string;
		system_name: string;
		version_id: string;
		kernel_version: string;
		timezone: string;
	}

	export interface SystemInfo extends BaseMessage {
		type: MessageType.SYSTEM_INFO;
		uptime: string;
		local_time: string;
	}

	export interface CpuInfoStatic extends BaseMessage {
		type: MessageType.CPU_INFO_STATIC;
		cpu_model: string;
		cpu_architecture: string;
		cpu_max_frequency: number;
		cpu_cores: number;
		cpu_threads: number;
	}

	export interface CpuInfo extends BaseMessage {
		type: MessageType.CPU_INFO;
		cpu_load_average_1min: number;
		cpu_load_average_5min: number;
		cpu_load_average_15min: number;
		cpu_usage: number;
		per_core_usage: number[];
		cpu_frequency: number;
	}

	/* ===== MESSAGE MAP ===== */

	export type MessageMap = {
		[MessageType.UNKNOWN]: Unknown;
		[MessageType.ERROR]: Error;
		[MessageType.AUTH_CHALLENGE]: AuthChallenge;
		[MessageType.AUTH_RESPONSE]: AuthResponse;
		[MessageType.AUTH_RESULT]: AuthResult;
		[MessageType.SYSTEM_INFO_STATIC]: SystemInfoStatic;
		[MessageType.SYSTEM_INFO]: SystemInfo;
		[MessageType.CPU_INFO_STATIC]: CpuInfoStatic;
		[MessageType.CPU_INFO]: CpuInfo;
	};

	export type StatisticsMessageMap = {
		[MessageType.SYSTEM_INFO_STATIC]: SystemInfoStatic;
		[MessageType.SYSTEM_INFO]: SystemInfo;
		[MessageType.CPU_INFO_STATIC]: CpuInfoStatic;
		[MessageType.CPU_INFO]: CpuInfo;
	};

	export type StatisticsMessageType = keyof StatisticsMessageMap;

	/* ===== DISCRIMINATED UNION ===== */

	export type Message = MessageMap[MessageType];
	export type StatisticsMessage = StatisticsMessageMap[StatisticsMessageType];

	/* ===== HELPER TYPES ===== */

	export type MessageOfType<T extends MessageType> = MessageMap[T];
}
