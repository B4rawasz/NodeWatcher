interface Window {
	electron: {
		subCallback: (callback: (data: any) => void) => void;
	};
}
