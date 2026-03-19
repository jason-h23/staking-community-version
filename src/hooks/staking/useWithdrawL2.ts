import DepositManager from "@/abis/DepositManager.json";
import { useTxAction } from "./useTxAction";

export default function useWithdrawL2(layer2: string) {
	const { execute: withdrawL2, writeError } = useTxAction({
		contractKey: "DepositManager_ADDRESS",
		abi: DepositManager,
		functionName: "withdrawAndDepositL2",
		layer2,
	});

	return { withdrawL2, writeError };
}
