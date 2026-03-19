import { formatUnits } from "viem";
import {
	useBlockNumber,
	useAccount,
	usePublicClient,
	useWalletClient,
	useChainId,
} from "wagmi";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRecoilState } from "recoil";
import { txPendingStatus } from "@/recoil/transaction/tx";
import { getContractAddress } from "@/constant/contracts";
import { getContract, isAddress, PublicClient } from "viem";

// ABIs
import Coinage from "@/abis/AutoRefactorCoinage.json";
import RefactorCoinageSnapshotABI from "@/abis/RefactorCoinageSnapshot.json";
import TON_ABI from "@/abis/TON.json";
import WTON_ABI from "@/abis/WTON.json";
import DepositManager_ABI from "@/abis/DepositManager.json";
import SeigManager_ABI from "@/abis/SeigManager.json";

// Type definitions
interface BalanceAndFactor {
	balance: bigint;
	refactoredCount: bigint;
}

interface FactorResult {
	factor: bigint;
	refactorCount: bigint;
}

interface SeigResult {
	expectedSeig: string;
	seigOfLayer: string;
	lastSeigBlock: string;
	commissionRate: string;
}

// Constants
const CONSTANTS = {
	RAYDIFF: BigInt("1" + "0".repeat(9)),
	RAY: BigInt("1" + "0".repeat(27)),
	REFACTOR_DIVIDER: BigInt(2),
	REFACTOR_BOUNDARY: BigInt("1" + "0".repeat(28)),
	ZERO_ADDRESS: "0x0000000000000000000000000000000000000000" as const,
	ONE_ADDRESS: "0x0000000000000000000000000000000000000001" as const,
};

// Contract cache
const contractCache = new Map<string, any>();

/**
 * Sets the factor for refactoring
 */
const setFactor = (factor_: bigint): FactorResult => {
	let count = 0;
	let f = factor_;

	while (f >= CONSTANTS.REFACTOR_BOUNDARY) {
		f = f / CONSTANTS.REFACTOR_DIVIDER;
		count++;
	}

	return { factor: f, refactorCount: BigInt(count) };
};

/**
 * Applies factor calculation
 */
const applyFactor = (
	factor: bigint,
	refactorCount: bigint,
	balance: bigint,
	refactoredCount: bigint,
): bigint => {
	let v = (balance * factor) / CONSTANTS.RAY;

	const powerDiff = refactorCount - refactoredCount;
	let multiplier = BigInt(1);

	for (let i = 0; i < powerDiff; i++) {
		multiplier *= CONSTANTS.REFACTOR_DIVIDER;
	}

	v = v * multiplier;
	return v;
};

/**
 * Hook to calculate expected seig rewards
 */
export function useExpectedSeigs(
	candidateContract: `0x${string}` | undefined,
	stakedAmount: string,
): SeigResult {
	const [expectedSeig, setExpectedSeig] = useState<string>("0");
	const [seigOfLayer, setSeigOfLayer] = useState<string>("0");
	const [commissionRate, setCommissionRate] = useState<string>("0");
	const [lastSeigBlock, setLastSeigBlock] = useState<string>("0");

	const { address: account } = useAccount();
	const publicClient = usePublicClient();
	const { data: blockNumber } = useBlockNumber();
	const [txPending] = useRecoilState(txPendingStatus);

	const chainId = useChainId();
	const CONTRACT_ADDRESS = getContractAddress(chainId);

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
				SeigManager_ABI,
			),
			wton: getContractInstance(CONTRACT_ADDRESS.WTON_ADDRESS, WTON_ABI),
			ton: getContractInstance(CONTRACT_ADDRESS.TON_ADDRESS, TON_ABI),
		};
	}, [publicClient, getContractInstance, CONTRACT_ADDRESS.WTON_ADDRESS, CONTRACT_ADDRESS.SeigManager_ADDRESS, CONTRACT_ADDRESS.TON_ADDRESS]);

	useEffect(() => {
		const calculateSeig = async (): Promise<void> => {
			if (!publicClient || !commonContracts || !blockNumber || !account) {
				return;
			}

			try {
				const { seigManager, wton, ton } = commonContracts;

				// Get all required data in parallel
				const [
					lastSeigBlockData,
					seigPerBlockData,
					relativeSeigRateData,
					totData,
					commissionRatesData,
					isCommissionRateNegativeData,
					coinageAddressData,
					tonTotalSupplyData,
					tonBalanceOfWTONData,
					tonBalanceOfZeroData,
					tonBalanceOfOneData,
				] = await Promise.all([
					seigManager.read.lastSeigBlock(),
					seigManager.read.seigPerBlock(),
					seigManager.read.relativeSeigRate(),
					seigManager.read.tot(),
					seigManager.read.commissionRates([
						candidateContract as `0x${string}`,
					]),
					seigManager.read.isCommissionRateNegative([
						candidateContract as `0x${string}`,
					]),
					seigManager.read.coinages([candidateContract as `0x${string}`]),
					ton.read.totalSupply(),
					ton.read.balanceOf([CONTRACT_ADDRESS.WTON_ADDRESS as `0x${string}`]),
					ton.read.balanceOf([CONSTANTS.ZERO_ADDRESS as `0x${string}`]),
					ton.read.balanceOf([CONSTANTS.ONE_ADDRESS as `0x${string}`]),
				]);

				// Get TOT contract data
				const totContract = getContractInstance(
					totData as string,
					RefactorCoinageSnapshotABI,
				);
				const [totTotalSupply, totFactor, totBalanceAndFactorResult] =
					await Promise.all([
						totContract.read.totalSupply(),
						totContract.read.factor(),
						totContract.read.getBalanceAndFactor([
							candidateContract as `0x${string}`,
						]),
					]);

				// Get Coinage contract data
				const coinageContract = getContractInstance(
					coinageAddressData as string,
					Coinage,
				);
				const [coinageTotalSupply, userStaked] = await Promise.all([
					coinageContract.read.totalSupply(),
					coinageContract.read.balanceOf([account as `0x${string}`]),
				]);

				// Calculate tos
				const tos =
					(BigInt(tonTotalSupplyData.toString()) -
						BigInt(tonBalanceOfWTONData.toString()) -
						BigInt(tonBalanceOfZeroData.toString()) -
						BigInt(tonBalanceOfOneData.toString())) *
						CONSTANTS.RAYDIFF +
					totTotalSupply;

				// Calculate maxSeig
				if (!blockNumber) return;
				const span = blockNumber - lastSeigBlockData;
				const maxSeig = seigPerBlockData * span;

				// Calculate stakedSeig
				const stakedSeig1 = (maxSeig * totTotalSupply) / tos;
				const unstakedSeig = maxSeig - stakedSeig1;
				const stakedSeig =
					stakedSeig1 + (unstakedSeig * relativeSeigRateData) / CONSTANTS.RAY;

				// Calculate new totTotalSupply and factor
				const nextTotTotalSupply = totTotalSupply + stakedSeig;
				const newTotFactor = (nextTotTotalSupply * totFactor) / totTotalSupply;

				// Refactoring calculation
				const { factor: newFactor, refactorCount } = setFactor(
					BigInt(newTotFactor.toString()),
				);

				// Calculate new balance
				const balance = totBalanceAndFactorResult[0].balance;
				const refactoredCount = totBalanceAndFactorResult[0].refactoredCount;

				const nextBalanceOfLayerInTot = applyFactor(
					newFactor,
					refactorCount,
					balance,
					refactoredCount,
				);

				// Final seig calculation
				const _seigOfLayer = nextBalanceOfLayerInTot - coinageTotalSupply;
				setCommissionRate(formatUnits(commissionRatesData as bigint, 27));

				let seig: bigint;
				const commissionRateValue = commissionRatesData
					? BigInt(commissionRatesData.toString())
					: BigInt(0);

				if (commissionRateValue !== BigInt(0)) {
					if (!isCommissionRateNegativeData) {
						const operatorSeigs =
							(_seigOfLayer * commissionRateValue) / CONSTANTS.RAY;
						const restSeigs = _seigOfLayer - operatorSeigs;
						const userSeig =
							BigInt(stakedAmount) === BigInt(0)
								? BigInt(0)
								: (restSeigs * userStaked) / BigInt(stakedAmount);
						seig = userSeig;
					} else {
						seig =
							BigInt(stakedAmount) === BigInt(0)
								? BigInt(0)
								: (_seigOfLayer * userStaked) / BigInt(stakedAmount);
					}
				} else {
					seig =
						BigInt(stakedAmount) === BigInt(0)
							? BigInt(0)
							: (_seigOfLayer * userStaked) / BigInt(stakedAmount);
				}

				setSeigOfLayer(_seigOfLayer.toString());
				setExpectedSeig(seig < BigInt(0) ? "0" : seig.toString());
				setLastSeigBlock(lastSeigBlockData.toString());
			} catch (e) {
				setSeigOfLayer("0");
				setExpectedSeig("0");
				setLastSeigBlock("0");
			}
		};

		calculateSeig();
	}, [
		account,
		candidateContract,
		txPending,
		stakedAmount,
		blockNumber,
		publicClient,
		commonContracts,
		getContractInstance,
		CONTRACT_ADDRESS,
	]);

	return { expectedSeig, seigOfLayer, commissionRate, lastSeigBlock };
}
