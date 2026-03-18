import { createConfig, http } from "@wagmi/core";
import { mainnet, sepolia } from "@wagmi/core/chains";
import { metaMask } from "@wagmi/connectors";
import { PUBLIC_MAINNET_RPC, PUBLIC_SEPOLIA_RPC } from "@/constant";

export const config = createConfig({
	chains: [mainnet, sepolia],
	connectors: [metaMask()],
	transports: {
		[mainnet.id]: http(PUBLIC_MAINNET_RPC),
		[sepolia.id]: http(PUBLIC_SEPOLIA_RPC),
	},
});
