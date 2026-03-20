import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "../helpers/test-wrapper";
import { createMockOperator, createMockOperatorList, MOCK_OPERATORS } from "../helpers/mocks/mockOperators";
import Candidates from "@/app/Staking/Candidates";

// Mock useCallOperators
const mockUseCallOperators = vi.fn();
vi.mock("@/hooks/staking/useCallOperators", () => ({
	default: () => mockUseCallOperators(),
}));

// Mock SDK react kit
vi.mock("@tokamak-ecosystem/staking-sdk-react-kit", () => ({
	useAllCandidates: () => ({ candidates: [], isLoading: false }),
}));

function renderCandidates() {
	return render(
		<TestWrapper>
			<Candidates />
		</TestWrapper>,
	);
}

describe("Candidates", () => {
	beforeEach(() => {
		mockUseCallOperators.mockReset();
	});

	it("shows loading spinner when loading is true", () => {
		mockUseCallOperators.mockReturnValue({
			operatorsList: [],
			loading: true,
			l2DetailsLoading: false,
			refreshOperator: vi.fn(),
			refreshAllOperators: vi.fn(),
			sortOperators: vi.fn(),
			totalStaked: "0",
		});

		renderCandidates();

		// The loading spinner uses animate-spin class
		const spinner = document.querySelector(".animate-spin");
		expect(spinner).toBeInTheDocument();
	});

	it("renders operator items when data is loaded", () => {
		const operators = [MOCK_OPERATORS.basic, MOCK_OPERATORS.l2, MOCK_OPERATORS.withStake];
		mockUseCallOperators.mockReturnValue({
			operatorsList: operators,
			loading: false,
			l2DetailsLoading: false,
			refreshOperator: vi.fn(),
			refreshAllOperators: vi.fn(),
			sortOperators: vi.fn(),
			totalStaked: "0",
		});

		renderCandidates();

		// Operators should be rendered (may be repeated due to < 20 logic)
		expect(screen.getAllByText("TestOperator").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("L2Operator").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("StakedOperator").length).toBeGreaterThanOrEqual(1);
	});

	it("repeats operators to fill at least 20 items when less than 20", () => {
		const operators = [MOCK_OPERATORS.basic, MOCK_OPERATORS.l2];
		mockUseCallOperators.mockReturnValue({
			operatorsList: operators,
			loading: false,
			l2DetailsLoading: false,
			refreshOperator: vi.fn(),
			refreshAllOperators: vi.fn(),
			sortOperators: vi.fn(),
			totalStaked: "0",
		});

		renderCandidates();

		// With 2 operators and minItems=20, base fills to 20 then triples to 60
		// Each original name should appear multiple times
		const basicItems = screen.getAllByText("TestOperator");
		expect(basicItems.length).toBeGreaterThan(2);
	});

	it("does not repeat operators when 20 or more are provided", () => {
		// Create 25 operators with valid BigNumber string totalStaked values
		const operators = Array.from({ length: 25 }, (_, i) =>
			createMockOperator({
				name: `Operator-${i + 1}`,
				address: `0x${String(i + 1).padStart(40, "0")}`,
				totalStaked: `${(25 - i)}${"0".repeat(27)}`, // e.g. "25" + 27 zeros
			}),
		);
		mockUseCallOperators.mockReturnValue({
			operatorsList: operators,
			loading: false,
			l2DetailsLoading: false,
			refreshOperator: vi.fn(),
			refreshAllOperators: vi.fn(),
			sortOperators: vi.fn(),
			totalStaked: "0",
		});

		renderCandidates();

		// Operator-1 should appear exactly once (no repetition because >= 20)
		// With >= 20, repeatedOperators = filteredOperators (same reference)
		const op1Items = screen.getAllByText("Operator-1");
		expect(op1Items.length).toBe(1);
	});

	it("handles empty operator list", () => {
		mockUseCallOperators.mockReturnValue({
			operatorsList: [],
			loading: false,
			l2DetailsLoading: false,
			refreshOperator: vi.fn(),
			refreshAllOperators: vi.fn(),
			sortOperators: vi.fn(),
			totalStaked: "0",
		});

		renderCandidates();

		// Should render without errors, no operator names visible
		expect(screen.queryByText("TestOperator")).not.toBeInTheDocument();
		// No spinner either (not loading)
		const spinners = document.querySelectorAll(".animate-spin");
		// There might be no spinner, or there's just the container
		expect(spinners.length).toBe(0);
	});
});
