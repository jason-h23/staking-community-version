/**
 * MetaMask detection and deep linking utilities for mobile wallet support
 */

// Check if we're running on a mobile device
export const isMobileDevice = (): boolean => {
	if (typeof window === "undefined") return false;
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);
};

// Check if we're in an iOS device
export const isIOSDevice = (): boolean => {
	if (typeof window === "undefined") return false;
	return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Check if we're in an Android device
export const isAndroidDevice = (): boolean => {
	if (typeof window === "undefined") return false;
	return /Android/i.test(navigator.userAgent);
};

// Check if MetaMask is installed (works for both browser extension and mobile app browser)
export const isMetaMaskInstalled = (): boolean => {
	if (typeof window === "undefined") return false;
	const ethereum = (window as any).ethereum;
	return Boolean(ethereum && ethereum.isMetaMask);
};

// Check if we're inside the MetaMask in-app browser
export const isInMetaMaskBrowser = (): boolean => {
	if (typeof window === "undefined") return false;
	const ethereum = (window as any).ethereum;
	// MetaMask mobile browser has both isMetaMask and isMobile properties
	return Boolean(
		ethereum &&
		ethereum.isMetaMask &&
		(ethereum.isMobile || isMobileDevice())
	);
};

// Check if any wallet provider is available
export const hasWalletProvider = (): boolean => {
	if (typeof window === "undefined") return false;
	return Boolean((window as any).ethereum);
};

// Get the current dApp URL for deep linking
export const getCurrentDAppUrl = (): string => {
	if (typeof window === "undefined") return "";
	return window.location.href;
};

// Get the MetaMask deep link to open the current dApp
export const getMetaMaskDeepLink = (): string => {
	const dappUrl = getCurrentDAppUrl();
	// Remove the protocol (https:// or http://) for the deep link
	const urlWithoutProtocol = dappUrl.replace(/^https?:\/\//, "");
	
	// MetaMask deep link format
	return `https://metamask.app.link/dapp/${urlWithoutProtocol}`;
};

// Get the MetaMask app store link based on device
export const getMetaMaskAppStoreLink = (): string => {
	if (isIOSDevice()) {
		return "https://apps.apple.com/app/metamask-blockchain-wallet/id1438144202";
	}
	if (isAndroidDevice()) {
		return "https://play.google.com/store/apps/details?id=io.metamask";
	}
	// Default to Chrome extension for desktop
	return "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn";
};

// Open MetaMask app or redirect to app store
export const openMetaMask = (): void => {
	if (typeof window === "undefined") return;

	if (isMobileDevice()) {
		// On mobile, try to open the MetaMask deep link
		// This will either open the app or redirect to app store
		window.location.href = getMetaMaskDeepLink();
	} else {
		// On desktop, open the extension page
		window.open(getMetaMaskAppStoreLink(), "_blank");
	}
};

// Type for wallet connection status
export type WalletConnectionStatus = 
	| "not_installed" 
	| "installed" 
	| "in_metamask_browser" 
	| "wrong_network"
	| "connected";

// Get the current wallet connection status
export const getWalletConnectionStatus = (
	isConnected: boolean,
	chainId: number | null,
	supportedChainIds: number[]
): WalletConnectionStatus => {
	// Check if in MetaMask mobile browser
	if (isInMetaMaskBrowser()) {
		if (isConnected) {
			if (chainId && supportedChainIds.includes(chainId)) {
				return "connected";
			}
			return "wrong_network";
		}
		return "in_metamask_browser";
	}

	// Check if MetaMask is installed
	if (!isMetaMaskInstalled()) {
		return "not_installed";
	}

	// MetaMask is installed
	if (isConnected) {
		if (chainId && supportedChainIds.includes(chainId)) {
			return "connected";
		}
		return "wrong_network";
	}

	return "installed";
};

// Format chain ID for MetaMask requests
export const formatChainIdHex = (chainId: number): string => {
	return `0x${chainId.toString(16)}`;
};

// Network configurations for adding to MetaMask
export const NETWORK_CONFIGS = {
	mainnet: {
		chainId: "0x1",
		chainName: "Ethereum Mainnet",
		nativeCurrency: {
			name: "Ether",
			symbol: "ETH",
			decimals: 18,
		},
		rpcUrls: ["https://mainnet.infura.io/v3/"],
		blockExplorerUrls: ["https://etherscan.io"],
	},
	sepolia: {
		chainId: "0xaa36a7",
		chainName: "Sepolia Testnet",
		nativeCurrency: {
			name: "Sepolia Ether",
			symbol: "ETH",
			decimals: 18,
		},
		rpcUrls: ["https://sepolia.infura.io/v3/"],
		blockExplorerUrls: ["https://sepolia.etherscan.io"],
	},
};

// Switch network in MetaMask
export const switchNetwork = async (chainId: "0x1" | "0xaa36a7"): Promise<boolean> => {
	if (typeof window === "undefined") return false;
	const ethereum = (window as any).ethereum;
	if (!ethereum) return false;

	try {
		await ethereum.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId }],
		});
		return true;
	} catch (error: any) {
		// This error code indicates that the chain has not been added to MetaMask
		if (error.code === 4902) {
			const networkConfig = chainId === "0x1" 
				? NETWORK_CONFIGS.mainnet 
				: NETWORK_CONFIGS.sepolia;
			
			try {
				await ethereum.request({
					method: "wallet_addEthereumChain",
					params: [networkConfig],
				});
				return true;
			} catch (addError) {
				console.error("Failed to add network:", addError);
				return false;
			}
		}
		console.error("Failed to switch network:", error);
		return false;
	}
};

