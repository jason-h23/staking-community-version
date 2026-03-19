import { describe, it, expect } from "vitest";
import { compareTotalStaked } from "@/hooks/staking/operators/sort";
import type { Operator } from "@/hooks/staking/operators/types";

const makeOperator = (totalStaked: string): Operator => ({
	name: "test",
	address: "0x123",
	totalStaked,
	yourStaked: "0",
	isL2: false,
});

describe("compareTotalStaked", () => {
	it("should sort descending by default — larger first", () => {
		const a = makeOperator("1000000000000000000000000000"); // 1 RAY
		const b = makeOperator("2000000000000000000000000000"); // 2 RAY
		expect(compareTotalStaked(a, b, "desc")).toBe(1);
		expect(compareTotalStaked(b, a, "desc")).toBe(-1);
	});

	it("should sort ascending — smaller first", () => {
		const a = makeOperator("1000000000000000000000000000");
		const b = makeOperator("2000000000000000000000000000");
		expect(compareTotalStaked(a, b, "asc")).toBe(-1);
		expect(compareTotalStaked(b, a, "asc")).toBe(1);
	});

	it("should return 0 for equal values", () => {
		const a = makeOperator("1000000000000000000000000000");
		const b = makeOperator("1000000000000000000000000000");
		expect(compareTotalStaked(a, b, "desc")).toBe(0);
	});

	it("should handle zero values", () => {
		const a = makeOperator("0");
		const b = makeOperator("1000000000000000000000000000");
		expect(compareTotalStaked(a, b, "desc")).toBe(1);
		expect(compareTotalStaked(a, b, "asc")).toBe(-1);
	});

	it("should handle missing totalStaked gracefully", () => {
		const a = makeOperator("");
		const b = makeOperator("1000000000000000000000000000");
		// Empty string → BigNumber.from("") throws, falls back to Number comparison
		const result = compareTotalStaked(a, b, "desc");
		expect(typeof result).toBe("number");
	});

	it("should handle very large numbers (BigNumber path)", () => {
		const a = makeOperator("999999999999999999999999999999");
		const b = makeOperator("1000000000000000000000000000000");
		expect(compareTotalStaked(a, b, "desc")).toBe(1);
		expect(compareTotalStaked(a, b, "asc")).toBe(-1);
	});
});
