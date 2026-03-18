// Infos.tsx
import { useState, useEffect } from "react";
import { StakingInfo } from "./components/StakingInfo";
import { useStakingInformation } from "@/hooks/info/useStakingInfo";
import { SupplyValueProps } from "recoil/staking/info";
import useCallOperators from "@/hooks/staking/useCallOperators";

export default function Infos() {
	const [isLoading, setIsLoading] = useState(true);
	const { stakingInfo } = useStakingInformation();
	const { refreshAllOperators } = useCallOperators();

	useEffect(() => {
		if (
			stakingInfo &&
			stakingInfo.length > 0 &&
			stakingInfo[0].value !== 0 &&
			stakingInfo[0].value !== Infinity
		) {
			setIsLoading(false);
		}
	}, [stakingInfo]);

	return (
		<div className="flex items-center justify-center h-full flex-col w-full lg:w-[500px]">
			<div className="flex mt-2.5 flex-row justify-between items-center w-full">
				<h1 className="text-[32px] md:text-[45px] font-bold text-left mb-6 w-full">
					TON Staking
				</h1>
			</div>

			<p className="text-[#252525] text-[15px] font-light max-w-2xl">
				{`Stake your TON with a DAO candidate to earn seigniorage rewards while
        delegating your voting power to help shape Tokamak Network's
        governance.`}
			</p>

			<div className="flex my-[18px] items-start w-full text-[11px] text-[#304156] font-normal">
				{/* Commented out legend section */}
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center w-full py-5">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
				</div>
			) : (
				<div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-0 justify-between mb-[30px] lg:mb-[45px] w-full">
					{stakingInfo.map((info: SupplyValueProps, index: number) => (
						<StakingInfo
							key={index}
							title={info.title}
							label={info.tooltip}
							value={
								typeof info.value === "number"
									? info.value.toFixed(2)
									: info.value
							}
							unit={info.unit}
						/>
					))}
				</div>
			)}
		</div>
	);
}
