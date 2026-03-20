import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockWriteContract = vi.fn();

vi.mock("wagmi", () => ({
	useChainId: () => 1,
	useWriteContract: () => ({
		data: undefined,
		error: null,
		writeContract: mockWriteContract,
	}),
}));

vi.mock("@/hooks/tx/useTx", () => ({
	useTx: vi.fn(),
}));

import useStakeTON from "@/hooks/staking/useStakeTON";
import { useStakeWTON } from "@/hooks/staking/useStakeWTON";
import useUnstake from "@/hooks/staking/useUnstake";
import useRestake from "@/hooks/staking/useRestake";
import useWithdraw from "@/hooks/staking/useWithdraw";
import useWithdrawL2 from "@/hooks/staking/useWithdrawL2";

const LAYER2 = "0x0000000000000000000000000000000000000001";

describe("Staking Action Hooks", () => {
	beforeEach(() => {
		mockWriteContract.mockClear();
	});

	describe("useStakeTON", () => {
		it("calls writeContract with TON ABI and approveAndCall", () => {
			const { result } = renderHook(() => useStakeTON(LAYER2));

			act(() => {
				result.current.stakeTON(["0xWTON", "1000", "0xdata"]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					functionName: "approveAndCall",
					args: ["0xWTON", "1000", "0xdata"],
				}),
			);
		});

		it("uses TON_ADDRESS contract", () => {
			const { result } = renderHook(() => useStakeTON(LAYER2));

			act(() => {
				result.current.stakeTON(["0xWTON", "1000", "0xdata"]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					address: "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
				}),
			);
		});
	});

	describe("useStakeWTON", () => {
		it("calls writeContract with WTON ABI and approveAndCall", () => {
			const { result } = renderHook(() => useStakeWTON(LAYER2));

			act(() => {
				result.current.stakeWTON([
					"0xDepositManager",
					"1000000000000000000000000000",
					"0xdata",
				]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					functionName: "approveAndCall",
					args: [
						"0xDepositManager",
						"1000000000000000000000000000",
						"0xdata",
					],
				}),
			);
		});

		it("uses WTON_ADDRESS contract", () => {
			const { result } = renderHook(() => useStakeWTON(LAYER2));

			act(() => {
				result.current.stakeWTON(["0xDM", "1000", "0xdata"]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					address: "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2",
				}),
			);
		});
	});

	describe("useUnstake", () => {
		it("calls writeContract with requestWithdrawal", () => {
			const { result } = renderHook(() => useUnstake(LAYER2));

			act(() => {
				result.current.unstake(["0xcandidate", "500"]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					functionName: "requestWithdrawal",
					args: ["0xcandidate", "500"],
				}),
			);
		});

		it("uses DepositManager_ADDRESS contract", () => {
			const { result } = renderHook(() => useUnstake(LAYER2));

			act(() => {
				result.current.unstake(["0xcandidate", "500"]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					address: "0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e",
				}),
			);
		});
	});

	describe("useRestake", () => {
		it("calls writeContract with redepositMulti", () => {
			const { result } = renderHook(() => useRestake(LAYER2));

			act(() => {
				result.current.restake(["0xcandidate", 3]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					functionName: "redepositMulti",
					args: ["0xcandidate", 3],
				}),
			);
		});

		it("uses DepositManager_ADDRESS contract", () => {
			const { result } = renderHook(() => useRestake(LAYER2));

			act(() => {
				result.current.restake(["0xcandidate", 1]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					address: "0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e",
				}),
			);
		});
	});

	describe("useWithdraw", () => {
		it("calls writeContract with processRequests", () => {
			const { result } = renderHook(() => useWithdraw(LAYER2));

			act(() => {
				result.current.withdraw(["0xcandidate", 5, true]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					functionName: "processRequests",
					args: ["0xcandidate", 5, true],
				}),
			);
		});

		it("uses DepositManager_ADDRESS contract", () => {
			const { result } = renderHook(() => useWithdraw(LAYER2));

			act(() => {
				result.current.withdraw(["0xcandidate", 1, false]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					address: "0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e",
				}),
			);
		});
	});

	describe("useWithdrawL2", () => {
		it("calls writeContract with withdrawAndDepositL2", () => {
			const { result } = renderHook(() => useWithdrawL2(LAYER2));

			act(() => {
				result.current.withdrawL2(["0xcandidate", "1000000000000000000000000000"]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					functionName: "withdrawAndDepositL2",
					args: ["0xcandidate", "1000000000000000000000000000"],
				}),
			);
		});

		it("uses DepositManager_ADDRESS contract", () => {
			const { result } = renderHook(() => useWithdrawL2(LAYER2));

			act(() => {
				result.current.withdrawL2(["0xcandidate", "1000"]);
			});

			expect(mockWriteContract).toHaveBeenCalledWith(
				expect.objectContaining({
					address: "0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e",
				}),
			);
		});
	});
});
