import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { SUPPORTED_CHAIN_IDS } from "@/constant";
import {
	isMobileDevice,
	isMetaMaskInstalled,
	isInMetaMaskBrowser,
	getWalletConnectionStatus,
	type WalletConnectionStatus,
} from "@/utils/wallet/metamask";

interface WalletDetectionState {
	isMobile: boolean;
	isMetaMaskInstalled: boolean;
	isInMetaMaskBrowser: boolean;
	connectionStatus: WalletConnectionStatus;
	isWrongNetwork: boolean;
	shouldShowInstallModal: boolean;
	shouldShowNetworkModal: boolean;
}

export default function useWalletDetection() {
	const { address, isConnected } = useAccount();
	const chainId = useChainId();
	
	const [state, setState] = useState<WalletDetectionState>({
		isMobile: false,
		isMetaMaskInstalled: false,
		isInMetaMaskBrowser: false,
		connectionStatus: "not_installed",
		isWrongNetwork: false,
		shouldShowInstallModal: false,
		shouldShowNetworkModal: false,
	});

	// Update detection state
	const updateDetectionState = useCallback(() => {
		const isMobile = isMobileDevice();
		const mmInstalled = isMetaMaskInstalled();
		const inMMBrowser = isInMetaMaskBrowser();
		const connectionStatus = getWalletConnectionStatus(
			isConnected,
			chainId || null,
			SUPPORTED_CHAIN_IDS
		);
		const isWrongNetwork = connectionStatus === "wrong_network";
		
		// Determine if we should show the install modal
		// Show it on mobile when MetaMask is not installed and user is not in MM browser
		const shouldShowInstallModal = 
			!mmInstalled && 
			!inMMBrowser && 
			isMobile;

		// Show network modal when connected but on wrong network
		const shouldShowNetworkModal = isWrongNetwork;

		setState({
			isMobile,
			isMetaMaskInstalled: mmInstalled,
			isInMetaMaskBrowser: inMMBrowser,
			connectionStatus,
			isWrongNetwork,
			shouldShowInstallModal,
			shouldShowNetworkModal,
		});
	}, [isConnected, chainId]);

	// Initialize on mount and when dependencies change
	useEffect(() => {
		updateDetectionState();
	}, [updateDetectionState]);

	// Listen for window resize (mobile/desktop detection)
	useEffect(() => {
		const handleResize = () => {
			updateDetectionState();
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [updateDetectionState]);

	// Listen for ethereum provider changes
	useEffect(() => {
		const ethereum = (window as any).ethereum;
		if (!ethereum) return;

		const handleChainChanged = () => {
			updateDetectionState();
		};

		const handleAccountsChanged = () => {
			updateDetectionState();
		};

		ethereum.on?.("chainChanged", handleChainChanged);
		ethereum.on?.("accountsChanged", handleAccountsChanged);

		return () => {
			ethereum.removeListener?.("chainChanged", handleChainChanged);
			ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
		};
	}, [updateDetectionState]);

	return {
		...state,
		updateDetectionState,
		isConnected,
		address,
		chainId,
	};
}

