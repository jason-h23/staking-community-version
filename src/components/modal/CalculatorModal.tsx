import useCalculatorModal from "@/hooks/modal/useCalculatorModal";
import { useCallback, useMemo, useState } from "react";
import { ModalHeader } from "./components/ModalHeader";
import { CalculatorBody } from "./components/CalculatorBody";
import { useRecoilState } from "recoil";
import { durationState } from "@/recoil/duration/duration";
import { calculatorInputState } from "@/recoil/input";
import { calculateRoiBasedonCompound } from "@/utils/apy/calculateRoi";
import { ethers } from "ethers";
import useTokenBalance from "@/hooks/balance/useTonBalance";
import useCallSeigManager from "@/hooks/contracts/useCallSeigManager";
import { useAllCandidatesTotalStaked } from "@tokamak-ecosystem/staking-sdk-react-kit";

function CalculatorModal() {
	const { closeSelectModal, isOpen } = useCalculatorModal();

	const [duration, setDuration] = useRecoilState(durationState);
	const [input, setInput] = useRecoilState(calculatorInputState);

	const { result: totalSupplyResult } = useCallSeigManager("totalSupplyOfTon");

	const [type, setType] = useState<"calculate" | "result">("calculate");
	const [roi, setROI] = useState<number>(0);
	const [rewardTON, setRewardTON] = useState("0.00");

	const tonBalance = useTokenBalance("TON");

	const { data: totalStaked, isLoading, error } = useAllCandidatesTotalStaked();

	const closeThisModal = useCallback(() => {
		setType("calculate");
		setDuration("1-year");
		setInput("");
		closeSelectModal();
	}, [closeSelectModal]);

	const calButton = useCallback(async () => {
		const inputBalance = Number(input.replace(/,/g, ""));

		if (totalStaked) {
			const totalStakedString = totalStaked
				? ethers.utils.formatUnits(totalStaked, 27)
				: "0";
			const total = Number(totalStakedString.replace(/,/g, "")) + inputBalance;

			const totalSupplyString = totalSupplyResult?.data
				? ethers.utils.formatUnits(totalSupplyResult.data.toString(), 27)
				: "0";
			const returnRate = calculateRoiBasedonCompound({
				totalStakedAmount: total,
				totalSupply: Number(totalSupplyString),
				duration,
			});
			const expectedSeig = inputBalance * (returnRate / 100);

			const rewardTON = expectedSeig.toLocaleString(undefined, {
				maximumFractionDigits: 2,
			});

			setRewardTON(rewardTON);
			setROI(returnRate);
			setType("result");
		}
	}, [totalStaked, duration, input]);

	const recalcButton = useCallback(() => {
		setType("calculate");
	}, []);

	const actionButtonStyle = (isActive: boolean) => ({
		h: "38px",
		borderRadius: "4px",
		border: "1px",
		borderColor: "#E7EBF2",
		bgColor: isActive ? "#2a72e5" : "white",
		w: "130px",
		fontSize: "12px",
		fontWeight: 600,
		color: isActive ? "white" : "#808992",
		_hover: {
			bgColor: isActive ? "#1a62d5" : "#f5f7fa",
			borderColor: isActive ? "#1a62d5" : "#d7dbe2",
		},
		transition: "all 0.2s ease-in-out",
	});

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Overlay */}
			<div 
				className="fixed inset-0 bg-black bg-opacity-50"
				onClick={closeThisModal}
			/>
			
			{/* Modal Content */}
			<div className="relative bg-white w-[350px] rounded-[15px] shadow-[0_2px_6px_0_rgba(61,73,93,0.1)]">
				<div className="w-full flex flex-col items-center py-2.5">
					<ModalHeader
						main={"Staking Calculator"}
						sub={
							"The calculation is based on monthly compounding interest."
						}
						closeThisModal={closeThisModal}
					/>
					<div className="w-[350px] border-y border-[#f4f6f8] py-1 flex flex-col items-center">
						<div>
							{type === "calculate" ? (
								<CalculatorBody
									userBalance={tonBalance?.data?.parsedBalance}
									totalStaked={totalStaked}
								/>
							) : (
								<div className="flex flex-col items-center">
									<span className="mt-7.5 text-[13px] font-normal text-[#2a72e5]">
										You can earn about
									</span>
									<div className="flex flex-row justify-center items-end mt-4.5">
										<span className="text-[32px] font-medium text-[#304156] h-[43px]">
											{rewardTON}
										</span>
										<span className="ml-1.5 text-[13px] font-medium text-[#3d495d]">
											TON
										</span>
									</div>
									<div className="flex flex-row justify-center mt-7.5 mb-9 h-4 w-[230px] text-xs text-[#808992]">
										<span>
											{roi.toLocaleString(undefined, {
												maximumFractionDigits: 2,
												minimumFractionDigits: 2,
											})}
											%
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="flex flex-col items-center mt-6">
						{type === "calculate" ? (
							<button
								className="h-[38px] rounded-[4px] border border-[#E7EBF2] bg-[#2a72e5] w-[130px] text-xs font-semibold text-white hover:bg-[#1a62d5] hover:border-[#1a62d5] transition-all duration-200"
								onClick={() => calButton()}
							>
								Calculate
							</button>
						) : (
							<div className="flex flex-row">
								<button
									className="h-[38px] rounded-[4px] border border-[#E7EBF2] bg-[#2a72e5] w-[130px] text-xs font-semibold text-white hover:bg-[#1a62d5] hover:border-[#1a62d5] transition-all duration-200"
									onClick={() => recalcButton()}
								>
									Recalculate
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default CalculatorModal;
