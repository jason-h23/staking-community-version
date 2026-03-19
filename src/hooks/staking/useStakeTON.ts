import TON from "@/abis/TON.json";
import { useTxAction } from "./useTxAction";

export default function useStakeTON(layer2: string) {
	const { execute: stakeTON } = useTxAction({
		contractKey: "TON_ADDRESS",
		abi: TON,
		functionName: "approveAndCall",
		layer2,
	});

	return { stakeTON };
}
