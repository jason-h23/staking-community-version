import Image from "next/image";
import QUESTION_ICON from "@/assets/images/input_question_icon.svg";

type StakingInfoProps = {
	title: string;
	value: string;
	unit: string;
	label?: string;
};

export const StakingInfo = (args: StakingInfoProps) => {
	const { title, value, unit, label } = args;
	return (
		<div>
			<div className="flex items-center">
				<span className="text-[14px] text-[#808992] font-normal">
					{title}
				</span>
				{label && (
					<div className="ml-1 group relative">
						<div className="cursor-help">
							<Image src={QUESTION_ICON} alt="question icon" />
						</div>
						{/* Tooltip */}
						<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
							{label}
							<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
						</div>
					</div>
				)}
			</div>
			<div className="font-bold text-[21px] flex flex-row items-end">
				<span>{value}</span>
				<span className="text-[13px] ml-[3px] mb-[3px]">
					{unit}
				</span>
			</div>
		</div>
	);
};
