import { v4 as uuidv4 } from "uuid";
import type { UiTaskRes, UiTaskReq, UiTaskType, AnyUiTaskReq } from "@nodewatcher/shared";
import { logger } from "../logger/logger.js";

export class UiTaskBroker {
	private static instance: UiTaskBroker;
	private logger = logger.registerModule("UiTaskBroker");

	private pendingTasks = new Map<
		string,
		{
			resolve: (res: UiTaskRes<any>["payload"] | PromiseLike<UiTaskRes<any>["payload"]>) => void;
			reject: (err: Error) => void;
			timeout: NodeJS.Timeout;
		}
	>();

	private sendTaskRequest: (req: UiTaskReq<any>) => void;

	constructor(sendTaskRequest: (req: UiTaskReq<any>) => void) {
		this.sendTaskRequest = sendTaskRequest;
	}

	static getInstance(sendTaskRequest?: (req: AnyUiTaskReq) => void): UiTaskBroker {
		if (!UiTaskBroker.instance) {
			if (!sendTaskRequest) {
				throw new Error("UiTaskBroker instance not initialized and no sendTaskRequest function provided");
			}
			UiTaskBroker.instance = new UiTaskBroker(sendTaskRequest);
		}
		return UiTaskBroker.instance;
	}

	requestTask<K extends UiTaskType>(
		type: K,
		payload: UiTaskReq<K>["payload"],
		source: string,
		timeout = 300000,
	): Promise<UiTaskRes<K>["payload"]> {
		const req: UiTaskReq<K> = {
			id: uuidv4(),
			type,
			payload,
			source,
			createdAt: Date.now(),
		};

		this.logger.verbose(`Requesting task of type ${req.type} with id ${req.id}`, req);
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				this.pendingTasks.delete(req.id);
				reject(new Error("Task timed out"));
			}, timeout);

			this.pendingTasks.set(req.id, { resolve, reject, timeout: timeoutId });
			this.sendTaskRequest(req);
		});
	}

	handleTaskResponse<K extends UiTaskType>(res: UiTaskRes<K>) {
		this.logger.verbose(`Handling task response for task id ${res.id} of type ${res.type}`, res);
		const pending = this.pendingTasks.get(res.id);
		if (pending) {
			clearTimeout(pending.timeout);
			pending.resolve(res.payload);
			this.pendingTasks.delete(res.id);
		} else {
			this.logger.warn(`No pending task found for response with id ${res.id}`);
		}
	}
}
