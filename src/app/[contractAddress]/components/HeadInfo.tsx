import QUESTION_ICON from "@/assets/images/input_question_icon.svg";
import { LoadingDots } from "@/components/Loader/LoadingDots";
import Image from "next/image";

type HedInfoType = {
	title: string;
	value: string;
	label?: string;
	isLoading?: boolean;
};

export const HeadInfo = (args: HedInfoType) => {
	const { title, value, label, isLoading } = args;

	return (
		<div className="flex flex-col items-center space-y-1 min-w-[80px]">
			<div className="flex items-center">
				<span className="text-gray-500 text-[11px] lg:text-xs">
					{title}
				</span>
				{label && (
					<div className="ml-1 group relative">
						<div className="cursor-help">
							<Image src={QUESTION_ICON} alt={""} />
						</div>
						{/* Tooltip */}
						<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
							{label}
							<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
						</div>
					</div>
				)}
			</div>
			<h3 className="text-[16px] lg:text-[21px] font-semibold text-center">
				{isLoading ? (
					<div className="flex mr-1 mt-1.5">
						<div className="flex mt-2.5 mr-1.5">
							<LoadingDots size={"small"} />
						</div>
						<span>TON</span>
					</div>
				) : (
					value
				)}
			</h3>
		</div>
	);
};
