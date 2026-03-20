import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useBlockNumber, useChainId } from "wagmi";
import { Address, getContract } from "viem";
import DepositManager from "@/abis/DepositManager.json";
import { getContractAddress } from "@/constant/contracts";
import { BigNumber } from "ethers";

/**
 * Hook to get withdrawable length based on withdrawable requests
 * @param layer2 Layer2 address
 * @returns withdrawableLength and loading state
 */
export function useWithdrawableLength(layer2: Address | undefined) {
	const chainId = useChainId();
	const { DepositManager_ADDRESS } = getContractAddress(chainId);

	const { address: account } = useAccount();
	const { data: currentBlockNumber } = useBlockNumber();
	const publicClient = usePublicClient();

	const [withdrawableLength, setWithdrawableLength] = useState("0");
	const [withdrawableAmount, setWithdrawableAmount] = useState("0");
	const [pendingRequests, setPendingRequests] = useState(0);
	const [pendingUnstaked, setPendingUnstaked] = useState("0");
	const [isLoading, setIsLoading] = useState(false);

	const fetchWithdrawableLength = useCallback(async () => {
		if (!layer2 || !account || !publicClient || !currentBlockNumber) {
			return;
		}

		const depositManagerContract = getContract({
			address: DepositManager_ADDRESS as `0x${string}`,
			abi: DepositManager,
			client: publicClient,
		});

		if (!layer2 || !account || !publicClient || !currentBlockNumber) {
			return;
		}

		try {
			setIsLoading(true);
			const initial = BigNumber.from("0");

			// Get number of pending requests and request index
			const numPendingRequests =
				await depositManagerContract.read.numPendingRequests([layer2, account]);
			let requestIndex =
				await depositManagerContract.read.withdrawalRequestIndex([
					layer2,
					account,
				]);
			const pendingUnstaked =
				(await depositManagerContract.read.pendingUnstaked([
					layer2,
					account,
				])) as bigint;

			// Collect all pending requests
			const pendingRequests = [];
			for (let i = 0; i < Number(numPendingRequests); i++) {
				const req = await depositManagerContract.read.withdrawalRequest([
					layer2,
					account,
					BigInt(Number(requestIndex) + i),
				]);
				pendingRequests.push(req);
			}

			// Filter withdrawable requests
			const withdrawableList = pendingRequests.filter(
				(req: any) => Number(req[0]) <= currentBlockNumber,
			);

			const reduceAmount = (acc: BigNumber, req: any) => acc.add(req[1]);
			const withdrawableAmount = withdrawableList.reduce(reduceAmount, initial);

			setPendingUnstaked(pendingUnstaked.toString());
			setWithdrawableAmount(withdrawableAmount.toString());
			setWithdrawableLength(String(withdrawableList.length));
			setPendingRequests(Number(numPendingRequests));
		} catch (error) {
			// non-critical
		} finally {
			setIsLoading(false);
		}
	}, [layer2, account, publicClient, currentBlockNumber]);

	useEffect(() => {
		fetchWithdrawableLength();
	}, [fetchWithdrawableLength]);

	return {
		withdrawableAmount,
		withdrawableLength,
		pendingRequests,
		pendingUnstaked,
		isLoading,
		refetch: fetchWithdrawableLength,
	};
}
