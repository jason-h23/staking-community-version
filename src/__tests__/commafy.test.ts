import { describe, it, expect } from "vitest";
import commafy, { commafyWithUndefined } from "@/utils/trim/commafy";

describe("commafy", () => {
	it("should format numbers with commas", () => {
		expect(commafy(1234567)).toBe("1,234,567.00");
	});

	it("should respect decimal places", () => {
		expect(commafy(1234.5678, 3)).toBe("1,234.567");
	});

	it("should handle zero", () => {
		expect(commafy(0)).toBe("0.00");
		expect(commafy("0")).toBe("0.00");
	});

	it("should return dash for null/undefined", () => {
		expect(commafy(null)).toBe("-");
		expect(commafy(undefined)).toBe("-");
	});

	it("should return dash for NaN", () => {
		expect(commafy("not-a-number")).toBe("-");
	});

	it("should handle string numbers", () => {
		expect(commafy("12345.678", 2)).toBe("12,345.67");
	});

	it("should support custom default value", () => {
		expect(commafy(null, 2, false, "N/A")).toBe("N/A");
	});

	it("should support removeComma option", () => {
		expect(commafy(1234567, 2, true)).toBe("1234567.00");
	});

	it("should handle zero decimal places", () => {
		expect(commafy(0, 0)).toBe("0");
	});

	it("should use custom defaultValue for undefined input", () => {
		expect(commafy(undefined, 2, false, "0.00")).toBe("0.00");
	});

	it("should use custom defaultValue for NaN input", () => {
		expect(commafy("xyz", 2, false, "invalid")).toBe("invalid");
	});

	it("should handle zero with 3 decimal places", () => {
		expect(commafy(0, 3)).toBe("0.000");
		expect(commafy("0", 3)).toBe("0.000");
	});

	it("should handle trailing dot (e.g. '12345.')", () => {
		// "12345." splits to ["12345", ""], str[1]==="" returns str[0]
		expect(commafy("12345.")).toBe("12,345");
	});

	it("should handle removeComma with decimal numbers", () => {
		expect(commafy("12345.678", 2, true)).toBe("12345.67");
	});

	it("should handle small numbers without commas", () => {
		expect(commafy(999)).toBe("999.00");
	});

	it("should handle numbers with exactly one decimal digit", () => {
		// str[1].length < 2 so it stays as-is, but then padding doesn't happen
		expect(commafy("100.5", 2)).toBe("100.5");
	});

	it("should handle very large numbers", () => {
		expect(commafy(1000000000, 2)).toBe("1,000,000,000.00");
	});

	it("should use default defaultValue '0' for zero with 0 decimal places", () => {
		expect(commafy(0, 0, false, "custom")).toBe("custom");
	});

	it("should format 4-digit numbers with comma separator", () => {
		expect(commafy(1234)).toBe("1,234.00");
	});
});

describe("commafyWithUndefined", () => {
	it("should return undefined when defaultValueIsUndefined is true and input is null", () => {
		expect(commafyWithUndefined(null, 2, false, true)).toBeUndefined();
		expect(commafyWithUndefined(undefined, 2, false, true)).toBeUndefined();
	});

	it("should return undefined for NaN when defaultValueIsUndefined is true", () => {
		expect(commafyWithUndefined("abc", 2, false, true)).toBeUndefined();
	});

	it("should return dash for null when defaultValueIsUndefined is false", () => {
		expect(commafyWithUndefined(null)).toBe("-");
	});

	it("should format numbers normally", () => {
		expect(commafyWithUndefined(1234, 2)).toBe("1,234.00");
	});

	it("should handle zero with default decimal point", () => {
		expect(commafyWithUndefined(0)).toBe("0.00");
		expect(commafyWithUndefined("0")).toBe("0.00");
	});

	it("should handle zero with 0 decimal places", () => {
		expect(commafyWithUndefined(0, 0)).toBe("0");
	});

	it("should handle zero with 3 decimal places", () => {
		expect(commafyWithUndefined(0, 3)).toBe("0.000");
	});

	it("should return dash for NaN when defaultValueIsUndefined is false", () => {
		expect(commafyWithUndefined("abc")).toBe("-");
	});

	it("should handle trailing dot", () => {
		expect(commafyWithUndefined("12345.")).toBe("12,345");
	});

	it("should support removeComma option", () => {
		expect(commafyWithUndefined(1234567, 2, true)).toBe("1234567.00");
	});

	it("should handle string numbers with decimals", () => {
		expect(commafyWithUndefined("9876.5432", 3)).toBe("9,876.543");
	});

	it("should handle small numbers without comma formatting", () => {
		expect(commafyWithUndefined(999, 2)).toBe("999.00");
	});

	it("should handle undefined input without defaultValueIsUndefined", () => {
		expect(commafyWithUndefined(undefined)).toBe("-");
	});
});
