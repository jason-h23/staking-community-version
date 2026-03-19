import { getContract, isAddress, PublicClient } from "viem";

const contractCache = new Map<string, any>();
const contractExistsCache = new Map<string, boolean>();

export function createContractInstance(
	publicClient: PublicClient,
	contractAddress: string,
	abi: any,
): any {
	if (!publicClient || !contractAddress) return null;

	const cacheKey = `${contractAddress}-${abi.contractName || "unknown"}`;

	if (contractCache.has(cacheKey)) {
		return contractCache.get(cacheKey);
	}

	try {
		const contract = getContract({
			address: contractAddress as `0x${string}`,
			abi: abi.abi || abi,
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
