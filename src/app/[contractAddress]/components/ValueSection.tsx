import { LoadingDots } from "@/components/Loader/LoadingDots";
import commafy from "@/utils/trim/commafy";
import { ethers } from "ethers";
import { useCallback } from "react";
import { useAccount } from "wagmi";
import QUESTION_ICON from "@/assets/images/input_question_icon.svg";
import Image from "next/image";

type ValueSectionProps = {
	title: string;
	value: string;
	seigUpdated?: string;
	isLoading?: boolean;
	manager?: string;
	onClaim?: () => void;
	label?: string;
};

export const ValueSection = (args: ValueSectionProps) => {
	const { title, value, seigUpdated, onClaim, isLoading, manager, label } =
		args;
	const { address } = useAccount();
	
	const formatUnits = useCallback((amount: string, unit: number) => {
		try {
			return commafy(ethers.utils.formatUnits(amount, unit), 2);
		} catch (e) {
			return "0";
		}
	}, []);

	return (
		<div className="flex justify-between font-semibold text-[#1c1c1c] flex-wrap gap-2">
			<div className="flex flex-col items-start space-y-1">
				<div className="flex flex-row text-[13px] lg:text-base">
					<span>{title}</span>
					{label ? (
						<div className="ml-1.5 group relative hidden lg:block">
							<div className="cursor-help">
								<Image src={QUESTION_ICON} alt={""} />
							</div>
							{/* Tooltip */}
							<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
								{label}
								<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
							</div>
						</div>
					) : (
						""
					)}
				</div>
				{seigUpdated && (
					<div className="text-[10px] lg:text-xs text-[#808992]">
						Seigniorage is updated at block number {seigUpdated}.
					</div>
				)}
			</div>
			<div className="flex flex-col space-y-0 items-end">
				<div className="text-[12px] lg:text-sm text-right">
					<div>
						{isLoading ? (
							<div className="flex mr-1">
								<LoadingDots size={"small"} />
							</div>
						) : (
							formatUnits(value || "0", title === "TON Bridged to L2" ? 18 : 27)
						)}{" "}
						TON
					</div>
					{((onClaim && seigUpdated) || (onClaim && manager === address)) && (
						<div
							onClick={onClaim}
							className="text-[10px] lg:text-xs text-[#2a72e5] cursor-pointer font-normal text-right hover:text-[#1a62d5] hover:underline transition-all duration-200"
						>
							{seigUpdated ? "Update seigniorage" : "Claim"}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
