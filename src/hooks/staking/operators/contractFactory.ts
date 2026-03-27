import { getContract, isAddress, PublicClient } from "viem";
import type { AbiInput } from "./types";

const contractCache = new Map<string, ReturnType<typeof getContract>>();
const contractExistsCache = new Map<string, boolean>();

export function createContractInstance(
	publicClient: PublicClient,
	contractAddress: string,
	abi: AbiInput,
) {
	if (!publicClient || !contractAddress) return null;

	const contractName = !Array.isArray(abi) && "contractName" in abi ? abi.contractName : "unknown";
	const cacheKey = `${contractAddress}-${contractName}`;

	if (contractCache.has(cacheKey)) {
		return contractCache.get(cacheKey);
	}

	try {
		const resolvedAbi = Array.isArray(abi) ? abi : abi.abi;
		const contract = getContract({
			address: contractAddress as `0x${string}`,
			abi: resolvedAbi as readonly Record<string, unknown>[],
			client: publicClient,
		});

		contractCache.set(cacheKey, contract);
		return contract;
	} catch {
		return null;
	}
}

export async function checkContractExists(
	publicClient: PublicClient,
	address: string,
): Promise<boolean> {
	try {
		if (!publicClient || !isAddress(address)) return false;

		if (contractExistsCache.has(address)) {
			return contractExistsCache.get(address) as boolean;
		}

		const code = await publicClient.getBytecode({
			address: address as `0x${string}`,
		});

		const exists = code !== null && code !== undefined && code !== "0x";
		contractExistsCache.set(address, exists);
		return exists;
	} catch {
		return false;
	}
}

export function clearCaches(): void {
	contractCache.clear();
	contractExistsCache.clear();
}
