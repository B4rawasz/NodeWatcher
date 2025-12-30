import { ThemeProvider } from "@/components/theme-provider";
import { Component } from "@/components/custom/test";

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<div>
				<Component />
			</div>
		</ThemeProvider>
	);
}

export default App;
