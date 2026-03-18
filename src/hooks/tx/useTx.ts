import {
	txDataStatus,
	txHashLog,
	txHashStatus,
	txPendingStatus,
} from "@/recoil/transaction/tx";
import { useMemo } from "react";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { useChainId, useWaitForTransactionReceipt } from "wagmi";
import useCallOperators from "../staking/useCallOperators";
import { inputState } from "@/recoil/input";
import { useRef } from "react";

export function useTransaction() {
	const [txData] = useRecoilState(txDataStatus);

	const pendingTransactionToApprove = useMemo(() => {
		if (txData)
			return Object.entries(txData).filter(([, value]) => {
				return value.transactionHash === undefined;
			});
	}, [txData]);

	const pendingTransaction = useMemo(() => {
		if (txData)
			return Object.entries(txData).filter(([, value]) => {
				return value.transactionHash === undefined;
			});
		return undefined;
	}, [txData]);

	const isPending = useMemo(() => {
		if (pendingTransaction && pendingTransaction.length > 0) {
			return true;
		}
		return false;
	}, [pendingTransaction, txData]);

	const confirmedTransaction = useMemo(() => {
		if (txData)
			return Object.entries(txData).filter(([, value]) => {
				return value.transactionHash !== undefined ? value : undefined;
			});
	}, [txData]);

	const confirmedApproveTransaction = useMemo(() => {
		if (txData) {
			const filteredData = Object.entries(txData).filter(([, value]) => {
				return value.transactionState === "success";
			})[0];
			if (filteredData && filteredData[1]) {
				return filteredData[1];
			}
		}
	}, [txData]);

	const confirmedRevokeTransaction = useMemo(() => {
		if (txData) {
			const filteredData = Object.entries(txData).filter(([, value]) => {
				return value.transactionState === "success";
			})[0];
			if (filteredData && filteredData[1]) {
				return filteredData[1];
			}
		}
	}, [txData]);

	return {
		allTransaction: txData,
		pendingTransaction,
		isPending,
		pendingTransactionToApprove,
		confirmedTransaction,
		confirmedApproveTransaction,
		confirmedRevokeTransaction,
	};
}

export function useTx(params: {
	hash: `0x${string}` | undefined;
	layer2: `0x${string}`;
}) {
	const { hash, layer2 } = params;
	const chainId = useChainId();
	const { data, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
		hash,
		chainId: chainId,
	});

	const [, setTxData] = useRecoilState(txDataStatus);
	const [, setTxPending] = useRecoilState(txPendingStatus);
	const [, setTxHash] = useRecoilState(txHashStatus);
	const [, setValue] = useRecoilState(inputState);

	const { refreshOperator } = useCallOperators();

	const refreshedRef = useRef(false);

	useEffect(() => {
		if (isLoading && !isError) {
			return setTxPending(true);
		}
		setValue("");
		return setTxPending(false);
	}, [isLoading, chainId, isError, setTxPending]);

	const { confirmedTransaction } = useTransaction();

	useEffect(() => {
		if (data?.transactionHash) return setTxHash(data.transactionHash);
	}, [data, setTxHash]);

	useEffect(() => {
		if (hash === undefined) return setTxPending(false);
	}, [hash, setTxPending]);

	//initialize txData when chainId is changed
	useEffect(() => {
		setTxData(undefined);
		refreshedRef.current = false;
	}, [chainId, setTxData]);

	useEffect(() => {
		if (isLoading && chainId && hash) {
			refreshedRef.current = false;

			return setTxData({
				[hash]: {
					transactionHash: undefined,
					transactionState: undefined,
					network: chainId,
					isToasted: false,
				},
			});
		}
	}, [isLoading, hash, chainId, setTxData]);

	useEffect(() => {
		const handleSuccess = async () => {
			if (isSuccess && data && chainId && hash && !refreshedRef.current) {
				const { transactionHash } = data;

				setTxData({
					[hash]: {
						transactionHash,
						transactionState: "success",
						network: chainId,
						isToasted: false,
					},
				});

				refreshedRef.current = true;
				// Toast notification would go here
				console.log("Transaction successful");
				if (layer2) {
					console.log("Transaction successful, refreshing operator data...");
					try {
						const success = await refreshOperator(layer2);
						console.log("Refresh result:", success ? "Success" : "Failed");
					} catch (error) {
						console.error("Error refreshing operator:", error);
					}
				}
			}
		};
		handleSuccess();
	}, [isSuccess, data, chainId, hash, layer2, refreshOperator, setTxData]);

	useEffect(() => {
		if (isSuccess) {
			console.log("Transaction successful:", hash);
		}
	}, [isSuccess, hash]);

	return { isLoading };
}
