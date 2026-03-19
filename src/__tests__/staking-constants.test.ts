import { describe, it, expect } from "vitest";
import {
	WITHDRAWAL_DELAY_BLOCKS,
	TON_DECIMALS,
	WTON_DECIMALS,
	COMMISSION_RATE_DECIMALS,
} from "@/constant/staking";

describe("staking constants", () => {
	it("WITHDRAWAL_DELAY_BLOCKS should be 93046", () => {
		expect(WITHDRAWAL_DELAY_BLOCKS).toBe(93_046);
	});

	it("TON_DECIMALS should be 18", () => {
		expect(TON_DECIMALS).toBe(18);
	});

	it("WTON_DECIMALS should be 27", () => {
		expect(WTON_DECIMALS).toBe(27);
	});

	it("COMMISSION_RATE_DECIMALS should be 25", () => {
		expect(COMMISSION_RATE_DECIMALS).toBe(25);
	});
});
