import { describe, it, expect } from "vitest";
import { getContractAddress, getRpcUrl } from "@/constant/contracts";

describe("getContractAddress", () => {
	it("should return mainnet addresses for chainId 1", () => {
		const addresses = getContractAddress(1);
		expect(addresses.TON_ADDRESS).toBe(
			"0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
		);
		expect(addresses.WTON_ADDRESS).toBe(
			"0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2",
		);
		expect(addresses.DepositManager_ADDRESS).toBeTruthy();
		expect(addresses.SeigManager_ADDRESS).toBeTruthy();
	});

	it("should return sepolia addresses for chainId 11155111", () => {
		const addresses = getContractAddress(11155111);
		expect(addresses.TON_ADDRESS).toBe(
			"0xa30fe40285b8f5c0457dbc3b7c8a280373c40044",
		);
		expect(addresses.WTON_ADDRESS).toBe(
			"0x79e0d92670106c85e9067b56b8f674340dca0bbd",
		);
	});

	it("should throw for unsupported chainId", () => {
		expect(() => getContractAddress(42)).toThrow("Unsupported network");
	});
});

describe("getRpcUrl", () => {
	it("should return mainnet RPC URL for chainId 1", () => {
		const url = getRpcUrl(1);
		expect(typeof url).toBe("string");
		expect(url.length).toBeGreaterThan(0);
	});

	it("should return sepolia RPC URL for chainId 11155111", () => {
		const url = getRpcUrl(11155111);
		expect(typeof url).toBe("string");
		expect(url.length).toBeGreaterThan(0);
	});

	it("should throw for unsupported chainId", () => {
		expect(() => getRpcUrl(42)).toThrow("Unsupported network");
	});
});
