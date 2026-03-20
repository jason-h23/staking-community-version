import { PublicClient } from "viem";
import Candidates from "@/abis/Candidate.json";
import CandidateAddon from "@/constant/abis/CandidateAddOn.json";
import trimAddress from "@/utils/trim/trim";
import type { Operator } from "./types";
import { createContractInstance, checkContractExists } from "./contractFactory";

const operatorDataCache = new Map<string, Operator>();

export function clearOperatorDataCache(): void {
	operatorDataCache.clear();
}

export async function fetchSingleOperator(
	opAddress: string,
	publicClient: PublicClient,
	userAddress: string | undefined,
): Promise<Operator | null> {
	if (!opAddress || !publicClient) return null;

	try {
		const candidateContract = createContractInstance(
			publicClient,
			opAddress,
			Candidates,
		);
		if (!candidateContract) return null;

		const candidateAddon = createContractInstance(
			publicClient,
			opAddress,
			CandidateAddon,
		);
		if (!candidateAddon) return null;

		const [memo, , totalStaked, operatorAddress] = await Promise.all([
			candidateContract.read.memo().catch(() =>
				trimAddress({
					address: opAddress,
					firstChar: 7,
					lastChar: 4,
					dots: "....",
				}),
			),
			userAddress
				? candidateContract.read.stakedOf([userAddress])
				: Promise.resolve("0"),
			candidateContract.read.totalStaked().catch(() => "0"),
			candidateAddon.read.operator().catch(() => null),
		]);

		const operatorInfo: Operator = {
			name:
				typeof memo === "string"
					? memo
					: trimAddress({
							address: opAddress,
							firstChar: 7,
							lastChar: 4,
							dots: "....",
						}),
			address: opAddress,
			totalStaked: totalStaked,
			yourStaked: "0",
			isL2: false,
			operatorAddress: operatorAddress || undefined,
		};

		if (operatorAddress) {
			await checkContractExists(publicClient, operatorAddress as string);
		}

		if (!userAddress) {
			operatorDataCache.set(opAddress, operatorInfo);
		}

		return operatorInfo;
	} catch {
		return null;
	}
}

export function deleteFromOperatorDataCache(address: string): void {
	operatorDataCache.delete(address);
}
