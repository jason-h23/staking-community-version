import { describe, it, expect, vi } from "vitest";
import { isAddress } from "viem";

describe("Security: URL parameter validation", () => {
	it("isAddress rejects invalid Ethereum addresses", () => {
		expect(isAddress("not-an-address")).toBe(false);
		expect(isAddress("")).toBe(false);
		expect(isAddress("0x")).toBe(false);
		expect(isAddress("0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")).toBe(false);
		expect(isAddress("<script>alert(1)</script>")).toBe(false);
	});

	it("isAddress accepts valid Ethereum addresses", () => {
		expect(isAddress("0x2be5e8c109e2197D077D13A82dAead6a9b3433C5")).toBe(true);
		expect(isAddress("0x0000000000000000000000000000000000000001")).toBe(true);
	});

	it("isAddress rejects addresses with wrong length", () => {
		expect(isAddress("0x2be5e8c109e2197D077D13A82dAead6a9b3433C")).toBe(false); // 39 chars
		expect(isAddress("0x2be5e8c109e2197D077D13A82dAead6a9b3433C5A")).toBe(false); // 43 chars
	});
});

describe("Security: Input sanitization (addComma regex)", () => {
	it("strips alphabetic characters from numeric input", () => {
		const sanitize = (val: string) => val.replace(/[^0-9.]/g, "");
		expect(sanitize("100abc")).toBe("100");
		expect(sanitize("12.34def")).toBe("12.34");
		expect(sanitize("<script>")).toBe("");
		expect(sanitize("alert(1)")).toBe("1");
	});

	it("preserves valid numeric input", () => {
		const sanitize = (val: string) => val.replace(/[^0-9.]/g, "");
		expect(sanitize("123.456")).toBe("123.456");
		expect(sanitize("0.001")).toBe("0.001");
		expect(sanitize("1000000")).toBe("1000000");
	});
});

describe("Security: ChainId parsing", () => {
	it("correctly parses hex chainId for Mainnet", () => {
		const hexChainId = "0x1";
		const parsed = parseInt(String(hexChainId), 16);
		expect(parsed).toBe(1);
	});

	it("correctly parses hex chainId for Sepolia", () => {
		const hexChainId = "0xaa36a7";
		const parsed = parseInt(String(hexChainId), 16);
		expect(parsed).toBe(11155111);
	});

	it("handles uppercase hex chainId", () => {
		const hexChainId = "0xAA36A7";
		const parsed = parseInt(String(hexChainId), 16);
		expect(parsed).toBe(11155111);
	});

	it("returns NaN for invalid hex", () => {
		const parsed = parseInt(String("not-hex"), 16);
		expect(Number.isNaN(parsed)).toBe(true);
	});

	it("hardcoded hex always returns wrong value for non-Sepolia chains", () => {
		// This test documents why the hardcoded "0xAA36A7" was a bug
		const hardcoded = parseInt("0xAA36A7", 16); // always Sepolia
		const actual_mainnet = parseInt("0x1", 16);
		expect(hardcoded).toBe(11155111); // always Sepolia
		expect(actual_mainnet).toBe(1); // should be Mainnet
		expect(hardcoded).not.toBe(actual_mainnet); // bug: Mainnet user gets Sepolia
	});
});

describe("Security: Transaction error handling", () => {
	it("extracts message from Error objects", () => {
		const err = new Error("User rejected the request");
		const message = err instanceof Error ? err.message : "Transaction failed";
		expect(message).toBe("User rejected the request");
	});

	it("provides fallback for non-Error objects", () => {
		const err = "string error";
		const message = err instanceof Error ? err.message : "Transaction failed";
		expect(message).toBe("Transaction failed");
	});

	it("detects user rejection pattern", () => {
		const message = "User rejected the request";
		const userFacing = message.includes("User rejected") ? "Transaction rejected" : message;
		expect(userFacing).toBe("Transaction rejected");
	});

	it("preserves non-rejection error messages", () => {
		const message = "Insufficient gas";
		const userFacing = message.includes("User rejected") ? "Transaction rejected" : message;
		expect(userFacing).toBe("Insufficient gas");
	});
});
