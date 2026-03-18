"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/client/queryClient";
import { usePublicClient, useAccount, useChainId } from "wagmi";
import { TONStakingProvider } from "@tokamak-ecosystem/staking-sdk-react-kit";
import { Header } from "@/components/header";
import Modals from "./Modal";
import { getRpcUrl } from "@/constant/contracts";
import { useRecoilState } from "recoil";
import { networkModalStatus, installMetaMaskModalStatus } from "@/recoil/modal/atom";
import { SUPPORTED_CHAIN_IDS } from "@/constant";
import {
	isMetaMaskInstalled,
	isMobileDevice,
	isInMetaMaskBrowser,
} from "@/utils/wallet/metamask";

// Component to monitor wallet state and trigger modals
function WalletStateMonitor() {
	const { isConnected } = useAccount();
	const chainId = useChainId();
	const [, setNetworkModalOpen] = useRecoilState(networkModalStatus);
	const [, setInstallModalOpen] = useRecoilState(installMetaMaskModalStatus);
	const [hasCheckedInitially, setHasCheckedInitially] = useState(false);

	// Check for wrong network when connected
	useEffect(() => {
		if (isConnected && chainId) {
			const isWrongNetwork = !SUPPORTED_CHAIN_IDS.includes(chainId);
			if (isWrongNetwork) {
				setNetworkModalOpen(true);
			} else {
				setNetworkModalOpen(false);
			}
		}
	}, [isConnected, chainId, setNetworkModalOpen]);

	// Listen for chain changes from ethereum provider
	useEffect(() => {
		const ethereum = (window as any).ethereum;
		if (!ethereum) return;

		const handleChainChanged = (hexChainId: string) => {
			const newChainId = parseInt(hexChainId, 16);
			const isWrongNetwork = !SUPPORTED_CHAIN_IDS.includes(newChainId);
			if (isWrongNetwork && isConnected) {
				setNetworkModalOpen(true);
			} else {
				setNetworkModalOpen(false);
			}
		};

		ethereum.on?.("chainChanged", handleChainChanged);
		return () => {
			ethereum.removeListener?.("chainChanged", handleChainChanged);
		};
	}, [isConnected, setNetworkModalOpen]);

	// Initial check for MetaMask on mobile
	useEffect(() => {
		if (hasCheckedInitially) return;

		// Small delay to ensure window is fully loaded
		const timer = setTimeout(() => {
			const isMobile = isMobileDevice();
			const mmInstalled = isMetaMaskInstalled();
			const inMMBrowser = isInMetaMaskBrowser();

			// On mobile, if not in MetaMask browser and no wallet provider, we might want to show install modal
			// But we don't auto-show it - only show when user tries to connect
			// This check is just for initialization
			setHasCheckedInitially(true);
		}, 500);

		return () => clearTimeout(timer);
	}, [hasCheckedInitially]);

	return null;
}

export default function Entry({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();
	const publicClient = usePublicClient();

	const chainId = useChainId();
	const rpcUrl = getRpcUrl(chainId);

	return (
		<QueryClientProvider client={queryClient}>
			<TONStakingProvider
				rpcUrl={rpcUrl}
				chainId={chainId}
			>
				<div className="flex flex-col min-h-screen bg-gray-50">
					<Header />
					<main className="flex flex-col flex-1 justify-center items-center px-4 py-6 sm:py-8">
						{children}
					</main>
					<Modals />
					<WalletStateMonitor />
				</div>
			</TONStakingProvider>
		</QueryClientProvider>
	);
}
