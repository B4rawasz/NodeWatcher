import { IpcRendererEvent } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
	subCallback: (callback) => {
		electron.ipcRenderer.on("test", (_: IpcRendererEvent, data: any) => {
			callback(data);
		});
	},
} satisfies Window["electron"]);
