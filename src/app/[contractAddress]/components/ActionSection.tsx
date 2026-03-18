import {
	actionButtonStyle,
	withdrawOptionButtonStyle,
} from "@/style/buttonStyle";
import Image from "next/image";
import LIST_ARROW from "@/assets/images/list-arrow_icon.svg";
import LIST_ARROW_WHITE from "@/assets/images/list-arrow_icon_white.svg";
import { formatUnits } from "viem";
import useCalculatorModal from "@/hooks/modal/useCalculatorModal";
import QUESTION_ICON from "@/assets/images/input_question_icon.svg";
import QUESTION_ICON_WHITE from "@/assets/images/input_question_icon_white.svg";
import { useState } from "react";

type ActionSectionProps = {
	activeAction: string;
	setActiveAction: (action: string) => void;
	isL2: boolean;
	setValue: (value: string) => void;
	withdrawableAmount: string;
	withdrawTarget: string;
	pendingUnstaked: string;
};

export const ActionSection = (args: ActionSectionProps) => {
	const {
		activeAction,
		setActiveAction,
		isL2,
		setValue,
		withdrawableAmount,
		withdrawTarget,
		pendingUnstaked,
	} = args;
	const { openCalculatorModal, isOpen } = useCalculatorModal();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<div className="flex flex-wrap gap-2 mb-3 text-xs px-0 lg:px-[5px]">
			<button
				onClick={() => {
					setActiveAction("Stake");
					setValue("");
				}}
				className={`px-2 lg:px-3 py-1.5 rounded text-[11px] lg:text-xs font-medium transition-colors ${
					activeAction === "Stake"
						? "bg-[#2a72e5] text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
			>
				Stake
			</button>
			
			<button
				onClick={() => {
					setActiveAction("Unstake");
					setValue("");
				}}
				className={`px-2 lg:px-3 py-1.5 rounded text-[11px] lg:text-xs font-medium transition-colors flex items-center ${
					activeAction === "Unstake"
						? "bg-[#2a72e5] text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
			>
				Unstake
				<div className="ml-1.5 group relative hidden lg:block">
					<div className="cursor-help">
						<Image
							src={
								activeAction === "Unstake" ? QUESTION_ICON_WHITE : QUESTION_ICON
							}
							alt={""}
						/>
					</div>
					{/* Tooltip */}
					<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 w-[260px]">
						Withdrawing TON to L2 can be done right away without unstake via Withdraw-L2.
						<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
					</div>
				</div>
			</button>
			
			{isL2 ? (
				<div className="relative">
					<button
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className={`px-2 lg:px-3 py-1.5 rounded text-[11px] lg:text-xs font-medium transition-colors flex items-center ${
							activeAction === "WithdrawL1" || activeAction === "WithdrawL2"
								? "bg-[#2a72e5] text-white w-auto lg:w-[126px]"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200 w-auto lg:w-[97px]"
						}`}
					>
						<div className="flex flex-row justify-center">
							<div className="mr-1.5">
								{activeAction === "WithdrawL1"
									? "Withdraw - Eth"
									: activeAction === "WithdrawL2"
										? "Withdraw - L2"
										: "Withdraw"}
							</div>
							<div className="w-2.5 cursor-pointer hover:scale-105 transition-transform">
								<Image
									src={
										activeAction === "WithdrawL1" ||
										activeAction === "WithdrawL2"
											? LIST_ARROW_WHITE
											: LIST_ARROW
									}
									alt={""}
								/>
							</div>
						</div>
					</button>
					
					{isMenuOpen && (
						<div className="absolute top-full left-0 mt-1 w-[96px] bg-white rounded-lg border border-[#e7ebf2] shadow-lg z-50">
							<button
								onClick={() => {
									setValue(formatUnits(BigInt(withdrawableAmount), 27));
									setActiveAction("WithdrawL1");
									setIsMenuOpen(false);
								}}
								className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 rounded-t-lg ${
									withdrawTarget === "Ethereum" ? "bg-blue-50 text-blue-700" : "text-gray-700"
								}`}
							>
								Ethereum
							</button>
							<button
								onClick={() => {
									setActiveAction("WithdrawL2");
									setValue("");
									setIsMenuOpen(false);
								}}
								className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 rounded-b-lg ${
									withdrawTarget === "L2" ? "bg-blue-50 text-blue-700" : "text-gray-700"
								}`}
							>
								L2
							</button>
						</div>
					)}
				</div>
			) : (
				<button
					onClick={() => {
						setValue(formatUnits(BigInt(withdrawableAmount), 27));
						setActiveAction("Withdraw");
					}}
					className={`px-2 lg:px-3 py-1.5 rounded text-[11px] lg:text-xs font-medium transition-colors ${
						activeAction === "Withdraw"
							? "bg-[#2a72e5] text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					Withdraw
				</button>
			)}
			
			<button
				onClick={() => {
					setValue(formatUnits(BigInt(pendingUnstaked), 27));
					setActiveAction("Restake");
				}}
				className={`px-2 lg:px-3 py-1.5 rounded text-[11px] lg:text-xs font-medium transition-colors ${
					activeAction === "Restake"
						? "bg-[#2a72e5] text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
			>
				Restake
			</button>
			
			<button
				className="ml-auto text-blue-500 text-[11px] lg:text-xs font-medium cursor-pointer hover:text-blue-600 hover:underline transition-colors"
				onClick={() => openCalculatorModal()}
			>
				Simulator
			</button>
		</div>
	);
};
