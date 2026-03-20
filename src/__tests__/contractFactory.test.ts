import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PublicClient } from "viem";

// Mock viem before importing the module under test
vi.mock("viem", async () => {
	const actual = await vi.importActual<typeof import("viem")>("viem");
	return {
		...actual,
		getContract: vi.fn(),
		isAddress: vi.fn(),
	};
});

import {
	createContractInstance,
	checkContractExists,
	clearCaches,
} from "@/hooks/staking/operators/contractFactory";
import { getContract, isAddress } from "viem";

const mockGetContract = vi.mocked(getContract);
const mockIsAddress = vi.mocked(isAddress);

function createMockPublicClient(
	overrides: Partial<PublicClient> = {},
): PublicClient {
	return {
		getBytecode: vi.fn(),
		...overrides,
	} as unknown as PublicClient;
}

describe("contractFactory", () => {
	beforeEach(() => {
		clearCaches();
		vi.clearAllMocks();
	});

	// ─── createContractInstance ───────────────────────────────────

	describe("createContractInstance", () => {
		it("should return null when publicClient is null", () => {
			const result = createContractInstance(
				null as unknown as PublicClient,
				"0x1234",
				[],
			);
			expect(result).toBeNull();
		});

		it("should return null when publicClient is undefined", () => {
			const result = createContractInstance(
				undefined as unknown as PublicClient,
				"0x1234",
				[],
			);
			expect(result).toBeNull();
		});

		it("should return null when contractAddress is empty string", () => {
			const client = createMockPublicClient();
			const result = createContractInstance(client, "", []);
			expect(result).toBeNull();
		});

		it("should create a contract instance with a plain ABI array", () => {
			const fakeContract = { read: vi.fn(), write: vi.fn() };
			mockGetContract.mockReturnValue(fakeContract as any);

			const client = createMockPublicClient();
			const abi = [{ type: "function", name: "stake" }];
			const result = createContractInstance(client, "0xABC", abi);

			expect(result).toBe(fakeContract);
			expect(mockGetContract).toHaveBeenCalledWith({
				address: "0xABC",
				abi,
				client,
			});
		});

		it("should create a contract instance with {abi, contractName} format", () => {
			const fakeContract = { read: vi.fn() };
			mockGetContract.mockReturnValue(fakeContract as any);

			const client = createMockPublicClient();
			const abiObj = {
				contractName: "DepositManager",
				abi: [{ type: "function", name: "deposit" }],
			};
			const result = createContractInstance(client, "0xDEF", abiObj);

			expect(result).toBe(fakeContract);
			expect(mockGetContract).toHaveBeenCalledWith({
				address: "0xDEF",
				abi: abiObj.abi,
				client,
			});
		});

		it("should return cached instance on second call with same key", () => {
			const fakeContract = { read: vi.fn() };
			mockGetContract.mockReturnValue(fakeContract as any);

			const client = createMockPublicClient();
			const abi = [{ type: "function", name: "stake" }];

			const first = createContractInstance(client, "0xAAA", abi);
			const second = createContractInstance(client, "0xAAA", abi);

			expect(first).toBe(second);
			expect(mockGetContract).toHaveBeenCalledTimes(1);
		});

		it("should use contractName in cache key when available", () => {
			const fakeContract1 = { id: 1 };
			const fakeContract2 = { id: 2 };
			mockGetContract
				.mockReturnValueOnce(fakeContract1 as any)
				.mockReturnValueOnce(fakeContract2 as any);

			const client = createMockPublicClient();
			const abi1 = {
				contractName: "ContractA",
				abi: [{ type: "function", name: "a" }],
			};
			const abi2 = {
				contractName: "ContractB",
				abi: [{ type: "function", name: "b" }],
			};

			const result1 = createContractInstance(client, "0xSAME", abi1);
			const result2 = createContractInstance(client, "0xSAME", abi2);

			expect(result1).not.toBe(result2);
			expect(mockGetContract).toHaveBeenCalledTimes(2);
		});

		it("should use 'unknown' in cache key when contractName is absent", () => {
			const fakeContract = { read: vi.fn() };
			mockGetContract.mockReturnValue(fakeContract as any);

			const client = createMockPublicClient();
			const abi = [{ type: "function", name: "x" }];

			createContractInstance(client, "0xBBB", abi);
			const second = createContractInstance(client, "0xBBB", abi);

			expect(second).toBe(fakeContract);
			expect(mockGetContract).toHaveBeenCalledTimes(1);
		});

		it("should return null when getContract throws", () => {
			mockGetContract.mockImplementation(() => {
				throw new Error("Invalid ABI");
			});

			const client = createMockPublicClient();
			const result = createContractInstance(client, "0xCCC", []);

			expect(result).toBeNull();
		});
	});

	// ─── checkContractExists ─────────────────────────────────────

	describe("checkContractExists", () => {
		it("should return false when publicClient is null", async () => {
			const result = await checkContractExists(
				null as unknown as PublicClient,
				"0x1234567890abcdef1234567890abcdef12345678",
			);
			expect(result).toBe(false);
		});

		it("should return false when publicClient is undefined", async () => {
			const result = await checkContractExists(
				undefined as unknown as PublicClient,
				"0x1234567890abcdef1234567890abcdef12345678",
			);
			expect(result).toBe(false);
		});

		it("should return false when address is invalid", async () => {
			mockIsAddress.mockReturnValue(false);

			const client = createMockPublicClient();
			const result = await checkContractExists(client, "not-an-address");

			expect(result).toBe(false);
		});

		it("should return true when bytecode exists", async () => {
			mockIsAddress.mockReturnValue(true);
			const client = createMockPublicClient({
				getBytecode: vi.fn().mockResolvedValue("0x6080604052"),
			} as any);

			const result = await checkContractExists(client, "0xValidAddress");

			expect(result).toBe(true);
		});

		it("should return false when bytecode is null", async () => {
			mockIsAddress.mockReturnValue(true);
			const client = createMockPublicClient({
				getBytecode: vi.fn().mockResolvedValue(null),
			} as any);

			const result = await checkContractExists(client, "0xValidAddress");

			expect(result).toBe(false);
		});

		it("should return false when bytecode is undefined", async () => {
			mockIsAddress.mockReturnValue(true);
			const client = createMockPublicClient({
				getBytecode: vi.fn().mockResolvedValue(undefined),
			} as any);

			const result = await checkContractExists(client, "0xValidAddress");

			expect(result).toBe(false);
		});

		it("should return false when bytecode is '0x'", async () => {
			mockIsAddress.mockReturnValue(true);
			const client = createMockPublicClient({
				getBytecode: vi.fn().mockResolvedValue("0x"),
			} as any);

			const result = await checkContractExists(client, "0xValidAddress");

			expect(result).toBe(false);
		});

		it("should cache result and not call getBytecode again", async () => {
			mockIsAddress.mockReturnValue(true);
			const getBytecode = vi.fn().mockResolvedValue("0x6080604052");
			const client = createMockPublicClient({
				getBytecode,
			} as any);

			const first = await checkContractExists(client, "0xCachedAddr");
			const second = await checkContractExists(client, "0xCachedAddr");

			expect(first).toBe(true);
			expect(second).toBe(true);
			expect(getBytecode).toHaveBeenCalledTimes(1);
		});

		it("should cache false results too", async () => {
			mockIsAddress.mockReturnValue(true);
			const getBytecode = vi.fn().mockResolvedValue(null);
			const client = createMockPublicClient({
				getBytecode,
			} as any);

			const first = await checkContractExists(client, "0xNoCode");
			const second = await checkContractExists(client, "0xNoCode");

			expect(first).toBe(false);
			expect(second).toBe(false);
			expect(getBytecode).toHaveBeenCalledTimes(1);
		});

		it("should return false when getBytecode throws", async () => {
			mockIsAddress.mockReturnValue(true);
			const client = createMockPublicClient({
				getBytecode: vi.fn().mockRejectedValue(new Error("RPC error")),
			} as any);

			const result = await checkContractExists(client, "0xErrorAddr");

			expect(result).toBe(false);
		});
	});

	// ─── clearCaches ─────────────────────────────────────────────

	describe("clearCaches", () => {
		it("should not throw when called on empty caches", () => {
			expect(() => clearCaches()).not.toThrow();
		});

		it("should clear contract instance cache", () => {
			const fakeContract = { read: vi.fn() };
			mockGetContract.mockReturnValue(fakeContract as any);

			const client = createMockPublicClient();
			createContractInstance(client, "0xFFF", []);

			clearCaches();

			// After clearing, getContract should be called again
			const newContract = { read: vi.fn() };
			mockGetContract.mockReturnValue(newContract as any);
			const result = createContractInstance(client, "0xFFF", []);

			expect(result).toBe(newContract);
			expect(mockGetContract).toHaveBeenCalledTimes(2);
		});

		it("should clear contract exists cache", async () => {
			mockIsAddress.mockReturnValue(true);
			const getBytecode = vi.fn().mockResolvedValue("0x6080");
			const client = createMockPublicClient({ getBytecode } as any);

			await checkContractExists(client, "0xClearMe");

			clearCaches();

			await checkContractExists(client, "0xClearMe");

			expect(getBytecode).toHaveBeenCalledTimes(2);
		});
	});
});
