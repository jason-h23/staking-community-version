import { PublicClient } from "viem";
import { BigNumber } from "ethers";
import CandidateAddon from "@/constant/abis/CandidateAddOn.json";
import OperatorManager from "@/abis/OperatorManager.json";
import SystemConfig from "@/abis/SystemConfig.json";
import type { Operator, CommonContracts } from "./types";
import { createContractInstance, checkContractExists } from "./contractFactory";

const l2DetailsCache = new Map<string, Partial<Operator>>();

export function clearL2Cache(): void {
	l2DetailsCache.clear();
}

export async function fetchL2DetailsSingle(
	operator: Operator,
	publicClient: PublicClient,
	commonContracts: CommonContracts,
	blockNumber: bigint | undefined,
): Promise<Partial<Operator>> {
	if (!operator.address || !publicClient || !commonContracts) return {};
	const { layer2manager, seigManager, wton, ton } = commonContracts;

	if (l2DetailsCache.has(operator.address)) {
		return l2DetailsCache.get(operator.address)!;
	}

	try {
		const candidateAddon = createContractInstance(
			publicClient,
			operator.address,
			CandidateAddon,
		);
		if (!candidateAddon) return {};

		const operatorAddress = await candidateAddon.read
			.operator()
			.catch(() => null);
		if (!operatorAddress) return {};

		const details: Partial<Operator> = { operatorAddress };

		const operatorContractExists = await checkContractExists(
			publicClient,
			operatorAddress as string,
		);
		if (!operatorContractExists) {
			l2DetailsCache.set(operator.address, details);
			return details;
		}

		const operatorManager = createContractInstance(
			publicClient,
			operatorAddress as string,
			OperatorManager,
		);
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
			const rollupConfig = createContractInstance(
				publicClient,
				rollupConfigAddress as string,
				SystemConfig,
			);
			if (!rollupConfig) {
				l2DetailsCache.set(operator.address, details);
				return details;
			}

			const bridgeDetail = await layer2manager.read.checkL1BridgeDetail([
				rollupConfigAddress,
			]);

			if (Array.isArray(bridgeDetail) && bridgeDetail[5] === 1) {
				details.isL2 = true;

				if (ton && wton && seigManager && blockNumber) {
					const [bridgeAddress, wtonBalanceOfM] = await Promise.all([
						rollupConfig.read.optimismPortal().catch(() => null),
						wton.read
							.balanceOf([operatorAddress])
							.catch(() => "0"),
					]);

					if (bridgeAddress) {
						const lockedInBridge = await ton.read
							.balanceOf([bridgeAddress])
							.catch(() => "0");
						details.lockedInL2 = lockedInBridge.toString();
					}

					try {
						const estimatedDistribution =
							await seigManager.read.estimatedDistribute([
								Number(blockNumber.toString()) + 1,
								operator.address,
								true,
							]);

						if (
							estimatedDistribution &&
							estimatedDistribution[7] !== undefined
						) {
							const addedWton = BigNumber.from(
								wtonBalanceOfM || "0",
							).add(
								BigNumber.from(
									estimatedDistribution[7] || "0",
								),
							);
							details.sequencerSeig = addedWton.toString();
						}
					} catch {
						// estimation failed — non-critical
					}
				}
			}
		} catch {
			// bridge details fetch failed — non-critical
		}

		l2DetailsCache.set(operator.address, details);
		return details;
	} catch {
		return {};
	}
}
