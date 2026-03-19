import { calculateRoiBasedonCompound } from "utils/apy/calculateRoi";
import { useEffect, useRef, useCallback } from "react";
import { useRecoilState } from "recoil";
import {
	stakingInfoState,
	roiState,
	SupplyValueProps,
} from "recoil/staking/info";
import useCallSeigManager from "../contracts/useCallSeigManager";
import useCallOperators from "../staking/useCallOperators";
import { ethers } from "ethers";
import commafy from "@/utils/trim/commafy";
import { useAllCandidatesTotalStaked } from "@tokamak-ecosystem/staking-sdk-react-kit";

/**
 * A hook to fetch and update staking information, such as total staked
 * amount, total supply of TON, and staking APY.
 *
 * @returns An object containing the staking information and
 * the current ROI.
 */
export function useStakingInformation() {
	// Use Recoil state
	const [stakingInfo, setStakingInfo] = useRecoilState(stakingInfoState);
	const [roi, setROI] = useRecoilState(roiState);

	// Refs to track previous values
	const prevTotalStakedRef = useRef<string>("0");
	const prevTotalSupplyRef = useRef<string>("0");
	const isInitializedRef = useRef<boolean>(false);

	// const { data: totalStaked, isLoading, error } = useAllCandidatesTotalStaked();
	const { result: totalStaked } = useCallSeigManager("stakeOfTotal");
	const { result: totalSupplyResult } = useCallSeigManager("totalSupplyOfTon");
	// console.log(totalSupplyResult.data)

	// Memoize the update function to avoid recreating it on each render
	const updateStakingInfo = useCallback(
		(calculatedRoi: number, totalStakedString: string) => {
			setROI(calculatedRoi);

			setStakingInfo([
				{
					title: "Staking APY",
					tooltip:
						"Staking APY varies among DAO candidates. The rate depends on how frequently stakers update seigniorage for their chosen DAO candidate, since staking rewards compound with each update.",
					tooltip2: "",
					value: calculatedRoi,
					unit: "%",
					width: "325px",
				},
				{
					title: "Total staked",
					tooltip: "",
					tooltip2: "",
					value: isNaN(Number(totalStakedString))
						? "0.00"
						: commafy(totalStakedString, 2),
					unit: "TON",
				},
				{
					title: "Seigniorage emission",
					tooltip:
						"3.92 TON is minted with each Ethereum block and distributed as follows: TON stakers (74%), DAO (20%), PowerTON holders (0%), and L2 operators (6%).",
					tooltip2: "",
					value: `~28,224`,
					unit: "TON per day",
					width: "470px",
				},
			]);
		},
		[setROI, setStakingInfo],
	);

	// Main effect for fetching and updating data
	useEffect(() => {
		// Skip if data dependencies aren't available yet
		// if (!totalStaked || !totalSupplyResult?.data) return;
		if (!totalSupplyResult?.data) return;

		async function fetch() {
			try {
				if (!totalStaked?.data) return;
				const totalStakedString = ethers.utils.formatUnits(
					totalStaked.data.toString(),
					27,
				);
				// const totalStakedString = '0.00'
				const totalSupplyData = totalSupplyResult.data as bigint;
				const totalSupplyString = ethers.utils.formatUnits(
					totalSupplyData.toString(),
					27,
				);

				// Check if values have actually changed to avoid unnecessary updates
				const totalStakedChanged =
					totalStakedString !== prevTotalStakedRef.current;
				const totalSupplyChanged =
					totalSupplyString !== prevTotalSupplyRef.current;

				// Only recalculate if the data has changed or it's the first initialization
				if (
					totalStakedChanged ||
					totalSupplyChanged ||
					!isInitializedRef.current
				) {
					prevTotalStakedRef.current = totalStakedString;
					prevTotalSupplyRef.current = totalSupplyString;

					const calculatedRoi = calculateRoiBasedonCompound({
						totalStakedAmount: Number(totalStakedString),
						totalSupply: Number(totalSupplyString),
						duration: "1-year",
					});
					// Only update state if ROI has changed or it's the first initialization
					if (calculatedRoi !== roi || !isInitializedRef.current) {
						// console.log("Updating ROI:", calculatedRoi);
						updateStakingInfo(calculatedRoi, totalStakedString);
						isInitializedRef.current = true;
					}
				}
			} catch (error) {
				// non-critical
			}
		}

		fetch();
	}, [totalSupplyResult, updateStakingInfo, roi]);

	return {
		stakingInfo,
		roi,
	};
}
