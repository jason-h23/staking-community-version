import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRecoilState } from "recoil";
import {
	operatorsListState,
	operatorsLoadingState,
	Operator,
} from "@/recoil/staking/operator";
import {
	useAccount,
	useBlockNumber,
	usePublicClient,
	useChainId,
} from "wagmi";
import { PublicClient } from "viem";
import { BigNumber } from "ethers";
import Layer2Registry from "@/abis/Layer2Registry.json";
import SeigManager from "@/abis/SeigManager.json";
import WTON from "@/abis/WTON.json";
import TON from "@/abis/TON.json";
import Layer2Manager from "@/abis/Layer2Manager.json";
import { getContractAddress } from "@/constant/contracts";
import { useAllCandidates } from "@tokamak-ecosystem/staking-sdk-react-kit";
import { DEFAULT_NETWORK } from "@/constant";

import type { SortDirection, CommonContracts } from "./operators/types";
import { compareTotalStaked } from "./operators/sort";
import {
	createContractInstance,
	clearCaches,
} from "./operators/contractFactory";
import { fetchEssentialBatch } from "./operators/fetchEssentialBatch";
import { fetchL2DetailsSingle, clearL2Cache } from "./operators/fetchL2Details";
import {
	fetchSingleOperator,
	clearOperatorDataCache,
	deleteFromOperatorDataCache,
} from "./operators/fetchOperatorData";

export default function useCallOperators() {
	const [operatorsList, setOperatorsList] = useRecoilState(operatorsListState);
	const [operatorAddress, setOperatorAddress] = useState<any[]>();
	const [totalStaked, setTotalStaked] = useState("0");
	const [loading, setLoading] = useRecoilState(operatorsLoadingState);
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [l2DetailsLoading, setL2DetailsLoading] = useState(false);
	const { address } = useAccount();
	const fetchedRef = useRef(false);
	const l2DetailsFetchedRef = useRef(false);

	const publicClient = usePublicClient();
	const { data: blockNumber } = useBlockNumber();

	const { candidates: operatorAddresses, isLoading } = useAllCandidates();

	const chainId = useChainId();

	const CONTRACT_ADDRESS = useMemo(() => {
		try {
			return getContractAddress(chainId);
		} catch {
			return getContractAddress(Number(DEFAULT_NETWORK));
		}
	}, [chainId]);

	const commonContracts = useMemo((): CommonContracts | null => {
		if (!publicClient) return null;

		return {
			seigManager: createContractInstance(
				publicClient as PublicClient,
				CONTRACT_ADDRESS.SeigManager_ADDRESS,
				SeigManager,
			),
			wton: createContractInstance(
				publicClient as PublicClient,
				CONTRACT_ADDRESS.WTON_ADDRESS,
				WTON,
			),
			layer2manager: createContractInstance(
				publicClient as PublicClient,
				CONTRACT_ADDRESS.Layer2Manager_ADDRESS,
				Layer2Manager,
			),
			ton: createContractInstance(
				publicClient as PublicClient,
				CONTRACT_ADDRESS.TON_ADDRESS,
				TON,
			),
		};
	}, [publicClient, CONTRACT_ADDRESS]);

	// Reset fetch state when chainId changes
	useEffect(() => {
		fetchedRef.current = false;
		l2DetailsFetchedRef.current = false;
		clearOperatorDataCache();
		clearL2Cache();
		clearCaches();
		setOperatorsList([]);
	}, [chainId, setOperatorsList]);

	const sortOperators = useCallback(
		(direction: SortDirection = sortDirection): void => {
			setOperatorsList((prevList) => {
				const newList = [...prevList];
				newList.sort((a, b) => compareTotalStaked(a, b, direction));
				return newList;
			});
			setSortDirection(direction);
		},
		[sortDirection, setOperatorsList],
	);

	// PHASE 1: Fast load - fetch essential data using multicall
	useEffect(() => {
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

				const l2Registry = createContractInstance(
					publicClient as PublicClient,
					CONTRACT_ADDRESS.Layer2Registry_ADDRESS,
					Layer2Registry,
				);

				const numLayer2 = await l2Registry.read.numLayer2s();

				const layer2s = await Promise.all(
					Array.from({ length: Number(numLayer2) }, (_, i) =>
						l2Registry.read.layer2ByIndex([i]),
					),
				);
				setOperatorAddress(layer2s);

				const chunkSize = 50;
				let totalStakedAmount = BigNumber.from(0);
				const operators: Operator[] = [];

				for (let i = 0; i < layer2s.length; i += chunkSize) {
					const chunk = layer2s.slice(i, i + chunkSize) as string[];

					const chunkResults = await fetchEssentialBatch(
						publicClient as PublicClient,
						chunk,
						address,
					);
					operators.push(...chunkResults);

					chunkResults.forEach((op) => {
						totalStakedAmount = totalStakedAmount.add(
							BigNumber.from(op.totalStaked || "0"),
						);
					});

					const sortedOperators = [...operators].sort((a, b) =>
						compareTotalStaked(a, b, sortDirection),
					);
					setTotalStaked(totalStakedAmount.toString());
					setOperatorsList(sortedOperators);
				}
			} catch {
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
		sortDirection,
		setOperatorsList,
		CONTRACT_ADDRESS,
		chainId,
		address,
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

				const chunkSize = 5;
				const updatedOperators = [...operatorsList];

				for (let i = 0; i < updatedOperators.length; i += chunkSize) {
					const chunk = updatedOperators.slice(i, i + chunkSize);

					const detailsResults = await Promise.all(
						chunk.map((op) =>
							fetchL2DetailsSingle(
								op,
								publicClient as PublicClient,
								commonContracts,
								blockNumber,
							),
						),
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

					if (
						i % (chunkSize * 2) === 0 ||
						i + chunkSize >= updatedOperators.length
					) {
						const sortedOperators = [...updatedOperators].sort(
							(a, b) => compareTotalStaked(a, b, sortDirection),
						);
						setOperatorsList(sortedOperators);
					}
				}

				const sortedOperators = [...updatedOperators].sort((a, b) =>
					compareTotalStaked(a, b, sortDirection),
				);
				setOperatorsList(sortedOperators);
			} catch {
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
		sortDirection,
		setOperatorsList,
	]);

	const refreshOperator = useCallback(
		async (candidateAddress: string) => {
			try {
				if (!publicClient || !candidateAddress) return false;

				const updatedOperator = await fetchSingleOperator(
					candidateAddress,
					publicClient as PublicClient,
					address,
				);
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

				deleteFromOperatorDataCache(candidateAddress);
				return true;
			} catch {
				return false;
			}
		},
		[publicClient, address, sortDirection, setOperatorsList],
	);

	const refreshAllOperators = useCallback(async () => {
		try {
			if (!publicClient || !operatorAddress) return false;

			setLoading(true);
			clearOperatorDataCache();
			clearL2Cache();

			const chunkSize = 50;
			const operators: Operator[] = [];
			let totalStakedAmount = BigNumber.from(0);

			for (let i = 0; i < operatorAddress.length; i += chunkSize) {
				const chunk = operatorAddress.slice(i, i + chunkSize) as string[];

				const chunkResults = await fetchEssentialBatch(
					publicClient as PublicClient,
					chunk,
					address,
				);
				operators.push(...chunkResults);

				chunkResults.forEach((op) => {
					totalStakedAmount = totalStakedAmount.add(
						BigNumber.from(op.totalStaked || "0"),
					);
				});

				const sortedOperators = [...operators].sort((a, b) =>
					compareTotalStaked(a, b, sortDirection),
				);
				setTotalStaked(totalStakedAmount.toString());
				setOperatorsList(sortedOperators);
			}

			setLoading(false);

			// Phase 2: Background fetch L2 details
			if (commonContracts && blockNumber) {
				setL2DetailsLoading(true);
				const l2ChunkSize = 5;
				const updatedOperators = [...operators];

				for (
					let i = 0;
					i < updatedOperators.length;
					i += l2ChunkSize
				) {
					const chunk = updatedOperators.slice(i, i + l2ChunkSize);

					const detailsResults = await Promise.all(
						chunk.map((op) =>
							fetchL2DetailsSingle(
								op,
								publicClient as PublicClient,
								commonContracts,
								blockNumber,
							),
						),
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
			}

			return true;
		} catch {
			return false;
		} finally {
			setLoading(false);
			setL2DetailsLoading(false);
		}
	}, [
		publicClient,
		operatorAddress,
		address,
		commonContracts,
		blockNumber,
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
