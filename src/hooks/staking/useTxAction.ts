import { useWriteContract, useChainId } from "wagmi";
import { useTx } from "../tx/useTx";
import { getContractAddress } from "@/constant/contracts";
import type { AbiInput } from "./operators/types";

interface TxActionConfig {
	contractKey: keyof ReturnType<typeof getContractAddress>;
	abi: AbiInput;
	functionName: string;
	layer2: string;
}

export function useTxAction(config: TxActionConfig) {
	const { contractKey, abi, functionName, layer2 } = config;
	const chainId = useChainId();
	const addresses = getContractAddress(chainId);
	const contractAddress = addresses[contractKey] as `0x${string}`;

	const {
		data: txData,
		error: writeError,
		writeContract,
	} = useWriteContract();

	const execute = (args: readonly unknown[]) => {
		return writeContract({
			address: contractAddress,
			abi,
			functionName,
			args,
		});
	};

	useTx({ hash: txData, layer2: layer2 as `0x${string}` });

	return { execute, writeError };
}
