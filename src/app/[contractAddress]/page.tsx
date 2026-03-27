"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { isAddress } from "viem";
import { useRecoilValue, useRecoilState } from "recoil";
import {
	filteredOperatorsState,
	Operator,
	operatorsListState,
} from "@/recoil/staking/operator";
import { ethers } from "ethers";
import commafy from "@/utils/trim/commafy";
import { getContractAddress } from "@/constant/contracts";
import { HeadInfo } from "./components/HeadInfo";
import { TokenTypeSelector } from "./components/TokenTypeSelector";
import { BalanceInput } from "@/components/input/CustomInput";
import TON_SYMBOL from "@/assets/images/ton_symbol.svg";
import WTON_SYMBOL from "@/assets/images/wton_symbol.svg";
import Image from "next/image";
import LIST_ARROW from "@/assets/images/list-arrow_icon.svg";
import { inputState } from "@/recoil/input";
import useStakeTON from "@/hooks/staking/useStakeTON";
import { marshalString, unmarshalString } from "@/utils/format/marshalString";
import { padLeft } from "web3-utils";
import {
	convertToRay,
	convertToWei,
	floatParser,
} from "@/utils/number/convert";
import { useExpectedSeigs } from "@/hooks/staking/useCalculateExpectedSeig";
import useSelectOperatorModal from "@/hooks/modal/useSelectOperatorModal";
import ETH from "@/assets/images/eth.svg";
import ARROW from "@/assets/images/right_arrow.svg";
import {
	useTONBalance,
	useWTONBalance,
	useUserStakeAmount,
	useExpectedSeig,
	useLayer2RewardInfo,
	useClaimableL2Seigniorage,
	useCandidateStake,
	useIsCandidateAddon,
} from "@tokamak-ecosystem/staking-sdk-react-kit";
import { useWithdrawableLength } from "@/hooks/staking/useWithdrawable";
import useCallOperators from "@/hooks/staking/useCallOperators";
import useRestake from "@/hooks/staking/useRestake";
import useUpdateSeig from "@/hooks/staking/useUpdateSeig";
import useWithdraw from "@/hooks/staking/useWithdraw";
import useUnstake from "@/hooks/staking/useUnstake";
import { txPendingStatus } from "@/recoil/transaction/tx";
import { useRef } from "react";
import { useMemo } from "react";
import useWithdrawL2 from "@/hooks/staking/useWithdrawL2";
import { ValueSection } from "./components/ValueSection";
import { useStakingInformation } from "@/hooks/info/useStakingInfo";
import { getButtonText } from "@/utils/button/getButtonText";
import { ActionSection } from "./components/ActionSection";
import useClaim from "@/hooks/staking/useClaim";
import { useStakeWTON } from "@/hooks/staking/useStakeWTON";

const useOperatorData = () => {
	const { refreshOperator } = useCallOperators();

	return { refreshOperator };
};

export default function Page() {
	const chainId = useChainId();
	const { TON_ADDRESS, WTON_ADDRESS, DepositManager_ADDRESS } =
		getContractAddress(chainId);

	const router = useRouter();
	const params = useParams();
	const candidateAddress = params?.contractAddress as `0x${string}`;

	const { address } = useAccount();

	const operators = useRecoilValue(filteredOperatorsState);
	const [operatorsList, setOperatorsList] = useRecoilState(operatorsListState);
	const [currentOperator, setCurrentOperator] = useState<Operator | null>(null);

	const [value, setValue] = useRecoilState(inputState);
	const { onOpenSelectModal } = useSelectOperatorModal();
	const [txPending] = useRecoilState(txPendingStatus);

	const prevTxPendingRef = useRef(txPending);
	const { roi } = useStakingInformation();

	const { refreshOperator } = useOperatorData();

	const [isClient, setIsClient] = useState(false);
	const [txError, setTxError] = useState<string | null>(null);

	const { expectedSeig: expSeig, isLoading: expectedSeigLoading } = useExpectedSeig(
		candidateAddress as `0x${string}`,
		BigInt(currentOperator?.yourStaked || "0" ),
		address as `0x${string}`,
	);

	useEffect(() => {
		setIsClient(true);
	}, []);

	useEffect(() => {
		if (!address || !isAddress(candidateAddress)) router.push("/");
	}, [address, candidateAddress, router]);

	useEffect(() => {
		if (candidateAddress && operatorsList.length > 0) {
			const operator = operatorsList.find(
				(op) => op.address === candidateAddress,
			);
			setCurrentOperator(operator || null);
		}
	}, [candidateAddress, operatorsList, txPending]);

	const {
		expectedSeig,
		lastSeigBlock,
		commissionRate: commissionRates,
	} = useExpectedSeigs(
		candidateAddress as `0x${string}`,
		currentOperator?.totalStaked || "0",
	);

	const { layer2Reward } = useLayer2RewardInfo({
		candidateAddress: candidateAddress as `0x${string}`,
	});
	const { claimableAmount } = useClaimableL2Seigniorage({
		candidateAddress: candidateAddress as `0x${string}`,
	});
	const { data: userStaked, isLoading: userStakedLoading } = useUserStakeAmount({
		layer2Address: candidateAddress as `0x${string}`,
		accountAddress: address as `0x${string}`,
	});
	const { data: candidateStaked, isLoading: candidateStakedLoading } = useCandidateStake({
		layer2Address: candidateAddress as `0x${string}`,
	});
	const { isCandidateAddon } = useIsCandidateAddon({
		candidateAddress: candidateAddress as `0x${string}`,
	});

	const [activeToken, setActiveToken] = useState<string>("TON");
	const [activeAction, setActiveAction] = useState<string>("Stake");
	const [withdrawTarget, setWithdrawTarget] = useState<string>("Ethereum");
	const [showWithdrawOptions, setShowWithdrawOptions] =
		useState<boolean>(false);

	const { data: tonBalance } = useTONBalance({ account: address });
	const { data: wtonBalance } = useWTONBalance({ account: address });

	const operatorAddressForHooks = useMemo(
		() => candidateAddress || "",
		[candidateAddress],
	);

	const {
		withdrawableLength,
		withdrawableAmount,
		pendingRequests,
		pendingUnstaked,
	} = useWithdrawableLength(operatorAddressForHooks as `0x${string}`);

	const { stakeTON } = useStakeTON(operatorAddressForHooks);
	const { stakeWTON } = useStakeWTON(operatorAddressForHooks);
	const { unstake } = useUnstake(operatorAddressForHooks);
	const { restake } = useRestake(operatorAddressForHooks);
	const { withdraw } = useWithdraw(operatorAddressForHooks);
	const { withdrawL2 } = useWithdrawL2(operatorAddressForHooks);
	const { updateSeig } = useUpdateSeig(operatorAddressForHooks);
	const { claim } = useClaim(
		operatorAddressForHooks,
		currentOperator?.operatorAddress as `0x${string}`,
	);

	useEffect(() => {
		if (prevTxPendingRef.current === true && txPending === false) {
			if (candidateAddress) {
				refreshOperator(candidateAddress);
			}
		}
		prevTxPendingRef.current = txPending;
	}, [txPending, candidateAddress, refreshOperator]);

	useEffect(() => {
		const token =
			activeAction === "Unstake" || activeAction === "Restake"
				? "TON"
				: activeToken;
		setActiveToken(token);
	}, [activeAction, activeToken]);

	useEffect(() => {
		if (
			activeAction === "WithdrawL2" ||
			(activeAction === "WithdrawL1" && isCandidateAddon)
		) {
			setShowWithdrawOptions(true);
		} else {
			setShowWithdrawOptions(false);
		}
	}, [activeAction, isCandidateAddon]);

	const onClick = useCallback(async () => {
		setTxError(null);
		const amount = floatParser(value);
		let tx;
		const yourStaked = Number(
			userStaked
				? ethers.utils.formatUnits(userStaked, 27)
				: 0,
		);
		if (activeAction === "Unstake") {
			if (!amount || amount <= 0) {
				return;
			}
			if (amount > yourStaked) {
				return;
			}
		}
		if (amount) {
			const weiAmount = convertToWei(amount.toString());
			const rayAmount = convertToRay(amount.toString());
			try {
				switch (activeAction) {
					case "Stake": {
						const marshalData = getData();
						const wtonMarshalData = getDataForWton();
						tx =
							activeToken === "TON"
								? stakeTON([WTON_ADDRESS, weiAmount, marshalData])
								: stakeWTON([
										DepositManager_ADDRESS,
										rayAmount,
										wtonMarshalData,
									]);
						break;
					}
					case "Unstake": {
						const rayAmouont = convertToRay(amount.toString());
						tx = await unstake([candidateAddress, rayAmouont]);
						break;
					}
					case "Withdraw": {
						tx = await withdraw([
							candidateAddress,
							withdrawableLength,
							activeToken === "TON" ? true : false,
						]);
						break;
					}
					case "WithdrawL1": {
						tx = await withdraw([
							candidateAddress,
							withdrawableLength,
							activeToken === "TON" ? true : false,
						]);
						break;
					}
					case "WithdrawL2": {
						tx = await withdrawL2([candidateAddress, rayAmount]);
						break;
					}
					case "Restake": {
						tx = await restake([candidateAddress, pendingRequests]);
						break;
					}
					default:
						break;
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : "Transaction failed";
				setTxError(message.includes("User rejected") ? "Transaction rejected" : message);
			}
			return tx;
		}
	}, [
		activeAction,
		withdrawableLength,
		value,
		withdrawTarget,
		isCandidateAddon,
		userStaked,
		DepositManager_ADDRESS,
	]);

	const formatUnits = useCallback((amount: string, unit: number) => {
		try {
			return commafy(ethers.utils.formatUnits(amount, unit), 2);
		} catch (e) {
			return "0";
		}
	}, []);

	const getData = useCallback(() => {
		if (candidateAddress)
			return marshalString(
				[DepositManager_ADDRESS, candidateAddress]
					.map(unmarshalString)
					.map((str) => padLeft(str, 64))
					.join(""),
			);
	}, [DepositManager_ADDRESS, candidateAddress]);

	const getDataForWton = useCallback(() => {
		if (candidateAddress)
			return marshalString(
				[candidateAddress]
					.map(unmarshalString)
					.map((str) => padLeft(str, 64))
					.join(""),
			);
	}, [candidateAddress]);

	const isUnstakeDisabled = useCallback(() => {
		if (!userStaked) return true;
		const stakedAmount = Number(
			ethers.utils.formatUnits(userStaked.toString(), 27),
		);
		if (stakedAmount === 0) return true;
		if (!value || value === "0" || value === "0.00") return true;
		return value ? Number(value) > stakedAmount : true;
	}, [userStaked, value]);

	const showUnstakeWarning = useCallback(() => {
		if (!userStaked || !value) return false;
		const stakedAmount = Number(
			ethers.utils.formatUnits(userStaked.toString(), 27),
		);
		return value !== "0" && value !== "0.00" && Number(value) > stakedAmount;
	}, [userStaked, value]);

	return (
		<div className="w-full max-w-[515px] h-full mt-4 lg:mt-[100px] py-5 px-4 lg:px-0 flex flex-col justify-start mx-auto">
			{/* Title Section */}
			<div className="flex mb-6 items-start justify-between flex-wrap gap-3">
				<div
					className="flex items-center cursor-pointer"
					onClick={() => router.push("/")}
				>
					<button
						aria-label="Back"
						className="p-2 hover:bg-gray-100 rounded-md transition-colors"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
						</svg>
					</button>
					<span className="ml-2">Back</span>
				</div>
				<div className="flex text-[22px] lg:text-[30px] font-bold flex-row items-center flex-1 justify-center lg:ml-5">
					<span className="truncate max-w-[180px] lg:max-w-none">{currentOperator?.name || "Loading..."}</span>
					{currentOperator?.isL2 && (
						<div className="bg-[#257eee] w-[34px] h-[18px] rounded-[3px] flex justify-center items-center text-xs text-white font-semibold font-roboto ml-[5px] flex-shrink-0">
							L2
						</div>
					)}
					<div
						className="ml-3 cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
						onClick={() => onOpenSelectModal()}
					>
						<Image src={LIST_ARROW} alt={""} />
					</div>
				</div>
				<div className="w-[72px] hidden lg:block" />
			</div>

			{/* Info Section */}
			<div className="flex justify-between mb-8 flex-wrap gap-4 px-0 lg:px-[15px]">
				<HeadInfo
					title="Staking APY"
					value={
						roi.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " %"
					}
					label=""
				/>
				<HeadInfo
					title="Total staked"
					value={`${formatUnits(candidateStaked || "0", 27)} TON`}
					// isLoading={!candidateStakedLoading}
					label=""
				/>
				<HeadInfo
					title="Commission rate"
					value={formatUnits((commissionRates ?? 0).toString(), 25) + " %"}
					label=""
				/>
			</div>

			<ActionSection
				activeAction={activeAction}
				setActiveAction={setActiveAction}
				isL2={isCandidateAddon}
				setValue={setValue}
				withdrawableAmount={withdrawableAmount}
				withdrawTarget={withdrawTarget}
				pendingUnstaked={pendingUnstaked}
			/>
			
			{/* Main Box Section */}
			<div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-6">
				<div className="flex mb-5 flex-wrap gap-2">
					{activeAction === "WithdrawL2" ? (
						<div className="text-[#1c1c1c] font-open-sans text-xs font-semibold flex items-center h-7">
							<div className="flex items-center">
								<div className="w-7 mr-1.5">
									<Image src={ETH} alt={""} />
								</div>
								Ethereum
							</div>
							<div className="w-[18px] mx-1.5">
								<Image src={ARROW} alt={""} />
							</div>
							<div>{currentOperator?.name}</div>
						</div>
					) : activeAction === "Unstake" || activeAction === "Restake" ? (
						<div className="h-6" />
					) : (
						<TokenTypeSelector tab={activeToken} setTab={setActiveToken} />
					)}
					<span className="ml-auto mt-[3px] text-[#7E7E8F] text-xs font-normal">
						Balance:{" "}
						{formatUnits(
							activeToken === "TON" ? tonBalance : wtonBalance || "0",
							activeToken === "TON" ? 18 : 27,
						)}{" "}
						{activeToken}
					</span>
				</div>
				
				{/* Balance Section */}
				<div className="flex mb-[15px] items-center justify-between flex-row h-auto min-h-[70px] lg:h-[90px]">
					{activeAction === "Withdraw" ||
					activeAction === "Restake" ||
					activeAction === "WithdrawL1" ? (
						<div className="text-[22px] lg:text-[30px] font-open-sans font-semibold ml-[15px] break-all">
							{formatUnits(
								activeAction === "Withdraw" || activeAction === "WithdrawL1"
									? withdrawableAmount
									: pendingUnstaked,
								27,
							)}
						</div>
					) : (
						<BalanceInput
							placeHolder={"0.00"}
							type={"staking"}
							maxValue={
								activeAction === "Stake"
									? activeToken === "TON"
										? formatUnits(tonBalance, 18)
										: formatUnits(wtonBalance, 27)
									: formatUnits(userStaked || "0", 27)
							}
						/>
					)}
					<div className="flex items-center mr-[15px] flex-shrink-0">
						<Image
							src={activeToken === "TON" ? TON_SYMBOL : WTON_SYMBOL}
							alt={""}
						/>
						<span className="text-lg font-bold ml-2 mt-0.5">
							{activeToken}
						</span>
					</div>
				</div>

				<button
					onClick={async () => onClick()}
					className={`w-full h-14 rounded-lg font-semibold text-white flex items-center justify-center transition-all ${
						value === "0.00" ||
						!value ||
						value === "0" ||
						(activeAction === "Unstake" && isUnstakeDisabled()) ||
						txPending
							? "bg-gray-300 cursor-not-allowed"
							: "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
					}`}
					disabled={
						value === "0.00" ||
						!value ||
						value === "0" ||
						(activeAction === "Unstake" && isUnstakeDisabled()) ||
						txPending
					}
				>
					{isClient &&
						(txPending ? (
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
						) : (
							getButtonText(value, activeAction)
						))}
				</button>

				{txError && (
					<div className="text-sm text-[#FF2D78] text-center px-4 font-normal w-full mb-2 mt-2">
						{txError}
					</div>
				)}

				{activeAction === "Unstake" && showUnstakeWarning() && (
					<div className="text-sm text-[#FF2D78] text-center px-4 font-normal w-full mb-4">
						Warning: Unstake amount exceeds your staked amount
					</div>
				)}

				<div className="flex flex-col space-y-6 mt-6">
					<ValueSection
						title={"Your Staked Amount"}
						value={currentOperator?.yourStaked || "0"}
					/>
					<div className="border-t border-gray-200" />
					<ValueSection
						title={"Unclaimed Staking Reward"}
						value={expSeig}
						onClaim={() => updateSeig()}
						seigUpdated={lastSeigBlock ?? undefined}
					/>
				</div>
			</div>
			
			{isCandidateAddon ? (
				<div className="flex flex-col">
					<div className="text-sm lg:text-base font-bold text-[#1c1c1c] flex justify-center w-full">
						Sequencer seigniorage
					</div>
					<div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-6 w-full">
						<div className="flex flex-col space-y-6">
							<ValueSection
								title={"TON Bridged to L2"}
								value={layer2Reward?.layer2Tvl.toString() || "0"}
								label={
									"TON bridged to L2 is the amount of TON that has been bridged to L2."
								}
							/>
							<div className="border-t border-gray-200" />
							<ValueSection
								title={"Claimable Seigniorage"}
								value={claimableAmount?.toString() || "0"}
								onClaim={() => claim([WTON_ADDRESS, claimableAmount])}
								manager={currentOperator?.manager}
								label={
									"Claimable seigniorage is the amount of seigniorage that the L2 operator can claim."
								}
							/>
						</div>
					</div>
				</div>
			) : (
				""
			)}
			
			{activeAction === "Stake" && (
				<div className="text-[12px] lg:text-sm text-[#3E495C] text-center px-2 lg:px-4 font-normal w-full">
					<span className="text-[#FF2D78]">Warning:</span>{" "}
					Staking TON will earn you TON staking rewards. However, you have to
					unstake and wait for 93,046 blocks (~14 days) to withdraw.
				</div>
			)}
			{activeAction === "Unstake" && (
				<div className="text-[12px] lg:text-sm text-[#3E495C] text-center px-2 lg:px-4 font-normal w-full">
					<span className="text-[#FF2D78]">Warning:</span>{" "}
					To withdraw staked TON, it needs to be unstaked first and after 93,046
					blocks (~14 days) they can be withdrawn to your account.
				</div>
			)}
			{activeAction === "Restake" && (
				<div className="text-[12px] lg:text-sm text-[#3E495C] text-center px-2 lg:px-4 font-normal w-full">
					<span className="text-[#FF2D78]">Warning:</span>{" "}
					Restaking unstaked TON earns you TON from staking. However, to
					withdraw, they need to be unstaked and wait for 93,046 blocks (~14
					days).
				</div>
			)}
		</div>
	);
}
