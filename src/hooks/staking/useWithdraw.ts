import DepositManager from "@/abis/DepositManager.json";
import { useTxAction } from "./useTxAction";

export default function useWithdraw(layer2: string) {
	const { execute: withdraw, writeError } = useTxAction({
		contractKey: "DepositManager_ADDRESS",
		abi: DepositManager,
		functionName: "processRequests",
		layer2,
	});

	return { withdraw, writeError };
}
