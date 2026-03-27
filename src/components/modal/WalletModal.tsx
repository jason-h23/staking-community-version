import React, { FC, useCallback, useEffect, useState, useRef } from "react";
import {
	useAccount,
	useConnect,
	useDisconnect,
	useSwitchChain,
	Connector,
} from "wagmi";
import copy from "copy-to-clipboard";
import usePrevious from "@/hooks/general/usePrevious";
import useWalletModal from "@/hooks/modal/useWalletModal";
import useInstallMetaMaskModal from "@/hooks/modal/useInstallMetaMaskModal";
import { SUPPORTED_CHAIN_IDS } from "@/constant/index";
import { chainIdState } from "@/recoil/chainId";
import { useRecoilState } from "recoil";
import {
	isMetaMaskInstalled,
	isMobileDevice as checkIsMobileDevice,
	openMetaMask,
} from "@/utils/wallet/metamask";
import dynamic from "next/dynamic";

const WalletAccount = dynamic(
	() =>
		import("./wallet/WalletAccount").then((mod) => ({
			default: mod.WalletAccount,
		})),
	{ ssr: false },
);

const WalletOptions = dynamic(
	() =>
		import("./wallet/WalletOptions").then((mod) => ({
			default: mod.WalletOptions,
		})),
	{ ssr: false },
);

const WalletNetwork = dynamic(
	() =>
		import("./wallet/WalletNetwork").then((mod) => ({
			default: mod.WalletNetwork,
		})),
	{ ssr: false },
);

const WalletPendingView = dynamic(
	() =>
		import("./wallet/WalletPending").then((mod) => ({
			default: mod.WalletPending,
		})),
	{ ssr: false },
);

const CloseButton = dynamic(
	() =>
		import("./wallet/CloseButton").then((mod) => ({
			default: mod.CloseButton,
		})),
	{ ssr: false },
);

const WALLET_VIEWS = {
	OPTIONS: "options",
	ACCOUNT: "account",
	PENDING: "pending",
} as const;

const WalletModal: FC = () => {
	const { address, isConnected, connector: activeConnector } = useAccount();
	const { connect, connectors } = useConnect();
	const { disconnect } = useDisconnect();
	useSwitchChain();
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
		if (typeof window !== "undefined") {
			return window.innerWidth < 640;
		}
		return false;
	});
	const [isActualMobileDevice, setIsActualMobileDevice] = useState(false);

	const previousAddress = usePrevious(address);
	const prevAddressRef = useRef<string | undefined>(address);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		setIsActualMobileDevice(checkIsMobileDevice());
	}, []);

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
		const ethereum = window.ethereum;
		if (!ethereum || !ethereum.request) {
			setChainId(null);
			return;
		}

		const getChainId = async () => {
			try {
				const hexChainId = await ethereum.request({
					method: "eth_chainId",
				});
				const parsed = parseInt(String(hexChainId), 16);
				setChainId(parsed);
			} catch {
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
		const isMetaMaskConnector =
			connector.id === "metaMask" || connector.id === "io.metamask";

		if (isMetaMaskConnector && !isMetaMaskInstalled()) {
			if (isActualMobileDevice) {
				closeSelectModal();
				openMetaMask();
				return;
			} else {
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
		} catch {
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
		if (!window.ethereum) return;
		try {
			await window.ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: targetChainId }],
			});
		} catch {
			// non-critical
		}
	}, []);

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
		if (typeof window !== "undefined" && window.ethereum) {
			const ethereum = window.ethereum;

			const handleAccountsChanged = (accounts: unknown[]) => {
				const typedAccounts = accounts as string[];
				if (typedAccounts.length === 0) {
					disconnect();
					closeSelectModal();
				} else {
					const newAddress = typedAccounts[0];
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
					const accounts = (await ethereum.request({
						method: "eth_accounts",
					})) as string[];
					if (accounts.length > 0 && !isConnected) {
						window.location.reload();
					}
				} catch {
					// non-critical
				}
			};

			checkConnection();

			ethereum.on("accountsChanged", handleAccountsChanged);
			ethereum.on("chainChanged", handleChainChanged);
			ethereum.on("disconnect", handleDisconnect);
			ethereum.on("connect", handleConnect);

			return () => {
				ethereum.removeListener(
					"accountsChanged",
					handleAccountsChanged,
				);
				ethereum.removeListener("chainChanged", handleChainChanged);
				ethereum.removeListener("disconnect", handleDisconnect);
				ethereum.removeListener("connect", handleConnect);
			};
		}
	}, [address, disconnect, closeSelectModal, isConnected]);

	if (!isOpen) return null;

	const showNetwork =
		(address && !chainSupported) ||
		(chainId && !SUPPORTED_CHAIN_IDS.includes(chainId));
	const showAccount =
		view === WALLET_VIEWS.ACCOUNT &&
		address &&
		SUPPORTED_CHAIN_IDS.includes(chainId || 0);
	const showOptions =
		view === WALLET_VIEWS.OPTIONS &&
		(chainId === null || SUPPORTED_CHAIN_IDS.includes(chainId));
	const showPending = view === WALLET_VIEWS.PENDING;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="fixed inset-0 bg-black/50"
				onClick={closeSelectModal}
			/>
			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[340px] max-h-[90vh] overflow-auto z-10">
				{showNetwork && (
					<WalletNetwork
						switchToNetwork={switchToNetwork}
						closeSelectModal={closeSelectModal}
					/>
				)}

				{showAccount && (
					<WalletAccount
						address={address}
						activeConnector={activeConnector}
						hasCopied={hasCopied}
						handleCopy={handleCopy}
						handleWalletChange={handleWalletChange}
						disconnect={disconnect}
						closeSelectModal={closeSelectModal}
					/>
				)}

				{showOptions && (
					<WalletOptions
						connectors={connectors}
						activeConnector={activeConnector}
						walletView={walletView}
						pendingWallet={pendingWallet}
						pendingError={pendingError}
						setPendingError={setPendingError}
						tryActivation={tryActivation}
						closeSelectModal={closeSelectModal}
					/>
				)}

				{showPending && (
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
						<WalletPendingView
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
