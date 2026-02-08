import { ThemeProvider } from "@/components/theme-provider";
import { Component } from "@/components/custom/test";
import { useEffect } from "react";

function App() {
	// ipc on example
	useEffect(() => {
		window.electron.onTask((req) => {
			console.log("Received task request:", req);

			if (req.type === "sslSelfSigned") {
				let p = req.payload;
				let ans = confirm(`Is the SSL certificate for ${p.url} self-signed?`);

				window.electron.sendTaskResponse({
					id: req.id,
					type: req.type,
					payload: ans,
				});
			}
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
