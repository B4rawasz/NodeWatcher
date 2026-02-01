export type DecisionMap = {
	selfSignedCert: {
		request: {
			decisionId: string;
			wsUuid: string;
			url: string;
		};
		response: "accept" | "reject";
	};

	askPassword: {
		request: {
			decisionId: string;
			wsUuid: string;
			username: string;
		};
		response: string;
	};
};
