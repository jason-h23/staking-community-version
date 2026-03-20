import React from "react";
import { useRouter } from "next/navigation";
import { useRecoilValue } from "recoil";
import { filteredOperatorsState } from "@/recoil/staking/operator";
import { getAvatarBgColor, getInitials } from "@/utils/color/getAvatarInfo";
import useSelectOperatorModal from "@/hooks/modal/useSelectOperatorModal";

interface OperatorItemProps {
	name: string;
	address: string;
	isL2?: boolean;
	onClick: (address: string) => void;
}

const OperatorItem: React.FC<OperatorItemProps> = ({
	name,
	address,
	isL2,
	onClick,
}) => {
	return (
		<div
			className="h-[58px] py-3.5 px-2.5 flex items-center cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
			onClick={() => onClick(address)}
		>
			{/* Avatar would go here */}
			<span className="text-base font-semibold text-[#131315]">
				{name}
			</span>
			{isL2 && (
				<div className="bg-[#257eee] w-[34px] h-[18px] rounded-[3px] flex justify-center items-center text-xs text-white font-semibold font-roboto ml-1.5">
					L2
				</div>
			)}
		</div>
	);
};

const OperatorSelectionModal = () => {
	const router = useRouter();
	const { isOpen, closeSelectModal } = useSelectOperatorModal();

	const operators = useRecoilValue(filteredOperatorsState);

	const handleSelectOperator = (address: string): void => {
		router.push(`/${address}`);
		closeSelectModal();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Overlay */}
			<div 
				className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
				onClick={closeSelectModal}
			/>
			
			{/* Modal Content */}
			<div className="relative bg-white rounded-[10px] max-w-[360px] w-full mx-4 p-5 shadow-lg">
				{/* Header */}
				<div className="border-b border-[#DFE4EE] pb-4 mb-4">
					<div className="flex justify-between items-center">
						<h2 className="text-[#131315] text-base font-semibold">
							Select an operator
						</h2>
						<button
							onClick={closeSelectModal}
							className="text-gray-400 hover:text-gray-600 transition-colors"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
				
				{/* Body */}
				<div className="max-h-[796px] overflow-y-auto">
					<div className="flex flex-col space-y-0 py-2">
						{operators.map((operator, key) => (
							<OperatorItem
								key={key}
								name={operator.name}
								address={operator.address}
								isL2={operator.isL2}
								onClick={handleSelectOperator}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default OperatorSelectionModal;
