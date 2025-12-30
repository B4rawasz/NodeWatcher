import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";

import { getPreloadPath } from "./utils/pathResolver.js";
import { isDev } from "./utils/utils.js";

app.on("ready", () => {
	const mainWindow = new BrowserWindow({
		webPreferences: {
			preload: getPreloadPath(),
		},
	});
	if (isDev()) {
		mainWindow.loadURL("http://localhost:5050");
	} else {
		mainWindow.loadFile(path.join(app.getAppPath(), "dist-react", "index.html"));
	}
});
