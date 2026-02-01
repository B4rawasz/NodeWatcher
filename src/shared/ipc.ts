import type { DecisionMap } from "./decisions.ts";

// MAIN -> RENDERER
export type IpcMainToRenderer = {
	"decision-request": {
		type: keyof DecisionMap;
		payload: DecisionMap[keyof DecisionMap]["request"];
	};
};

// RENDERER -> MAIN (send)
export type IpcRendererSend = {
	"ui-log": {
		level: "debug" | "info";
		message: string;
	};
};

// RENDERER -> MAIN (invoke)
export type IpcRendererInvoke = {
	"decision-response": {
		request: {
			decisionId: string;
			value: DecisionMap[keyof DecisionMap]["response"];
		};
		response: boolean;
	};
};
