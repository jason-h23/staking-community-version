import Image from "next/image";
import METAMASK from "assets/images/metamask_icon.png";
import { Connector } from "wagmi";
import { SUPPORTED_WALLETS } from "@/constant/wallets";
import { WalletPending } from "./WalletPending";
import { CloseButton } from "./CloseButton";

const WalletOption = ({
	id,
	onClick,
	header,
	subheader,
}: {
	id: string;
	onClick?: () => void;
	header: string;
	subheader?: string;
	icon?: string;
	active?: boolean;
}) => {
	return (
		<button
			id={id}
			className="w-full p-4 sm:p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 flex items-center border-b border-gray-100 min-h-[60px] sm:min-h-[56px] transition-colors touch-manipulation text-left"
			onClick={onClick}
		>
			<div className="flex items-center w-full">
				<div className="mr-4 sm:mr-3 w-8 h-8 sm:w-6 sm:h-6 flex-shrink-0">
					<Image
						src={METAMASK}
						alt={header}
						className="w-full h-full"
					/>
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

interface WalletOptionsProps {
	connectors: readonly Connector[];
	activeConnector: Connector | undefined;
	walletView: string;
	pendingWallet: Connector | undefined;
	pendingError: boolean;
	setPendingError: (error: boolean) => void;
	tryActivation: (connector: Connector) => void;
	closeSelectModal: () => void;
}

export const WalletOptions = ({
	connectors,
	activeConnector,
	walletView,
	pendingWallet,
	pendingError,
	setPendingError,
	tryActivation,
	closeSelectModal,
}: WalletOptionsProps) => {
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

	return (
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
				{walletView === "pending" ? (
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
				{walletView !== "pending" && (
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
	);
};
