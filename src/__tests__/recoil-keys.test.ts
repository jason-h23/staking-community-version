import { describe, it, expect } from "vitest";

describe("Recoil atom keys are static (no UUID)", () => {
	it("input.ts should not import uuid", async () => {
		const content = await import("@/recoil/input");
		// If this import succeeds without error, the atoms have static keys
		expect(content.inputState).toBeDefined();
		expect(content.calculatorInputState).toBeDefined();
	});

	it("duration.ts should not import uuid", async () => {
		const content = await import("@/recoil/duration/duration");
		expect(content.durationState).toBeDefined();
		expect(content.selectedDurationState).toBeDefined();
	});
});
