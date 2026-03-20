import { CalculatorBodyRow } from "./CalculatorBodyRow";

export const CalculatorBody = (args: {
	userBalance: string | undefined;
	totalStaked: string | undefined;
}) => {
	const { userBalance, totalStaked } = args;

	return (
		<div className="flex flex-col py-[13px] px-[30px]">
			<CalculatorBodyRow title={"Stake"} value={userBalance} />
			<CalculatorBodyRow title={"Duration"} value={""} />
		</div>
	);
};

export default CalculatorBody;
