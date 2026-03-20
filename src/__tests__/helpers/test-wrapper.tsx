import React from "react";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

const testConfig = createConfig({
	chains: [mainnet, sepolia],
	transports: {
		[mainnet.id]: http(),
		[sepolia.id]: http(),
	},
});

function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
		},
	});
}

interface TestWrapperProps {
	children: React.ReactNode;
}

export function TestWrapper({ children }: TestWrapperProps) {
	const queryClient = createTestQueryClient();

	return (
		<WagmiProvider config={testConfig}>
			<QueryClientProvider client={queryClient}>
				<RecoilRoot>{children}</RecoilRoot>
			</QueryClientProvider>
		</WagmiProvider>
	);
}

export function createTestWrapper() {
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <TestWrapper>{children}</TestWrapper>;
	};
}
