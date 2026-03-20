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

import { useTxAction } from "@/hooks/staking/useTxAction";
import { getContractAddress } from "@/constant/contracts";

const MOCK_ABI = [{ type: "function", name: "testFn", inputs: [], outputs: [] }];

describe("useTxAction", () => {
	beforeEach(() => {
		mockWriteContract.mockClear();
	});

	it("returns execute and writeError", () => {
		const { result } = renderHook(() =>
			useTxAction({
				contractKey: "TON_ADDRESS",
				abi: MOCK_ABI,
				functionName: "approveAndCall",
				layer2: "0xlayer2",
			}),
		);

		expect(result.current.execute).toBeTypeOf("function");
		expect(result.current.writeError).toBeNull();
	});

	it("calls writeContract with mainnet TON_ADDRESS for chainId 1", () => {
		const { result } = renderHook(() =>
			useTxAction({
				contractKey: "TON_ADDRESS",
				abi: MOCK_ABI,
				functionName: "approveAndCall",
				layer2: "0xlayer2",
			}),
		);

		const mainnetAddresses = getContractAddress(1);

		act(() => {
			result.current.execute(["arg1", "arg2"]);
		});

		expect(mockWriteContract).toHaveBeenCalledWith({
			address: mainnetAddresses.TON_ADDRESS,
			abi: MOCK_ABI,
			functionName: "approveAndCall",
			args: ["arg1", "arg2"],
		});
	});

	it("resolves DepositManager_ADDRESS correctly", () => {
		const { result } = renderHook(() =>
			useTxAction({
				contractKey: "DepositManager_ADDRESS",
				abi: MOCK_ABI,
				functionName: "requestWithdrawal",
				layer2: "0xlayer2",
			}),
		);

		const mainnetAddresses = getContractAddress(1);

		act(() => {
			result.current.execute(["0xcandidate", "1000"]);
		});

		expect(mockWriteContract).toHaveBeenCalledWith(
			expect.objectContaining({
				address: mainnetAddresses.DepositManager_ADDRESS,
				functionName: "requestWithdrawal",
			}),
		);
	});

	it("resolves WTON_ADDRESS correctly", () => {
		const { result } = renderHook(() =>
			useTxAction({
				contractKey: "WTON_ADDRESS",
				abi: MOCK_ABI,
				functionName: "approveAndCall",
				layer2: "0xlayer2",
			}),
		);

		const mainnetAddresses = getContractAddress(1);

		act(() => {
			result.current.execute(["0xdepositManager", "500"]);
		});

		expect(mockWriteContract).toHaveBeenCalledWith(
			expect.objectContaining({
				address: mainnetAddresses.WTON_ADDRESS,
				functionName: "approveAndCall",
			}),
		);
	});
});
