import DepositManager from "@/abis/DepositManager.json";
import { useTxAction } from "./useTxAction";

export default function useRestake(layer2: string) {
	const { execute: restake, writeError } = useTxAction({
		contractKey: "DepositManager_ADDRESS",
		abi: DepositManager,
		functionName: "redepositMulti",
		layer2,
	});

	return { restake, writeError };
}
