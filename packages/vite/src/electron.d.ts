import type { AnyUiTaskReq, AnyUiTaskRes } from "@nodewatcher/shared";

declare global {
	interface Window {
		electron: {
			onTask(callback: (req: AnyUiTaskReq) => void): void;
			sendTaskResponse(res: AnyUiTaskRes): void;
		};
	}
}
export {};
