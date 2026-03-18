// import { injected, trazorConnector } from "connectors/";
// import { WalletInfo } from "@/types/wallet";
// import { DEPLOYED_TYPE } from "./type";
import { ethers } from "ethers";

// export const REACT_APP_MODE = process.env.NEXT_PUBLIC_MODE as string;
export const REACT_APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || "PRODUCTION";

export const NetworkContextName = `${new Date().getTime()}-NETWORK`;
export const DEFAULT_NETWORK: string | undefined = 
	process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || "1";
export const SUPPORTED_CHAIN_IDS = [1, 11155111];
// "1"
// REACT_APP_MODE === "PRODUCTION" ? "1" : "11155111";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const PUBLIC_SEPOLIA_RPC = 
	process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://sepolia.gateway.tenderly.co";
export const PUBLIC_MAINNET_RPC = 
	process.env.NEXT_PUBLIC_ETHEREUM_RPC || "https://mainnet.gateway.tenderly.co";

// export const ETHERSCAN_LINK = REACT_APP_MODE === "PRODUCTION" ? "https://etherscan.io" : "https://sepolia.etherscan.io"
export const ETHERSCAN_LINK = 
	REACT_APP_MODE === "PRODUCTION" 
		? "https://etherscan.io" 
		: "https://sepolia.etherscan.io";

export const BASE_PROVIDER = ethers.getDefaultProvider(
	REACT_APP_MODE === "PRODUCTION" ? "mainnet" : "sepolia"
);

// REACT_APP_MODE === "PRODUCTION"
//     ? ethers.getDefaultProvider("mainnet")
//     : ethers.getDefaultProvider("sepolia");

export const RAY = "1000000000000000000000000000";
export const WEI = "1000000000000000000";
