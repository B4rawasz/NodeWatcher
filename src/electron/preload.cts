import { contextBridge, ipcRenderer } from "electron";
import { AnyUiTaskReq, AnyUiTaskRes } from "../shared/tasks";
import { IPC } from "../shared/ipc";

contextBridge.exposeInMainWorld("electron", {
	onTask: (callback: (req: AnyUiTaskReq) => void) =>
		ipcRenderer.on(IPC.UI_TASK_REQ, (_, req: AnyUiTaskReq) => callback(req)),
	sendTaskResponse: (res: AnyUiTaskRes) => ipcRenderer.send(IPC.UI_TASK_RES, res),
});
