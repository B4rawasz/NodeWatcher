import { ThemeProvider } from "@/components/theme-provider";
import { Component } from "@/components/custom/test";
import { useEffect } from "react";

function App() {
	// ipc on example
	useEffect(() => {
		window.electron.on("decision-request", (data) => {
			console.log("Otrzymano żądanie decyzji:", data.type);
			// Tutaj można dodać logikę wyświetlania monitu użytkownikowi

			if (data.type === "selfSignedCert") {
				console.log("ok");
			}
		});
	}, []);
	// ipc invoke example
	useEffect(() => {
		async function sendDecisionResponse() {
			const response = await window.electron.invoke("decision-response", {
				decisionId: "decision-123",
				value: "accept",
			});
			console.log("Odpowiedź z main process:", response);
		}

		sendDecisionResponse();
	}, []);
	// ipc send example
	useEffect(() => {
		window.electron.send("ui-log", {
			level: "info",
			message: "Aplikacja UI została uruchomiona.",
		});
	}, []);

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<div>
				<Component />
			</div>
		</ThemeProvider>
	);
}

export default App;
