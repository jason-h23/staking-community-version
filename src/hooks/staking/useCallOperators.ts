// hooks/useCallOperators.ts
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
	operatorsListState,
	operatorsLoadingState,
	Operator,
} from "@/recoil/staking/operator";
import {
	useAccount,
	useBlockNumber,
	usePublicClient,
	useWalletClient,
	useChainId,
} from "wagmi";
import { getContract, isAddress, PublicClient } from "viem";
import { BigNumber } from "ethers";
import useCallL2Registry from "../contracts/useCallL2Registry";
import Layer2Registry from "@/abis/Layer2Registry.json";
import OperatorManager from "@/abis/OperatorManager.json";
import CandidateAddon from "@/constant/abis/CandidateAddOn.json";
import SeigManager from "@/abis/SeigManager.json";
import WTON from "@/abis/WTON.json";
import TON from "@/abis/TON.json";
import Layer2Manager from "@/abis/Layer2Manager.json";
import SystemConfig from "@/abis/SystemConfig.json";
import Candidates from "@/abis/Candidate.json";
import { getContractAddress } from "@/constant/contracts";

import { useAllCandidates } from "@tokamak-ecosystem/staking-sdk-react-kit";
import trimAddress from "@/utils/trim/trim";
import { DEFAULT_NETWORK } from "@/constant";

type SortDirection = "asc" | "desc";

const contractCache = new Map<string, any>();
const contractExistsCache = new Map<string, boolean>();
const operatorDataCache = new Map<string, Operator>();
const l2DetailsCache = new Map<string, Partial<Operator>>();
// const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function useCallOperators() {
	const [operatorsList, setOperatorsList] = useRecoilState(operatorsListState);
	const [operatorAddress, setOperatorAddress] = useState<any[]>();
	const [totalStaked, setTotalStaked] = useState("0");
	const [loading, setLoading] = useRecoilState(operatorsLoadingState);
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [l2DetailsLoading, setL2DetailsLoading] = useState(false);
	const { address, isConnected } = useAccount();
	const fetchedRef = useRef(false);
	const l2DetailsFetchedRef = useRef(false);

	const publicClient = usePublicClient();
	const { transport, chain } = publicClient as PublicClient;
	const { data: blockNumber } = useBlockNumber();

	const { candidates: operatorAddresses, isLoading } = useAllCandidates();

	const chainId = useChainId();
	// Use the connected wallet's chainId to get correct contract addresses
	// This ensures contract calls go to the right network
	const CONTRACT_ADDRESS = useMemo(() => {
		try {
			return getContractAddress(chainId);
		} catch {
			return getContractAddress(Number(DEFAULT_NETWORK));
		}
	}, [chainId]);

	// Reset fetch state when chainId changes (user switches networks)
	useEffect(() => {
		fetchedRef.current = false;
		l2DetailsFetchedRef.current = false;
		operatorDataCache.clear();
		l2DetailsCache.clear();
		setOperatorsList([]);
	}, [chainId, setOperatorsList]);

	const getContractInstance = useCallback(
		(contractAddress: string, abi: any): any => {
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
			} catch (error) {
				console.error(
					`Failed to get contract instance for ${contractAddress}:`,
					error,
				);
				return null;
			}
		},
		[publicClient],
	);

	const commonContracts = useMemo(() => {
		if (!publicClient) return null;

		return {
			seigManager: getContractInstance(
				CONTRACT_ADDRESS.SeigManager_ADDRESS,
				SeigManager,
			),
			wton: getContractInstance(CONTRACT_ADDRESS.WTON_ADDRESS, WTON),
			layer2manager: getContractInstance(
				CONTRACT_ADDRESS.Layer2Manager_ADDRESS,
				Layer2Manager,
			),
			ton: getContractInstance(CONTRACT_ADDRESS.TON_ADDRESS, TON),
		};
	}, [publicClient, getContractInstance, CONTRACT_ADDRESS]);

	const checkContractExists = useCallback(
		async (address: string): Promise<boolean> => {
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
			} catch (error) {
				// console.error(`Error checking contract at ${address}:`, error);
				return false;
			}
		},
		[publicClient],
	);

	const compareTotalStaked = useCallback(
		(a: Operator, b: Operator, direction: SortDirection): number => {
			try {
				const aBN = BigNumber.from(a.totalStaked || "0");
				const bBN = BigNumber.from(b.totalStaked || "0");

				if (aBN.eq(bBN)) return 0;

				if (direction === "asc") {
					return aBN.lt(bBN) ? -1 : 1;
				} else {
					return aBN.gt(bBN) ? -1 : 1;
				}
			} catch (error) {
				const aNum = Number(a.totalStaked || "0");
				const bNum = Number(b.totalStaked || "0");

				if (direction === "asc") {
					return aNum - bNum;
				} else {
					return bNum - aNum;
				}
			}
		},
		[],
	);

	const sortOperators = useCallback(
		(direction: SortDirection = sortDirection): void => {
			setOperatorsList((prevList) => {
				const newList = [...prevList];
				newList.sort((a, b) => compareTotalStaked(a, b, direction));
				return newList;
			});

			setSortDirection(direction);
		},
		[sortDirection, compareTotalStaked, setOperatorsList],
	);

	const fetchOperatorData = useCallback(
		async (opAddress: string): Promise<Operator | null> => {
			if (!opAddress || !publicClient || !commonContracts) return null;
			// const { layer2manager, seigManager, wton, ton } = commonContracts;

			try {
				const candidateContract = getContractInstance(opAddress, Candidates);
				if (!candidateContract) return null;

				const candidateAddon = getContractInstance(opAddress, CandidateAddon);
				if (!candidateAddon) return null;

				const [memo, userStaked, totalStaked, operatorAddress] = await Promise.all([
					candidateContract.read.memo().catch(() =>
						trimAddress({
							address: opAddress as string,
							firstChar: 7,
							lastChar: 4,
							dots: "....",
						}),
					),
					candidateContract.read.stakedOf([address]),
					candidateContract.read.totalStaked().catch(() => "0"),
					candidateAddon.read.operator().catch(() => null),
				]);

				const operatorInfo: Operator = {
					name:
						typeof memo === "string"
							? memo
							: trimAddress({
								address: opAddress as string,
								firstChar: 7,
								lastChar: 4,
								dots: "....",
							}),
					address: opAddress,
					totalStaked: totalStaked,
					yourStaked: '0',
					isL2: false,
					operatorAddress: operatorAddress || undefined,
				};

				if (operatorAddress) {
					const operatorContractExists = await checkContractExists(
						operatorAddress as string,
					);

				// 	if (operatorContractExists) {
				// 		const operatorManager = getContractInstance(
				// 			operatorAddress as string,
				// 			OperatorManager,
				// 		);
				// 		if (operatorManager) {
				// 			let rollupConfigAddress: string | null = null;
				// 			try {
				// 				rollupConfigAddress = await operatorManager.read.rollupConfig();
				// 			} catch (error) {
				// 				rollupConfigAddress = null;
				// 			}
				// 			let manager: string | null = null	;
				// 			try {
				// 				manager = await operatorManager.read.manager();
				// 				operatorInfo.manager = manager || undefined;
				// 			} catch (error) {
				// 				manager = null;
				// 			}

				// 			if (rollupConfigAddress) {
				// 				try {
				// 					const rollupConfig = getContractInstance(
				// 						rollupConfigAddress as string,
				// 						SystemConfig,
				// 					);

				// 					if (rollupConfig && layer2manager) {
				// 						const bridgeDetail =
				// 							await layer2manager.read.checkL1BridgeDetail([
				// 								rollupConfigAddress,
				// 							]);
				// 						// console.log(memo, bridgeDetail, rollupConfigAddress);
				// 						if (Array.isArray(bridgeDetail) && bridgeDetail[5] === 1) {
				// 							operatorInfo.isL2 = true;

				// 							if (
				// 								rollupConfig &&
				// 								ton &&
				// 								wton &&
				// 								seigManager &&
				// 								blockNumber
				// 							) {
				// 								const [bridgeAddress, wtonBalanceOfM] =
				// 									await Promise.all([
				// 										rollupConfig.read
				// 											.optimismPortal()
				// 											.catch(() => null),
				// 										wton.read
				// 											.balanceOf([operatorAddress])
				// 											.catch(() => "0"),
				// 									]);

				// 								if (bridgeAddress) {
				// 									const lockedInBridge = await ton.read
				// 										.balanceOf([bridgeAddress])
				// 										.catch(() => "0");
				// 									operatorInfo.lockedInL2 = lockedInBridge.toString();
				// 								}

				// 								try {
				// 									const estimatedDistribution =
				// 										await seigManager.read.estimatedDistribute([
				// 											Number(blockNumber.toString()) + 1,
				// 											opAddress,
				// 											true,
				// 										]);

				// 									if (
				// 										estimatedDistribution &&
				// 										estimatedDistribution[7] !== undefined
				// 									) {
				// 										const addedWton = BigNumber.from(
				// 											wtonBalanceOfM || "0",
				// 										).add(
				// 											BigNumber.from(estimatedDistribution[7] || "0"),
				// 										);
				// 										operatorInfo.sequencerSeig = addedWton.toString();
				// 									}
				// 								} catch (error) {
				// 									console.error(
				// 										"Error estimating distribution:",
				// 										error,
				// 									);
				// 								}
				// 							}
				// 						}
				// 					}
				// 				} catch (error) {
				// 					console.error(
				// 						`Failed to get bridge details for ${opAddress}:`,
				// 						error,
				// 					);
				// 				}
				// 			}
				// 		}
				// 	}
				// }

				if (!address) {
					operatorDataCache.set(opAddress, operatorInfo);
				}

				return operatorInfo;
			} catch (error) {
				console.error(`Error fetching operator data for ${opAddress}:`, error);
				return null;
			}
		},
		[
			publicClient,
			commonContracts,
			address,
			getContractInstance,
		],
	);

	// FAST: Fetch only essential data for list display (name, totalStaked, yourStaked)
	const fetchEssentialData = useCallback(
		async (opAddress: string): Promise<Operator | null> => {
			if (!opAddress || !publicClient) return null;

			try {
				const candidateContract = getContractInstance(opAddress, Candidates);
				if (!candidateContract) return null;

				// Only fetch what's needed for the list view - 3 parallel calls
				const [memo, userStaked, totalStaked] = await Promise.all([
					candidateContract.read.memo().catch(() =>
						trimAddress({
							address: opAddress as string,
							firstChar: 7,
							lastChar: 4,
							dots: "....",
						}),
					),
					address ? candidateContract.read.stakedOf([address]).catch(() => "0") : Promise.resolve("0"),
					candidateContract.read.totalStaked().catch(() => "0"),
				]);

				return {
					name:
						typeof memo === "string"
							? memo
							: trimAddress({
								address: opAddress as string,
								firstChar: 7,
								lastChar: 4,
								dots: "....",
							}),
					address: opAddress,
					totalStaked: totalStaked,
					yourStaked: userStaked,
					isL2: false, // Will be updated in phase 2
				};
			} catch (error) {
				console.error(`Error fetching essential data for ${opAddress}:`, error);
				return null;
			}
		},
		[publicClient, getContractInstance, address],
	);

	// SUPER FAST: Batch fetch essential data using multicall
	const fetchEssentialDataBatch = useCallback(
		async (opAddresses: string[]): Promise<Operator[]> => {
			if (!opAddresses.length || !publicClient) return [];

			try {
				const candidateAbi = Candidates.abi || Candidates;

				// Build multicall contracts array for all addresses
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

				const userStakedContracts = address
					? opAddresses.map((addr) => ({
						address: addr as `0x${string}`,
						abi: candidateAbi,
						functionName: "stakedOf",
						args: [address],
					}))
					: [];

				// Execute all reads in a single multicall
				const [memoResults, totalStakedResults, userStakedResults] = await Promise.all([
					publicClient.multicall({
						contracts: memoContracts as any,
						allowFailure: true,
					}),
					publicClient.multicall({
						contracts: totalStakedContracts as any,
						allowFailure: true,
					}),
					address
						? publicClient.multicall({
							contracts: userStakedContracts as any,
							allowFailure: true,
						})
						: Promise.resolve(opAddresses.map(() => ({ status: "success" as const, result: "0" }))),
				]);

				// Process results
				return opAddresses.map((opAddress, i) => {
					const memoResult = memoResults[i];
					const totalStakedResult = totalStakedResults[i];
					const userStakedResult = userStakedResults[i];

					const memo = memoResult?.status === "success" && memoResult.result
						? memoResult.result
						: trimAddress({
							address: opAddress,
							firstChar: 7,
							lastChar: 4,
							dots: "....",
						});

					const totalStaked = totalStakedResult?.status === "success"
						? totalStakedResult.result
						: "0";

					const userStaked = userStakedResult?.status === "success"
						? userStakedResult.result
						: "0";

					return {
						name: typeof memo === "string" ? memo : trimAddress({
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
			} catch (error) {
				console.error("Error in multicall batch fetch:", error);
				// Fallback to individual fetches
				const results = await Promise.all(
					opAddresses.map((addr) => fetchEssentialData(addr)),
				);
				return results.filter(Boolean) as Operator[];
			}
		},
		[publicClient, address, fetchEssentialData],
	);

	// SLOW: Fetch L2 details in background (isL2, sequencerSeig, lockedInL2)
	const fetchL2Details = useCallback(
		async (operator: Operator): Promise<Partial<Operator>> => {
			if (!operator.address || !publicClient || !commonContracts) return {};
			const { layer2manager, seigManager, wton, ton } = commonContracts;

			// Check cache first
			if (l2DetailsCache.has(operator.address)) {
				return l2DetailsCache.get(operator.address)!;
			}

			try {
				const candidateAddon = getContractInstance(operator.address, CandidateAddon);
				if (!candidateAddon) return {};

				const operatorAddress = await candidateAddon.read.operator().catch(() => null);
				if (!operatorAddress) return {};

				const details: Partial<Operator> = { operatorAddress };

				const operatorContractExists = await checkContractExists(operatorAddress as string);
				if (!operatorContractExists) {
					l2DetailsCache.set(operator.address, details);
					return details;
				}

				const operatorManager = getContractInstance(operatorAddress as string, OperatorManager);
				if (!operatorManager) {
					l2DetailsCache.set(operator.address, details);
					return details;
				}

				let rollupConfigAddress;
				try {
					rollupConfigAddress = await operatorManager.read.rollupConfig();
				} catch {
					rollupConfigAddress = null;
				}

				let manager;
				try {
					manager = await operatorManager.read.manager();
					details.manager = manager;
				} catch {
					manager = null;
				}

				if (!rollupConfigAddress || !layer2manager) {
					l2DetailsCache.set(operator.address, details);
					return details;
				}

				try {
					const rollupConfig = getContractInstance(rollupConfigAddress as string, SystemConfig);
					if (!rollupConfig) {
						l2DetailsCache.set(operator.address, details);
						return details;
					}

					const bridgeDetail = await layer2manager.read.checkL1BridgeDetail([rollupConfigAddress]);

					if (Array.isArray(bridgeDetail) && bridgeDetail[5] === 1) {
						details.isL2 = true;

						if (ton && wton && seigManager && blockNumber) {
							const [bridgeAddress, wtonBalanceOfM] = await Promise.all([
								rollupConfig.read.optimismPortal().catch(() => null),
								wton.read.balanceOf([operatorAddress]).catch(() => "0"),
							]);

							if (bridgeAddress) {
								const lockedInBridge = await ton.read.balanceOf([bridgeAddress]).catch(() => "0");
								details.lockedInL2 = lockedInBridge.toString();
							}

							try {
								const estimatedDistribution = await seigManager.read.estimatedDistribute([
									Number(blockNumber.toString()) + 1,
									operator.address,
									true,
								]);

								if (estimatedDistribution && estimatedDistribution[7] !== undefined) {
									const addedWton = BigNumber.from(wtonBalanceOfM || "0").add(
										BigNumber.from(estimatedDistribution[7] || "0"),
									);
									details.sequencerSeig = addedWton.toString();
								}
							} catch (error) {
								console.error("Error estimating distribution:", error);
							}
						}
					}
				} catch (error) {
					console.error(`Failed to get bridge details for ${operator.address}:`, error);
				}

				l2DetailsCache.set(operator.address, details);
				return details;
			} catch (error) {
				console.error(`Error fetching L2 details for ${operator.address}:`, error);
				return {};
			}
		},
		[publicClient, commonContracts, blockNumber, getContractInstance, checkContractExists],
	);

	// PHASE 1: Fast load - fetch only essential data for display using multicall
	useEffect(() => {
		// Guard: Ensure we have valid chainId and contracts before fetching
		const isSupportedChain = chainId === 1 || chainId === 11155111;
		if (
			fetchedRef.current ||
			!publicClient ||
			!commonContracts ||
			isLoading ||
			!isSupportedChain ||
			!CONTRACT_ADDRESS?.Layer2Registry_ADDRESS
		) {
			return;
		}

		const fetchOperatorsFast = async () => {
			try {
				fetchedRef.current = true;
				setLoading(true);
				setOperatorsList([]);

				const l2Registry = getContractInstance(
					CONTRACT_ADDRESS.Layer2Registry_ADDRESS,
					Layer2Registry,
				);

				const numLayer2 = await l2Registry.read.numLayer2s();

				// Parallel fetch all Layer2 addresses
				const layer2s = await Promise.all(
					Array.from({ length: Number(numLayer2) }, (_, i) =>
						l2Registry.read.layer2ByIndex([i]),
					),
				);
				setOperatorAddress(layer2s);

				// SUPER FAST: Use multicall to batch all essential data reads
				// Larger chunks work well with multicall
				const chunkSize = 50;
				let totalStakedAmount = BigNumber.from(0);
				const operators: Operator[] = [];

				for (let i = 0; i < layer2s.length; i += chunkSize) {
					const chunk = layer2s.slice(i, i + chunkSize) as string[];

					// Use multicall batch fetch for maximum speed
					const chunkResults = await fetchEssentialDataBatch(chunk);
					operators.push(...chunkResults);

					chunkResults.forEach((op) => {
						totalStakedAmount = totalStakedAmount.add(
							BigNumber.from(op.totalStaked || "0"),
						);
					});

					// Update UI after each chunk for progressive display
					const sortedOperators = [...operators].sort((a, b) =>
						compareTotalStaked(a, b, sortDirection),
					);
					setTotalStaked(totalStakedAmount.toString());
					setOperatorsList(sortedOperators);
				}
			} catch (error) {
				console.error("Error fetching operators (fast):", error);
				fetchedRef.current = false;
			} finally {
				setLoading(false);
			}
		};

		fetchOperatorsFast();
	}, [
		publicClient,
		commonContracts,
		isLoading,
		compareTotalStaked,
		fetchEssentialDataBatch,
		sortDirection,
		setOperatorsList,
		getContractInstance,
		CONTRACT_ADDRESS,
		chainId,
	]);

	// PHASE 2: Background load - fetch L2 details and merge
	useEffect(() => {
		if (
			l2DetailsFetchedRef.current ||
			operatorsList.length === 0 ||
			loading ||
			!publicClient ||
			!commonContracts ||
			!blockNumber
		) {
			return;
		}

		const fetchL2DetailsBackground = async () => {
			try {
				l2DetailsFetchedRef.current = true;
				setL2DetailsLoading(true);

				// Process L2 details in background chunks
				const chunkSize = 5;
				const updatedOperators = [...operatorsList];

				for (let i = 0; i < updatedOperators.length; i += chunkSize) {
					const chunk = updatedOperators.slice(i, i + chunkSize);

					const detailsResults = await Promise.all(
						chunk.map((op) => fetchL2Details(op)),
					);

					// Merge L2 details into operators
					detailsResults.forEach((details, idx) => {
						const opIndex = i + idx;
						if (opIndex < updatedOperators.length) {
							updatedOperators[opIndex] = {
								...updatedOperators[opIndex],
								...details,
							};
						}
					});

					// Update UI periodically (every 2 chunks)
					if (i % (chunkSize * 2) === 0 || i + chunkSize >= updatedOperators.length) {
						const sortedOperators = [...updatedOperators].sort((a, b) =>
							compareTotalStaked(a, b, sortDirection),
						);
						setOperatorsList(sortedOperators);
					}
				}

				// Final update
				const sortedOperators = [...updatedOperators].sort((a, b) =>
					compareTotalStaked(a, b, sortDirection),
				);
				setOperatorsList(sortedOperators);
			} catch (error) {
				console.error("Error fetching L2 details:", error);
				l2DetailsFetchedRef.current = false;
			} finally {
				setL2DetailsLoading(false);
			}
		};

		fetchL2DetailsBackground();
	}, [
		operatorsList.length,
		loading,
		publicClient,
		commonContracts,
		blockNumber,
		fetchL2Details,
		compareTotalStaked,
		sortDirection,
		setOperatorsList,
	]);

	const refreshOperator = useCallback(
		async (candidateAddress: string) => {
			try {
				if (!publicClient || !candidateAddress) return false;

				const updatedOperator = await fetchOperatorData(candidateAddress);
				if (!updatedOperator) return false;

				setOperatorsList((prevList: Operator[]) => {
					const operatorIndex = prevList.findIndex(
						(op) => op.address === candidateAddress,
					);

					if (operatorIndex === -1) return prevList;

					const newList = [...prevList];
					newList[operatorIndex] = updatedOperator;

					return newList.sort((a, b) =>
						compareTotalStaked(a, b, sortDirection),
					);
				});

				operatorDataCache.delete(candidateAddress);

				return true;
			} catch (error) {
				console.error(`Error refreshing operator ${candidateAddress}:`, error);
				return false;
			}
		},
		[
			publicClient,
			fetchOperatorData,
			compareTotalStaked,
			sortDirection,
			setOperatorsList,
		],
	);

	const refreshAllOperators = useCallback(async () => {
		try {
			if (!publicClient || !operatorAddress) return false;

			setLoading(true);

			// Clear caches
			operatorDataCache.clear();
			l2DetailsCache.clear();

			// Phase 1: Fast fetch essential data using multicall
			const chunkSize = 50;
			const operators: Operator[] = [];
			let totalStakedAmount = BigNumber.from(0);

			for (let i = 0; i < operatorAddress.length; i += chunkSize) {
				const chunk = operatorAddress.slice(i, i + chunkSize) as string[];

				// Use multicall batch fetch
				const chunkResults = await fetchEssentialDataBatch(chunk);
				operators.push(...chunkResults);

				chunkResults.forEach((op) => {
					totalStakedAmount = totalStakedAmount.add(
						BigNumber.from(op.totalStaked || "0"),
					);
				});

				// Update UI after each chunk
				const sortedOperators = [...operators].sort((a, b) =>
					compareTotalStaked(a, b, sortDirection),
				);
				setTotalStaked(totalStakedAmount.toString());
				setOperatorsList(sortedOperators);
			}

			setLoading(false);

			// Phase 2: Background fetch L2 details
			setL2DetailsLoading(true);
			const l2ChunkSize = 5;
			const updatedOperators = [...operators];

			for (let i = 0; i < updatedOperators.length; i += l2ChunkSize) {
				const chunk = updatedOperators.slice(i, i + l2ChunkSize);

				const detailsResults = await Promise.all(
					chunk.map((op) => fetchL2Details(op)),
				);

				detailsResults.forEach((details, idx) => {
					const opIndex = i + idx;
					if (opIndex < updatedOperators.length) {
						updatedOperators[opIndex] = {
							...updatedOperators[opIndex],
							...details,
						};
					}
				});
			}

			const sortedOperators = [...updatedOperators].sort((a, b) =>
				compareTotalStaked(a, b, sortDirection),
			);
			setOperatorsList(sortedOperators);
			setL2DetailsLoading(false);

			return true;
		} catch (error) {
			console.error("Error refreshing all operators:", error);
			return false;
		} finally {
			setLoading(false);
			setL2DetailsLoading(false);
		}
	}, [
		publicClient,
		operatorAddress,
		fetchEssentialDataBatch,
		fetchL2Details,
		compareTotalStaked,
		sortDirection,
		setOperatorsList,
		setLoading,
	]);

	return {
		operatorsList,
		loading,
		l2DetailsLoading,
		refreshOperator,
		refreshAllOperators,
		sortOperators,
		totalStaked,
	};
}
