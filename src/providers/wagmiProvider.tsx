// providers/wagmi.ts
"use client";

import { http, createConfig } from "wagmi";
// import { MetaMaskConnector } from "@wagmi/connectors/metaMask";
import { mainnet, sepolia } from "@wagmi/core/chains";
import { metaMask } from "@wagmi/connectors";
import { PUBLIC_MAINNET_RPC, PUBLIC_SEPOLIA_RPC } from "@/constant";

const mode = process.env.NEXT_PUBLIC_APP_MODE || "PRODUCTION";

// Conditionally configure chains based on mode
const chains = mode === "PRODUCTION"
	? [mainnet, sepolia] as const  // Support both but prefer mainnet
	: [sepolia, mainnet] as const; // Support both but prefer sepolia

export const wagmiConfig = createConfig({
	chains: chains,
	connectors: [metaMask()],
	transports: {
		[mainnet.id]: http(PUBLIC_MAINNET_RPC),
		[sepolia.id]: http(PUBLIC_SEPOLIA_RPC),
	},
});
