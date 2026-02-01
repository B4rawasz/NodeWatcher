import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import WebSocket from "ws";
import crypto from "crypto";

import { getPreloadPath } from "./utils/pathResolver.js";
import { isDev } from "./utils/utils.js";
import WebSocketClient from "./modules/websocket/client.js";

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

	ipcMain.on("ui-log", (event, data) => {
		console.log("UILOG" + data);
	});

	ipcMain.handle("decision-response", (event, data) => {
		console.log("Otrzymano decyzję od użytkownika:", data);
		mainWindow.webContents.send("decision-request", {
			type: "selfSignedCert",
			payload: {
				decisionId: "decision-123",
				wsUuid: "ws-uuid-456",
				url: "wss://example.com",
			},
		});
		return true;
	});

	const wsClient = new WebSocketClient();

	wsClient.connect("wss://192.168.1.5:9001", "", "");

	//Test();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

async function Test() {
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
}
