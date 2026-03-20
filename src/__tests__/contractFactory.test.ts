import { describe, it, expect, beforeEach } from "vitest";
import { clearCaches } from "@/hooks/staking/operators/contractFactory";

describe("contractFactory", () => {
	beforeEach(() => {
		clearCaches();
	});

	it("clearCaches should not throw", () => {
		expect(() => clearCaches()).not.toThrow();
	});
});
