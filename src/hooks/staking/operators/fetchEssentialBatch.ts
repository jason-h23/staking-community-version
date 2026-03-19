import { PublicClient } from "viem";
import Candidates from "@/abis/Candidate.json";
import trimAddress from "@/utils/trim/trim";
import type { Operator } from "./types";
import { createContractInstance } from "./contractFactory";

export async function fetchEssentialDataSingle(
	publicClient: PublicClient,
	opAddress: string,
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

		const [memo, userStaked, totalStaked] = await Promise.all([
			candidateContract.read.memo().catch(() =>
				trimAddress({
					address: opAddress,
					firstChar: 7,
					lastChar: 4,
					dots: "....",
				}),
			),
			userAddress
				? candidateContract.read.stakedOf([userAddress]).catch(() => "0")
				: Promise.resolve("0"),
			candidateContract.read.totalStaked().catch(() => "0"),
		]);

		return {
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
			yourStaked: userStaked,
			isL2: false,
		};
	} catch {
		return null;
	}
}

export async function fetchEssentialBatch(
	publicClient: PublicClient,
	opAddresses: string[],
	userAddress: string | undefined,
): Promise<Operator[]> {
	if (!opAddresses.length || !publicClient) return [];

	try {
		const candidateAbi = Candidates.abi || Candidates;

		const memoContracts = opAddresses.map((addr) => ({
			address: addr as `0x${string}`,
			abi: candidateAbi,
			functionName: "memo",
		}));

		const totalStakedContracts = opAddresses.map((addr) => ({
			address: addr as `0x${string}`,
			abi: candidateAbi,
			functionName: "totalStaked",
		}));

		const userStakedContracts = userAddress
			? opAddresses.map((addr) => ({
					address: addr as `0x${string}`,
					abi: candidateAbi,
					functionName: "stakedOf",
					args: [userAddress],
				}))
			: [];

		const [memoResults, totalStakedResults, userStakedResults] =
			await Promise.all([
				publicClient.multicall({
					contracts: memoContracts as any,
					allowFailure: true,
				}),
				publicClient.multicall({
					contracts: totalStakedContracts as any,
					allowFailure: true,
				}),
				userAddress
					? publicClient.multicall({
							contracts: userStakedContracts as any,
							allowFailure: true,
						})
					: Promise.resolve(
							opAddresses.map(() => ({
								status: "success" as const,
								result: "0",
							})),
						),
			]);

		return opAddresses.map((opAddress, i) => {
			const memoResult = memoResults[i];
			const totalStakedResult = totalStakedResults[i];
			const userStakedResult = userStakedResults[i];

			const memo =
				memoResult?.status === "success" && memoResult.result
					? memoResult.result
					: trimAddress({
							address: opAddress,
							firstChar: 7,
							lastChar: 4,
							dots: "....",
						});

			const totalStaked =
				totalStakedResult?.status === "success"
					? totalStakedResult.result
					: "0";

			const userStaked =
				userStakedResult?.status === "success"
					? userStakedResult.result
					: "0";

			return {
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
				totalStaked: totalStaked as string,
				yourStaked: userStaked as string,
				isL2: false,
			};
		});
	} catch {
		// Fallback to individual fetches
		const results = await Promise.all(
			opAddresses.map((addr) =>
				fetchEssentialDataSingle(publicClient, addr, userAddress),
			),
		);
		return results.filter(Boolean) as Operator[];
	}
}
