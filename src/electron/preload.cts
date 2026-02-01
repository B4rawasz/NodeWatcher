import { contextBridge, ipcRenderer } from "electron";
import type { IpcMainToRenderer, IpcRendererInvoke, IpcRendererSend } from "../shared/ipc";

contextBridge.exposeInMainWorld("electron", {
	on<K extends keyof IpcMainToRenderer>(channel: K, cb: (data: IpcMainToRenderer[K]) => void) {
		ipcRenderer.on(channel, (_, data) => cb(data));
	},

	send<K extends keyof IpcRendererSend>(channel: K, data: IpcRendererSend[K]) {
		ipcRenderer.send(channel, data);
	},

	invoke<K extends keyof IpcRendererInvoke>(
		channel: K,
		data: IpcRendererInvoke[K]["request"]
	): Promise<IpcRendererInvoke[K]["response"]> {
		return ipcRenderer.invoke(channel, data);
	},
});
