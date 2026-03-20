import { describe, it, expect } from "vitest";
import {
	marshalString,
	unmarshalString,
} from "@/utils/format/marshalString";

describe("marshalString", () => {
	it('should return the same string if it already has "0x" prefix', () => {
		expect(marshalString("0xabc123")).toBe("0xabc123");
	});

	it('should add "0x" prefix if not present', () => {
		expect(marshalString("abc123")).toBe("0xabc123");
	});

	it('should handle empty string by prepending "0x"', () => {
		expect(marshalString("")).toBe("0x");
	});

	it('should return "0x" as-is when input is exactly "0x"', () => {
		expect(marshalString("0x")).toBe("0x");
	});

	it('should not double-prefix a string starting with "0x"', () => {
		expect(marshalString("0x0x")).toBe("0x0x");
	});

	it("should handle uppercase hex characters", () => {
		expect(marshalString("ABC")).toBe("0xABC");
	});

	it("should handle long hex strings", () => {
		const longHex = "a".repeat(64);
		expect(marshalString(longHex)).toBe("0x" + longHex);
	});
});

describe("unmarshalString", () => {
	it('should remove "0x" prefix', () => {
		expect(unmarshalString("0xabc123")).toBe("abc123");
	});

	it('should return string unchanged if no "0x" prefix', () => {
		expect(unmarshalString("abc123")).toBe("abc123");
	});

	it('should return empty string when input is exactly "0x"', () => {
		expect(unmarshalString("0x")).toBe("");
	});

	it("should return empty string unchanged", () => {
		expect(unmarshalString("")).toBe("");
	});

	it('should only remove leading "0x", not internal occurrences', () => {
		expect(unmarshalString("0xabc0xdef")).toBe("abc0xdef");
	});

	it('should handle "0x0x" by removing only the first prefix', () => {
		expect(unmarshalString("0x0x")).toBe("0x");
	});
});
