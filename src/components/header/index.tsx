// components/StakingHeader.tsx
import React, { useCallback } from "react";
import { Connector, useAccount, useChainId } from "wagmi";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
	useConnect,
	useDisconnect,
	useBalance,
	useSwitchChain,
	useChains,
} from "wagmi";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import trimAddress from "@/utils/trim/trim";
import copy from "copy-to-clipboard";
import METAMASK from "assets/images/metamask_icon.png";
import ACCOUNT_COPY from "assets/images/account_copy_icon.png";
import ETHERSCAN_LINK from "assets/images/etherscan_link_icon.png";
import useWalletModal from "@/hooks/modal/useWalletModal";
import { DEFAULT_NETWORK, SUPPORTED_CHAIN_IDS } from "@/constant";

const WALLET_VIEWS = {
	OPTIONS: "options",
	OPTIONS_SECONDARY: "options_secondary",
	ACCOUNT: "account",
	PENDING: "pending",
};

export const SUPPORTED_WALLETS: { [key: string]: any } = {
	METAMASK: {
		connector: "metaMask",
		name: "MetaMask",
		iconName: "metamask_icon.png",
		description: "Connect to your MetaMask Wallet",
		color: "#E8831D",
	},
	WALLET_CONNECT: {
		connector: "walletConnect",
		name: "WalletConnect",
		iconName: "walletConnectIcon.svg",
		description: "Connect to your WalletConnect Wallet",
		color: "#3B99FC",
	},
	COINBASE_WALLET: {
		connector: "coinbaseWallet",
		name: "Coinbase Wallet",
		iconName: "coinbaseWalletIcon.svg",
		description: "Connect to your Coinbase Wallet",
		color: "#315CF5",
	},
};

export const Header = () => {
	const { onOpenSelectModal } = useWalletModal();
	const { address, isConnected, connector: activeConnector } = useAccount();
	const chainId = useChainId();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<header className="py-3 sm:py-4 sticky z-10 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100">
				<div className="max-w-screen-xl mx-auto px-3 sm:px-4">
					<div className="flex justify-between items-center gap-2">
						{/* Logo Section */}
						<div className="flex items-center min-w-0 flex-shrink">
							<h1 className="flex flex-row items-center text-lg sm:text-2xl font-extrabold font-nanum-square">
								<span className="whitespace-nowrap">Tokamak</span>
								<span className="text-blue-500 ml-1 whitespace-nowrap">
									staking
								</span>
								<span className="hidden sm:inline-block w-[67px] ml-1 text-[10px] sm:text-[11px] leading-[11px] text-gray-500">
									Community version
								</span>
							</h1>
						</div>

						{/* Connect Button */}
						<div className="flex items-center flex-shrink-0">
							<button
								className="border border-[#d7d9df] text-[#86929d] min-w-[120px] sm:min-w-[151px] h-[40px] sm:h-[35px] px-3 sm:px-4 text-sm font-semibold rounded-full bg-white z-[100] hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
								onClick={() => onOpenSelectModal()}
							>
								<span>Connect</span>
							</button>
						</div>
					</div>
				</div>
			</header>
		);
	}

	return (
		<header className="py-3 sm:py-4 sticky z-10 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100">
			<div className="max-w-screen-xl mx-auto px-3 sm:px-4">
				<div className="flex justify-between items-center gap-2">
					{/* Logo Section */}
					<div className="flex items-center min-w-0 flex-shrink">
						<h1 className="flex flex-row items-center text-lg sm:text-2xl font-extrabold font-nanum-square">
							<span className="whitespace-nowrap">Tokamak</span>
							<span className="text-blue-500 ml-1 whitespace-nowrap">
								staking
							</span>
							<span className="hidden sm:inline-block w-[67px] ml-1 text-[10px] sm:text-[11px] leading-[11px] text-gray-500">
								Community version
							</span>
						</h1>
					</div>

					{/* Connect Button */}
					<div className="flex items-center flex-shrink-0">
						<button
							className="border border-[#d7d9df] text-[#86929d] min-w-[120px] sm:min-w-[151px] h-[44px] sm:h-[38px] px-3 sm:px-4 text-sm font-semibold rounded-full bg-white z-[100] hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
							onClick={() => onOpenSelectModal()}
						>
							{address && SUPPORTED_CHAIN_IDS.includes(chainId || 0) ? (
								<div className="flex flex-row justify-center items-center">
									<div className="mr-2 relative top-0.5 flex-shrink-0">
										<Jazzicon
											diameter={22}
											seed={jsNumberForAddress(address as string)}
										/>
									</div>
									<span className="text-left font-normal text-gray-700 text-sm">
										{trimAddress({
											address: address as string,
											firstChar: 4,
											lastChar: 4,
											dots: "...",
										})}
									</span>
								</div>
							) : (
								<span>Connect</span>
							)}
						</button>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
