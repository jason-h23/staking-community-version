import DepositManager from "@/abis/DepositManager.json";
import { useTxAction } from "./useTxAction";

export default function useUnstake(layer2: string) {
	const { execute: unstake, writeError } = useTxAction({
		contractKey: "DepositManager_ADDRESS",
		abi: DepositManager,
		functionName: "requestWithdrawal",
		layer2,
	});

	return { unstake, writeError };
}
