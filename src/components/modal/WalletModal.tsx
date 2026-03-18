// components/WalletModal.tsx
import React, { FC, useCallback, useEffect, useState, useRef } from "react";
import {
	useAccount,
	useConnect,
	useDisconnect,
	useSwitchChain,
	useChains,
	Connector,
} from "wagmi";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import trimAddress from "@/utils/trim/trim";
import copy from "copy-to-clipboard";
import usePrevious from "@/hooks/general/usePrevious";
import useWalletModal from "@/hooks/modal/useWalletModal";
import useInstallMetaMaskModal from "@/hooks/modal/useInstallMetaMaskModal";
import Image from "next/image";
import METAMASK from "assets/images/metamask_icon.png";
import ACCOUNT_COPY from "@/assets/images/account_copy_icon.png";
import ETHERSCAN_LINK from "@/assets/images/etherscan_link_icon.png";
import { SUPPORTED_CHAIN_IDS } from "@/constant/index";
import { chainIdState } from "@/recoil/chainId";
import { useRecoilState } from "recoil";
import {
	isMetaMaskInstalled,
	isMobileDevice as checkIsMobileDevice,
	getMetaMaskDeepLink,
	openMetaMask,
} from "@/utils/wallet/metamask";

const WALLET_VIEWS = {
	OPTIONS: "options",
	ACCOUNT: "account",
	PENDING: "pending",
} as const;

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

// Mobile-optimized wallet option with larger touch targets
const WalletOption = ({
	id,
	onClick,
	header,
	subheader,
	icon,
	active = false,
}: {
	id: string;
	onClick?: () => void;
	header: string;
	subheader?: string;
	icon: string;
	active?: boolean;
	link?: string;
	color?: string;
}) => {
	return (
		<button
			id={id}
			className="w-full p-4 sm:p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 flex items-center border-b border-gray-100 min-h-[60px] sm:min-h-[56px] transition-colors touch-manipulation text-left"
			onClick={onClick}
		>
			<div className="flex items-center w-full">
				<div className="mr-4 sm:mr-3 w-8 h-8 sm:w-6 sm:h-6 flex-shrink-0">
					<Image src={METAMASK} alt={header} className="w-full h-full" />
				</div>
				<div className="flex flex-col">
					<span className="font-semibold text-base sm:text-sm text-gray-900">
						{header}
					</span>
					{subheader && (
						<span className="text-xs text-gray-500 mt-0.5 hidden sm:block">
							{subheader}
						</span>
					)}
				</div>
			</div>
		</button>
	);
};

const WalletPending = ({
	error,
	connector,
	setPendingError,
	tryActivation,
}: {
	error: boolean;
	connector: any;
	setPendingError: (error: boolean) => void;
	tryActivation: (connector: any) => void;
}) => {
	return (
		<div className="flex flex-col px-4 py-8 sm:py-6 justify-center items-center">
			{!error && (
				<div className="flex flex-col items-center">
					<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
					<span className="text-gray-600 text-sm">Connecting to wallet...</span>
				</div>
			)}
			{error && (
				<div className="flex flex-col items-center">
					<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
						<svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<span className="text-red-500 mb-4 text-center">
						Connection failed
					</span>
					<button
						className="px-6 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation font-medium"
						onClick={() => {
							setPendingError(false);
							tryActivation(connector);
						}}
					>
						Try again
					</button>
				</div>
			)}
		</div>
	);
};

// Close button component
const CloseButton = ({ onClick }: { onClick: () => void }) => (
	<button
		onClick={onClick}
		className="p-2 -mr-2 text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors touch-manipulation rounded-lg hover:bg-gray-100"
		aria-label="Close modal"
	>
		<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
);

const WalletModal: FC = () => {
	const { address, isConnected, connector: activeConnector } = useAccount();
	const { connect, connectors, error: connectError } = useConnect();
	const { disconnect } = useDisconnect();
	const { chains, switchChain } = useSwitchChain();
	const chain = useChains();
	const [chainId, setChainId] = useRecoilState(chainIdState);
	const { isOpen, closeSelectModal } = useWalletModal();
	const { openInstallModal } = useInstallMetaMaskModal();
	const [view, setView] = useState<string>(WALLET_VIEWS.OPTIONS);
	const [pendingError, setPendingError] = useState(false);
	const [chainSupported, setChainSupported] = useState(true);
	const [hasCopied, setHasCopied] = useState(false);
	const [pendingWallet, setPendingWallet] = useState<Connector | undefined>();
	const [walletView, setWalletView] = useState<string>(WALLET_VIEWS.ACCOUNT);
	const [isMobile, setIsMobile] = useState(() => {
		// Initialize with correct value on client-side
		if (typeof window !== "undefined") {
			return window.innerWidth < 640;
		}
		return false;
	});
	const [isActualMobileDevice, setIsActualMobileDevice] = useState(false);

	const previousAddress = usePrevious(address);
	const prevAddressRef = useRef<string | undefined>(address);

	// Detect mobile device (screen size)
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 640);
		};
		// Check immediately in case SSR value was wrong
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// Detect actual mobile device (user agent)
	useEffect(() => {
		setIsActualMobileDevice(checkIsMobileDevice());
	}, []);

	// Prevent body scroll when modal is open on mobile
	useEffect(() => {
		if (isOpen && isMobile) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen, isMobile]);

	useEffect(() => {
		const { ethereum } = window as any;
		if (!ethereum || !ethereum.request) {
			setChainId(null);
			return;
		}

		const getChainId = async () => {
			try {
				const hexChainId = await ethereum.request({ method: "eth_chainId" });
				const parsed = parseInt("0xAA36A7", 16);
				setChainId(parsed);
			} catch (err) {
				console.error("Failed to get chainId:", err);
				setChainId(null);
			}
		};
		getChainId();

		const handleChainChanged = (hexChainId: string) => {
			try {
				const parsed = parseInt(hexChainId, 16);
				setChainId(parsed);
			} catch {
				setChainId(null);
			}
		};
		ethereum.on("chainChanged", handleChainChanged);
		setWalletView(WALLET_VIEWS.OPTIONS);

		return () => {
			if (ethereum.removeListener) {
				ethereum.removeListener("chainChanged", handleChainChanged);
			}
		};
	}, [setChainId]);

	useEffect(() => {
		if (address && !previousAddress) {
			closeSelectModal();
		}
	}, [address, previousAddress, closeSelectModal]);

	useEffect(() => {
		if (!chainId) return;
		setChainSupported(SUPPORTED_CHAIN_IDS.includes(chainId));
		if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
			disconnect();
			setWalletView(WALLET_VIEWS.OPTIONS);
		}
	}, [chainId, disconnect]);

	useEffect(() => {
		if (isConnected) {
			setView(WALLET_VIEWS.ACCOUNT);
		} else {
			setView(WALLET_VIEWS.OPTIONS);
		}
	}, [isConnected]);

	const handleWalletChange = useCallback(() => {
		setView(WALLET_VIEWS.OPTIONS);
		setWalletView(WALLET_VIEWS.OPTIONS);
	}, []);

	const tryActivation = async (connector: Connector) => {
		// Check if trying to connect with MetaMask
		const isMetaMaskConnector = connector.id === "metaMask" || connector.id === "io.metamask";

		// On mobile, if MetaMask is not installed, show install modal or deep link
		if (isMetaMaskConnector && !isMetaMaskInstalled()) {
			if (isActualMobileDevice) {
				// On mobile, try to open MetaMask app with deep link
				closeSelectModal();
				openMetaMask();
				return;
			} else {
				// On desktop, show install modal
				closeSelectModal();
				openInstallModal();
				return;
			}
		}

		setPendingWallet(connector);
		setView(WALLET_VIEWS.PENDING);
		setWalletView(WALLET_VIEWS.PENDING);
		if (isConnected && address) setView(WALLET_VIEWS.ACCOUNT);

		try {
			connect({ connector });
		} catch (error) {
			console.error("Connection error:", error);
			setPendingError(true);
		}
	};

	const handleCopy = useCallback(() => {
		if (!address) return;
		copy(address);
		setHasCopied(true);
		setTimeout(() => setHasCopied(false), 2000);
	}, [address]);

	const switchToNetwork = useCallback(async (targetChainId: string) => {
		if (!(window as any).ethereum) return;
		try {
			await (window as any).ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: targetChainId }],
			});
		} catch (error) {
			console.log("Failed to switch network:", error);
		}
	}, []);

	const formatConnectorName = () => {
		if (!activeConnector) return null;

		const walletName = Object.keys(SUPPORTED_WALLETS).find(
			(key) => SUPPORTED_WALLETS[key].connector === activeConnector.id,
		);

		const name = walletName
			? SUPPORTED_WALLETS[walletName].name
			: activeConnector.name;

		return (
			<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
				<span className="text-gray-500 text-sm sm:text-[13px] sm:mr-2.5">
					Connected with {name}
				</span>
				<button
					onClick={handleWalletChange}
					className="px-4 py-2 sm:w-[58px] sm:h-[22px] sm:py-0 bg-[#257eee] text-white font-semibold text-sm sm:text-xs rounded-lg sm:rounded hover:bg-[#1a5cbf] active:bg-[#1650a0] transition-colors touch-manipulation"
				>
					Change
				</button>
			</div>
		);
	};

	const getOptions = () => {
		return connectors.map((connector) => {
			const walletInfo = Object.values(SUPPORTED_WALLETS).find(
				(wallet) => wallet.connector === connector.id,
			) || {
				name: connector.name,
				iconName: "default-wallet.png",
				description: `Connect to your ${connector.name}`,
			};

			return (
				<WalletOption
					id={`connect-${connector.id}`}
					key={connector.id}
					onClick={() => tryActivation(connector)}
					header={walletInfo.name || connector.name}
					subheader={walletInfo.description}
					icon={walletInfo.iconName}
					active={connector === activeConnector}
				/>
			);
		});
	};

	useEffect(() => {
		if (
			prevAddressRef.current &&
			address &&
			prevAddressRef.current !== address
		) {
			window.location.reload();
		}
		prevAddressRef.current = address;
	}, [address]);

	useEffect(() => {
		if (typeof window !== "undefined" && (window as any).ethereum) {
			const ethereum = (window as any).ethereum;

			const handleAccountsChanged = (accounts: string[]) => {
				if (accounts.length === 0) {
					disconnect();
					closeSelectModal();
				} else {
					const newAddress = accounts[0];
					if (newAddress !== address) {
						window.location.reload();
					}
				}
			};

			const handleChainChanged = () => {
				window.location.href = "/";
			};

			const handleDisconnect = () => {
				disconnect();
				closeSelectModal();
			};

			const handleConnect = () => {
				window.location.reload();
			};

			const checkConnection = async () => {
				try {
					const accounts = await ethereum.request({
						method: "eth_accounts",
					});
					if (accounts.length > 0 && !isConnected) {
						window.location.reload();
					}
				} catch (error) {
					console.error("Error checking connection:", error);
				}
			};

			checkConnection();

			ethereum.on("accountsChanged", handleAccountsChanged);
			ethereum.on("chainChanged", handleChainChanged);
			ethereum.on("disconnect", handleDisconnect);
			ethereum.on("connect", handleConnect);

			return () => {
				ethereum.removeListener("accountsChanged", handleAccountsChanged);
				ethereum.removeListener("chainChanged", handleChainChanged);
				ethereum.removeListener("disconnect", handleDisconnect);
				ethereum.removeListener("connect", handleConnect);
			};
		}
	}, [address, disconnect, closeSelectModal, isConnected]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Overlay */}
			<div
				className="fixed inset-0 bg-black/50"
				onClick={closeSelectModal}
			/>

			{/* Modal Content - Centered on both mobile and desktop */}
			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[340px] max-h-[90vh] overflow-auto z-10">
				{/* Network not supported view */}
				{((address && !chainSupported) ||
					(chainId && !SUPPORTED_CHAIN_IDS.includes(chainId))) && (
					<>
						<div className="p-5 sm:p-4 border-b border-gray-100">
							<div className="flex justify-between items-start">
								<div>
									<h2 className="text-xl sm:text-lg font-bold text-gray-900">
										Wrong Network
									</h2>
									<p className="text-sm text-gray-500 mt-1">
										Please switch to a supported network
									</p>
								</div>
								<CloseButton onClick={closeSelectModal} />
							</div>
						</div>
						<div className="p-5 sm:p-4">
							<div className="flex flex-col gap-3">
								<button
									className="w-full bg-blue-500 text-white py-4 sm:py-3 px-4 rounded-xl sm:rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-semibold touch-manipulation"
									onClick={() => switchToNetwork("0x1")}
								>
									Switch to Ethereum Mainnet
								</button>
								<button
									className="w-full bg-gray-100 text-gray-700 py-4 sm:py-3 px-4 rounded-xl sm:rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-semibold touch-manipulation"
									onClick={() => switchToNetwork("0xaa36a7")}
								>
									Switch to Sepolia Testnet
								</button>
							</div>
						</div>
					</>
				)}

				{/* Account view */}
				{view === WALLET_VIEWS.ACCOUNT &&
					address &&
					SUPPORTED_CHAIN_IDS.includes(chainId || 0) && (
					<>
						{/* Header */}
						<div className="p-5 sm:p-4 border-b border-gray-100">
							<div className="flex justify-between items-start">
								<div>
									<h2 className="text-xl sm:text-lg font-bold text-gray-900">
										Connected
									</h2>
								</div>
								<CloseButton onClick={closeSelectModal} />
							</div>
						</div>

						<div className="p-5 sm:p-4">
							{/* Profile Section */}
							<div className="flex flex-col items-center mb-6">
								{/* Avatar */}
								<div className="mb-4">
									<Jazzicon
										diameter={64}
										seed={jsNumberForAddress(address)}
									/>
								</div>

								{/* Address */}
								<div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
									<span className="text-base font-semibold text-gray-800 font-mono">
										{trimAddress({
											address: address,
											firstChar: 6,
											lastChar: 4,
											dots: "...",
										})}
									</span>
									<button
										className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded-full transition-colors touch-manipulation"
										onClick={handleCopy}
										title={hasCopied ? "Copied!" : "Copy address"}
									>
										{hasCopied ? (
											<svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
										) : (
											<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
										)}
									</button>
								</div>
							</div>

							{/* Wallet Info Card */}
							<div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 mb-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
											<Image src={METAMASK} alt="MetaMask" className="w-6 h-6" />
										</div>
										<div>
											<p className="text-sm font-semibold text-gray-900">
												{activeConnector?.name || "MetaMask"}
											</p>
											<p className="text-xs text-gray-500">Connected</p>
										</div>
									</div>
									<div className="flex items-center gap-1.5">
										<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
										<span className="text-xs text-green-600 font-medium">Active</span>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3 mb-4">
								<a
									href={`https://etherscan.io/address/${address}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl transition-colors touch-manipulation"
								>
									<svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
									<span className="text-sm font-medium text-gray-700">Explorer</span>
								</a>
								<button
									onClick={handleWalletChange}
									className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 rounded-xl transition-colors touch-manipulation"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
									</svg>
									<span className="text-sm font-medium">Switch</span>
								</button>
							</div>

							{/* Disconnect Button */}
							<button
								className="w-full py-3.5 border-2 border-red-200 text-red-500 font-semibold hover:bg-red-50 hover:border-red-300 active:bg-red-100 rounded-xl transition-all touch-manipulation"
								onClick={() => {
									disconnect();
									closeSelectModal();
								}}
							>
								Disconnect
							</button>
						</div>
					</>
				)}

				{/* Connect wallet options view */}
				{view === WALLET_VIEWS.OPTIONS &&
					(chainId === null || SUPPORTED_CHAIN_IDS.includes(chainId)) && (
					<>
						<div className="p-5 sm:p-4 border-b border-gray-100">
							<div className="flex justify-between items-start">
								<div>
									<h2 className="text-xl sm:text-lg font-bold text-gray-900">
										Connect Wallet
									</h2>
									<p className="text-sm text-gray-500 mt-1">
										Choose your preferred wallet
									</p>
								</div>
								<CloseButton onClick={closeSelectModal} />
							</div>
						</div>
						<div className="overflow-y-auto">
							{walletView === WALLET_VIEWS.PENDING ? (
								<WalletPending
									connector={pendingWallet}
									error={pendingError}
									setPendingError={setPendingError}
									tryActivation={tryActivation}
								/>
							) : (
								<div className="divide-y divide-gray-100">
									{getOptions()}
								</div>
							)}
							{walletView !== WALLET_VIEWS.PENDING && (
								<div className="p-5 sm:p-4 border-t border-gray-100 bg-gray-50">
									<p className="text-sm text-gray-500">
										New to Ethereum?{" "}
										<a
											href="https://ethereum.org/wallets/"
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-500 hover:text-blue-600 font-medium"
										>
											Learn about wallets
										</a>
									</p>
								</div>
							)}
						</div>
					</>
				)}

				{/* Pending connection view */}
				{view === WALLET_VIEWS.PENDING && (
					<>
						<div className="p-5 sm:p-4 border-b border-gray-100">
							<div className="flex justify-between items-start">
								<div>
									<h2 className="text-xl sm:text-lg font-bold text-gray-900">
										Connecting...
									</h2>
									<p className="text-sm text-gray-500 mt-1">
										Please confirm in your wallet
									</p>
								</div>
								<CloseButton onClick={closeSelectModal} />
							</div>
						</div>
						<WalletPending
							connector={pendingWallet}
							error={pendingError}
							setPendingError={setPendingError}
							tryActivation={tryActivation}
						/>
					</>
				)}
			</div>
		</div>
	);
};

export default WalletModal;
