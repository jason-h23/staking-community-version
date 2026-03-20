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
});
