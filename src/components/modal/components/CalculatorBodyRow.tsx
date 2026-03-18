import { BalanceInput } from "@/components/input/CustomInput";
import { useRecoilState } from "recoil";
import { Duration, durationState } from "@/recoil/duration/duration";

export const CalculatorBodyRow = (args: { title: string; value: any }) => {
	const [duration, setDuration] = useRecoilState(durationState);
	const { title, value } = args;

	return (
		<div className="flex flex-row h-[55px] justify-between items-center w-full">
			<span className="text-sm font-medium text-[#3d495d] w-[110px]">
				{title}
			</span>
			<div className="w-[171px] h-8">
				{title === "Stake" ? (
					<BalanceInput
						w={"120px"}
						h={"32px"}
						placeHolder={"0"}
						type={"calculator"}
						maxValue={value}
					/>
				) : title === "Total Staked" ? (
					<div className="w-[181px] rounded-[4px] border border-[#dfe4ee] flex flex-row justify-end items-center text-[#3e495c] text-[13px] pr-2.5">
						{value} TON
					</div>
				) : (
					<select
						className="h-8 text-[13px] w-full px-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						defaultValue={duration}
						onChange={(e) => {
							setDuration(e.target.value as Duration);
						}}
					>
						<option value={"1-year"}>1 Year</option>
						<option value={"6-month"}>6 Month</option>
						<option value={"3-month"}>3 Month</option>
						<option value={"1-month"}>1 Month</option>
					</select>
				)}
			</div>
		</div>
	);
};

export default CalculatorBodyRow;
