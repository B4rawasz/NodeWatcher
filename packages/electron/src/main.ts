import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { IPC } from "@nodewatcher/shared";
import { getPreloadPath } from "./utils/pathResolver.js";
import { isDev } from "./utils/utils.js";
import { UiTaskBroker } from "./modules/task_broker/task_broker.js";
import { logger } from "./modules/logger/logger.js";
import { WebSocketManager } from "./modules/websocket/manager.js";

let mainLogger = logger.registerModule("Main");

app.on("ready", async () => {
	mainLogger.info("Application is starting...");
	const mainWindow = new BrowserWindow({
		webPreferences: {
			preload: getPreloadPath(),
		},
	});

	try {
		if (isDev()) {
			await mainWindow.loadURL("http://localhost:5050");
		} else {
			await mainWindow.loadFile(path.join(app.getAppPath(), "dist-react", "index.html"));
		}
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		mainLogger.error("Error loading main window content", err);
		app.quit();
		return;
	}

	mainLogger.info("Main window created and content loaded");

	mainLogger.info("Setting up UI task broker");
	const taskBroker = UiTaskBroker.getInstance((req) => {
		mainWindow.webContents.send(IPC.UI_TASK_REQ, req);
	});

	mainLogger.info("Setting up IPC listeners for UI task responses");
	ipcMain.on(IPC.UI_TASK_RES, (_, res) => {
		taskBroker.handleTaskResponse(res);
	});

	mainLogger.info("Initializing WebSocket manager");
	const socketManager = new WebSocketManager(
		(stats) => {
			mainWindow.webContents.send(IPC.WEBSOCKET_STATS, stats);
		},
		(notification) => {
			mainWindow.webContents.send(IPC.WEBSOCKET_NOTIFICATION, notification);
		},
	);

	mainLogger.info("Creating test WebSocket client");
	socketManager.create("wss://192.168.1.5:9001", "test", "test", "Test Connection");

	//Test();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

/*async function Test() {
	let ws: WebSocket | null = null;
	let notifiedSelfSigned = false;

	function connectWebSocket(ignoreCert = false) {
		const options = ignoreCert ? { rejectUnauthorized: false } : undefined;
		ws = new WebSocket("wss://127.0.0.1:9001", options);

		ws.on("open", () => {
			console.log("WebSocket connected");
		});

		ws.on("message", (data) => {
			console.log(`Received: ${data}`);

			const obj = JSON.parse(data.toString());

			console.log("Received object:", obj.type);

			if (obj.type === "AUTH_CHALLENGE") {
				const key = "f86f15625d3e48929fb2a608d3028a5c3c3194d8db728fc546fa2c902610b319";

				const hmac = crypto.createHmac("sha256", key);
				hmac.update(obj.nonce);
				const token = hmac.digest("hex");

				const authResponse = { type: "AUTH_RESPONSE", hmac: "test-user_" + token };
				console.log("Sending auth response:", authResponse);
				ws?.send(JSON.stringify(authResponse));
			}
		});

		ws.on("error", (err: any) => {
			if ((err.code === "SELF_SIGNED_CERT_IN_CHAIN" || err.code === "DEPTH_ZERO_SELF_SIGNED_CERT") && !ignoreCert) {
				console.log("Wykryto self-signed certificate! Łączę ponownie z pominięciem certyfikatu.");
				notifiedSelfSigned = true;
				notifyUserSelfSignedCert();
				connectWebSocket(true); // Połącz ponownie z ignorowaniem certyfikatu
			} else {
				console.error("WebSocket error:", err);
			}
		});
	}

	connectWebSocket();
}

function notifyUserSelfSignedCert() {
	// Tu możesz wysłać powiadomienie do renderer process przez IPC
	console.log("Uwaga: Połączenie używa self-signed certificate!");
}*/
