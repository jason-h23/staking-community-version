import Image from "next/image";
import METAMASK from "assets/images/metamask_icon.png";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import trimAddress from "@/utils/trim/trim";
import { Connector } from "wagmi";
import { CloseButton } from "./CloseButton";

interface WalletAccountProps {
	address: string;
	activeConnector: Connector | undefined;
	hasCopied: boolean;
	handleCopy: () => void;
	handleWalletChange: () => void;
	disconnect: () => void;
	closeSelectModal: () => void;
}

export const WalletAccount = ({
	address,
	activeConnector,
	hasCopied,
	handleCopy,
	handleWalletChange,
	disconnect,
	closeSelectModal,
}: WalletAccountProps) => {
	return (
		<>
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
					<div className="mb-4">
						<Jazzicon
							diameter={64}
							seed={jsNumberForAddress(address)}
						/>
					</div>

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
								<svg
									className="w-4 h-4 text-green-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							) : (
								<svg
									className="w-4 h-4 text-gray-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
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
								<Image
									src={METAMASK}
									alt="MetaMask"
									className="w-6 h-6"
								/>
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-900">
									{activeConnector?.name || "MetaMask"}
								</p>
								<p className="text-xs text-gray-500">
									Connected
								</p>
							</div>
						</div>
						<div className="flex items-center gap-1.5">
							<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
							<span className="text-xs text-green-600 font-medium">
								Active
							</span>
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
						<svg
							className="w-4 h-4 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
						<span className="text-sm font-medium text-gray-700">
							Explorer
						</span>
					</a>
					<button
						onClick={handleWalletChange}
						className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-600 rounded-xl transition-colors touch-manipulation"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
							/>
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
	);
};
