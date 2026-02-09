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

export type UiTaskMap = {
	sslSelfSigned: {
		request: SslSelfSignedReq;
		response: SslSelfSignedRes;
	};

	anotherTaskType: {
		request: AnotherTaskTypeReq;
		response: AnotherTaskTypeRes;
	};
};

export type UiTaskType = keyof UiTaskMap;

/* ===== GENERIC TYPES ===== */

export type UiTaskReq<K extends UiTaskType> = {
	id: string;
	source: string;
	type: K;
	payload: UiTaskMap[K]["request"];
	createdAt: number;
};

export type UiTaskRes<K extends UiTaskType> = {
	id: string;
	type: K;
	payload: UiTaskMap[K]["response"];
};

/* ===== DISCRIMINATED UNIONS ===== */

export type AnyUiTaskReq = { [K in UiTaskType]: UiTaskReq<K> }[UiTaskType];
export type AnyUiTaskRes = { [K in UiTaskType]: UiTaskRes<K> }[UiTaskType];
