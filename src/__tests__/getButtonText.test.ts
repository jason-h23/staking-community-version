import { describe, it, expect } from "vitest";
import { getButtonText } from "@/utils/button/getButtonText";

describe("getButtonText", () => {
	it('returns "Enter an amount" for empty value', () => {
		expect(getButtonText("", "Stake")).toBe("Enter an amount");
	});

	it('returns "Enter an amount" for "0.00"', () => {
		expect(getButtonText("0.00", "Stake")).toBe("Enter an amount");
	});

	it('returns "Enter an amount" for "0"', () => {
		expect(getButtonText("0", "Unstake")).toBe("Enter an amount");
	});

	it('returns "Stake" for Stake action', () => {
		expect(getButtonText("100", "Stake")).toBe("Stake");
	});

	it('returns "Unstake" for Unstake action', () => {
		expect(getButtonText("50", "Unstake")).toBe("Unstake");
	});

	it('returns "Withdraw" for Withdraw action', () => {
		expect(getButtonText("10", "Withdraw")).toBe("Withdraw");
	});

	it('returns "Withdraw" for WithdrawL1 action', () => {
		expect(getButtonText("10", "WithdrawL1")).toBe("Withdraw");
	});

	it('returns "Withdraw to L2" for WithdrawL2 action', () => {
		expect(getButtonText("10", "WithdrawL2")).toBe("Withdraw to L2");
	});

	it('returns "Restake" for Restake action', () => {
		expect(getButtonText("25", "Restake")).toBe("Restake");
	});

	it('returns "Submit" for unknown action', () => {
		expect(getButtonText("100", "SomeUnknownAction")).toBe("Submit");
	});
});
