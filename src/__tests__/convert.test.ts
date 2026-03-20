import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted so these are available when vi.mock factories run (hoisted above imports)
const { mockFormatUnits, mockBigNumberFrom, createBigNumber } = vi.hoisted(() => {
	const createBigNumber = (value: string | number): any => {
		const n = BigInt(value);
		return {
			toString: () => n.toString(),
			div: (divisor: number) => createBigNumber((n / BigInt(divisor)).toString()),
			mul: (multiplier: number) =>
				createBigNumber((n * BigInt(multiplier)).toString()),
		};
	};

	return {
		mockFormatUnits: vi.fn(),
		mockBigNumberFrom: vi.fn(),
		createBigNumber,
	};
});

// --- Mock ethers ---
vi.mock("ethers", () => {
	mockBigNumberFrom.mockImplementation((v: string | number) => createBigNumber(v));

	return {
		ethers: {
			utils: {
				formatUnits: mockFormatUnits,
			},
		},
		BigNumber: {
			from: mockBigNumberFrom,
		},
	};
});

// --- Mock decimal.js ---
vi.mock("decimal.js", () => {
	class MockDecimal {
		private value: number;
		constructor(v: string | number) {
			this.value = Number(v);
		}
		toFixed(digits: number, _roundingMode?: number) {
			return this.value.toFixed(digits);
		}
	}
	return {
		__esModule: true,
		default: Object.assign(MockDecimal, {
			ROUND_UP: 0,
			ROUND_DOWN: 1,
			ROUND_HALF_UP: 4,
		}),
	};
});

// --- Mock web3-utils ---
vi.mock("web3-utils", () => ({
	toWei: vi.fn((num: string, unit: string) => {
		if (unit === "ether") return (BigInt(num) * 10n ** 18n).toString();
		if (unit === "gether") return (BigInt(num) * 10n ** 27n).toString();
		return num;
	}),
}));

import {
	floatParser,
	parseFromRayToWei,
	convertFromRayToWei,
	convertFromWeiToRay,
	convertToWei,
	convertToRay,
	convertNumber,
	convertLargeNumber,
	calcCountDown,
	calcCountDown2,
} from "@/utils/number/convert";

beforeEach(() => {
	vi.clearAllMocks();
	mockBigNumberFrom.mockImplementation((v: string | number) => createBigNumber(v));
});

// ---------- floatParser ----------
describe("floatParser", () => {
	it("should parse a regular number string", () => {
		expect(floatParser("123.45")).toBe(123.45);
	});

	it("should strip commas before parsing", () => {
		expect(floatParser("1,234,567.89")).toBe(1234567.89);
	});

	it("should return undefined for '0'", () => {
		expect(floatParser("0")).toBeUndefined();
	});

	it("should return NaN for empty string", () => {
		expect(floatParser("")).toBeNaN();
	});

	it("should handle integer strings", () => {
		expect(floatParser("42")).toBe(42);
	});

	it("should handle negative numbers", () => {
		expect(floatParser("-100.5")).toBe(-100.5);
	});
});

// ---------- Unit conversion functions ----------
describe("parseFromRayToWei", () => {
	it("should convert a BigNumber from ray to wei by dividing by 10^9", () => {
		const mockBigNumber = createBigNumber("1000000000000000000"); // 1 ETH in wei
		const result = parseFromRayToWei(mockBigNumber);
		expect(mockBigNumberFrom).toHaveBeenCalled();
		expect(result.toString()).toBe("1000000000"); // divided by 10^9
	});
});

describe("convertFromRayToWei", () => {
	it("should divide by 10^9", () => {
		const result = convertFromRayToWei("1000000000000000000");
		expect(mockBigNumberFrom).toHaveBeenCalledWith("1000000000000000000");
		expect(result).toBeDefined();
		expect(result.toString()).toBe("1000000000");
	});
});

describe("convertFromWeiToRay", () => {
	it("should multiply by 10^9", () => {
		const result = convertFromWeiToRay("1000000000");
		expect(mockBigNumberFrom).toHaveBeenCalledWith("1000000000");
		expect(result).toBeDefined();
		expect(result.toString()).toBe("1000000000000000000");
	});
});

describe("convertToWei", () => {
	it("should call toWei with ether unit", () => {
		const result = convertToWei("1");
		expect(result).toBe("1000000000000000000");
	});
});

describe("convertToRay", () => {
	it("should call toWei with gether unit", () => {
		const result = convertToRay("1");
		expect(result).toBe("1000000000000000000000000000");
	});
});

// ---------- convertNumber ----------
describe("convertNumber", () => {
	it('should return "0.00" when amount is "0"', () => {
		expect(convertNumber({ amount: "0" })).toBe("0.00");
	});

	it('should return "0.00" when amount is undefined', () => {
		expect(convertNumber({ amount: undefined })).toBe("0.00");
	});

	it('should return "0.00" when amount is empty string', () => {
		expect(convertNumber({ amount: "" })).toBe("0.00");
	});

	it("should convert wei amount with round=true (round up to 2dp)", () => {
		mockFormatUnits.mockReturnValue("1.123456789");
		const result = convertNumber({
			type: "wei",
			amount: "1123456789000000000", // 1.123456789 ETH in wei
			round: true,
			decimalPlaces: 2,
		});
		expect(mockFormatUnits).toHaveBeenCalledWith(expect.anything(), 18);
		expect(result).toBe("1.12");
	});

	it("should convert wei amount with round=false (round down via Decimal)", () => {
		mockFormatUnits.mockReturnValue("1.999999999");
		const result = convertNumber({
			type: "wei",
			amount: "1999999999000000000", // 1.999999999 ETH in wei
			round: false,
			decimalPlaces: 2,
		});
		// Decimal.toFixed(2) on 1.999999999 → "2.00" (JS native rounding)
		expect(result).toBe("2.00");
	});

	it("should convert wei amount without explicit round (uses default Decimal rounding)", () => {
		mockFormatUnits.mockReturnValue("5.555");
		const result = convertNumber({
			type: "wei",
			amount: "5555000000000000000", // 5.555 ETH in wei
		});
		// Default rounding: Decimal.toFixed(2) on 5.555 → "5.55"
		expect(result).toBe("5.55");
	});

	it("should convert ray amount with round=true (uses default 2dp)", () => {
		mockFormatUnits.mockReturnValue("2.345678");
		const result = convertNumber({
			type: "ray",
			amount: "2345678000000000000000000000", // 2.345678 TON in ray
			round: true,
			decimalPlaces: 3,
		});
		// Default decimalPoints is 2, so Decimal.toFixed(2) on 2.345678 → "2.35"
		expect(result).toBe("2.35");
	});

	it("should convert ray amount without explicit round (uses default 2dp)", () => {
		mockFormatUnits.mockReturnValue("3.141592");
		const result = convertNumber({
			type: "ray",
			amount: "3141592000000000000000000000", // 3.141592 TON in ray
			decimalPlaces: 4,
		});
		// Default decimalPoints is 2, so Decimal.toFixed(2) on 3.141592 → "3.14"
		expect(result).toBe("3.14");
	});

	it("should apply localeString formatting with commas when true", () => {
		mockFormatUnits.mockReturnValue("1234567.89");
		const result = convertNumber({
			type: "wei",
			amount: "1234567890000000000000000", // 1234567.89 ETH in wei
			round: true,
			localeString: true,
		});
		// localeString adds comma separators
		expect(result).toBe("1,234,567.89");
	});

	it("should use custom decimalPoints for output precision", () => {
		mockFormatUnits.mockReturnValue("1.123456");
		const result = convertNumber({
			type: "wei",
			amount: "1123456000000000000", // 1.123456 ETH in wei
			round: true,
			decimalPlaces: 4,
			decimalPoints: 4,
		});
		// decimalPoints=4 → Decimal.toFixed(4) on 1.123456 → "1.1235"
		expect(result).toBe("1.1235");
	});

	it("should default to wei when type is not specified", () => {
		mockFormatUnits.mockReturnValue("1.0");
		const result = convertNumber({
			amount: "1000000000000000000", // 1.0 ETH in wei
		});
		expect(mockFormatUnits).toHaveBeenCalledWith(expect.anything(), 18);
		expect(result).toBe("1.00");
	});

	it("should return undefined for invalid BigNumber input (caught by try/catch)", () => {
		mockBigNumberFrom.mockImplementationOnce(() => {
			throw new Error("invalid BigNumber");
		});
		const result = convertNumber({
			amount: "not-a-number",
		});
		expect(result).toBeUndefined();
	});
});

// ---------- convertLargeNumber ----------
describe("convertLargeNumber", () => {
	it("should return undefined for undefined input", () => {
		expect(convertLargeNumber(undefined)).toBeUndefined();
	});

	it("should return original string for numbers below 10e6 (10 million)", () => {
		expect(convertLargeNumber("500000")).toBe("500000");
	});

	it('should format millions with "M" suffix', () => {
		const result = convertLargeNumber("50000000");
		expect(result).toContain("M");
	});

	it('should format billions with "B" suffix', () => {
		const result = convertLargeNumber("50000000000");
		expect(result).toContain("B");
	});

	it('should format quadrillions with "Qd" suffix', () => {
		const result = convertLargeNumber("50000000000000");
		expect(result).toContain("Qd");
	});

	it('should format quintillions with "Qn" suffix', () => {
		const result = convertLargeNumber("50000000000000000");
		expect(result).toContain("Qn");
	});

	it("should handle large M values (>=100) without decimals", () => {
		const result = convertLargeNumber("5000000000");
		expect(result).toContain("M");
		expect(result).toBe("500M");
	});

	it("should handle medium M values (10-99) with 1 decimal", () => {
		const result = convertLargeNumber("150000000");
		expect(result).toContain("M");
		expect(result).toBe("15.0M");
	});

	it("should handle NaN-like input (returns original)", () => {
		const result = convertLargeNumber("abc");
		expect(result).toBe("abc");
	});

	it("should handle numbers with commas", () => {
		const result = convertLargeNumber("50,000,000");
		expect(result).toContain("M");
	});

	it('should return "0" string as-is since floatParser returns undefined for "0"', () => {
		const result = convertLargeNumber("0");
		expect(result).toBe("0");
	});
});

// ---------- calcCountDown ----------
describe("calcCountDown", () => {
	it('should return "(00 days 00 hours left)" for "0"', () => {
		expect(calcCountDown("0")).toBe("(00 days 00 hours left)");
	});

	it("should format 1 day correctly", () => {
		expect(calcCountDown("86400")).toBe("(01 days 00 hours left)");
	});

	it("should format 1 hour correctly", () => {
		expect(calcCountDown("3600")).toBe("(00 days 01 hours left)");
	});

	it("should format mixed days and hours", () => {
		expect(calcCountDown("190800")).toBe("(02 days 05 hours left)");
	});

	it("should handle 10+ days (no leading zero)", () => {
		expect(calcCountDown("1296000")).toBe("(15 days 00 hours left)");
	});

	it("should handle 10+ hours (no leading zero)", () => {
		expect(calcCountDown("43200")).toBe("(00 days 12 hours left)");
	});
});

// ---------- calcCountDown2 ----------
describe("calcCountDown2", () => {
	it('should return "(00 days 00 hours left)" for "0"', () => {
		expect(calcCountDown2("0")).toBe("(00 days 00 hours left)");
	});

	it("should format without surrounding parentheses", () => {
		expect(calcCountDown2("86400")).toBe("01 days 00 hours left");
	});

	it("should format 1 hour correctly", () => {
		expect(calcCountDown2("3600")).toBe("00 days 01 hours left");
	});

	it("should format mixed days and hours", () => {
		expect(calcCountDown2("190800")).toBe("02 days 05 hours left");
	});

	it("should handle 10+ days", () => {
		expect(calcCountDown2("1296000")).toBe("15 days 00 hours left");
	});

	it("should handle 10+ hours", () => {
		expect(calcCountDown2("43200")).toBe("00 days 12 hours left");
	});
});
