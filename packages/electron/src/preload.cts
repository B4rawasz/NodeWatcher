import { contextBridge, ipcRenderer } from "electron";
import type { AnyUiTaskReq, AnyUiTaskRes } from "@nodewatcher/shared";
//import { IPC } from "@nodewatcher/shared";

// Cant import IPC becouse chromium runtime cant resolve it, so we need to redefine it here
const IPC = {
	UI_TASK_REQ: "ui-task-req",
	UI_TASK_RES: "ui-task-res",
} as const;

contextBridge.exposeInMainWorld("electron", {
	onTask: (callback: (req: AnyUiTaskReq) => void) =>
		ipcRenderer.on(IPC.UI_TASK_REQ, (_, req: AnyUiTaskReq) => callback(req)),
	sendTaskResponse: (res: AnyUiTaskRes) => ipcRenderer.send(IPC.UI_TASK_RES, res),
});
