/* ===== PAYLOADS ===== */

export interface SslSelfSignedReq {
	url: string;
}

export type SslSelfSignedRes = boolean;

export interface AnotherTaskTypeReq {
	a: number;
	b: number;
}

export interface AnotherTaskTypeRes {
	sum: number;
	s: string;
}

/* ===== MAPS ===== */

export type TaskMap = {
	sslSelfSigned: {
		request: SslSelfSignedReq;
		response: SslSelfSignedRes;
	};

	anotherTaskType: {
		request: AnotherTaskTypeReq;
		response: AnotherTaskTypeRes;
	};
};

export type TaskType = keyof TaskMap;

/* ===== GENERIC TYPES ===== */

export type UiTaskReq<K extends TaskType> = {
	id: string;
	source: string;
	type: K;
	payload: TaskMap[K]["request"];
	createdAt: number;
};

export type UiTaskRes<K extends TaskType> = {
	id: string;
	type: K;
	payload: TaskMap[K]["response"];
};

/* ===== DISCRIMINATED UNIONS ===== */

export type AnyUiTaskReq = { [K in TaskType]: UiTaskReq<K> }[TaskType];
export type AnyUiTaskRes = { [K in TaskType]: UiTaskRes<K> }[TaskType];
