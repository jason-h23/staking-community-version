import { CloseButton } from "./CloseButton";

interface WalletNetworkProps {
	switchToNetwork: (chainId: string) => void;
	closeSelectModal: () => void;
}

export const WalletNetwork = ({
	switchToNetwork,
	closeSelectModal,
}: WalletNetworkProps) => {
	return (
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
	);
};
