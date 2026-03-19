import WTON_ABI from "@/abis/WTON.json";
import { useTxAction } from "./useTxAction";

export function useStakeWTON(layer2: string) {
	const { execute: stakeWTON, writeError } = useTxAction({
		contractKey: "WTON_ADDRESS",
		abi: WTON_ABI,
		functionName: "approveAndCall",
		layer2,
	});

	return { stakeWTON, writeError };
}
