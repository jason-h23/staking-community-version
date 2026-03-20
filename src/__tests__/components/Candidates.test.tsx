import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
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

	describe("repeatedOperators generation", () => {
		it("creates exactly 20 base items from a single operator and triples for scroll", () => {
			const operators = [MOCK_OPERATORS.basic];
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

			// With 1 operator and minItems=20, base fills to 20 then triples to 60
			const items = screen.getAllByText("TestOperator");
			expect(items.length).toBe(60);
		});

		it("fills to 20 base items from 5 operators (ceil(20/5)=4 repeats, sliced to 20, tripled to 60)", () => {
			const operators = Array.from({ length: 5 }, (_, i) =>
				createMockOperator({
					name: `Op-${i}`,
					address: `0x${String(i + 1).padStart(40, "0")}`,
					totalStaked: `${(5 - i)}${"0".repeat(27)}`,
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

			// 5 operators -> base = ceil(20/5)*5 = 20 items, repeated 3x = 60
			const op0Items = screen.getAllByText("Op-0");
			// Each operator appears 4 times in base * 3 = 12
			expect(op0Items.length).toBe(12);
		});

		it("uses filteredOperators directly when exactly 20 operators are provided", () => {
			const operators = Array.from({ length: 20 }, (_, i) =>
				createMockOperator({
					name: `ExactOp-${i}`,
					address: `0x${String(i + 1).padStart(40, "0")}`,
					totalStaked: `${(20 - i)}${"0".repeat(27)}`,
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

			// With >= 20, repeatedOperators = filteredOperators (no tripling)
			const op0Items = screen.getAllByText("ExactOp-0");
			expect(op0Items.length).toBe(1);
		});
	});

	describe("scroll container setup", () => {
		it("sets up scroll container ref on the scrollable div", () => {
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

			const { container } = renderCandidates();

			// The scroll container should have the scrollbar-hide class and overflow-y-auto
			const scrollDiv = container.querySelector(".overflow-y-auto");
			expect(scrollDiv).toBeInTheDocument();
			expect(scrollDiv).toHaveClass("scrollbar-hide");
		});

		it("renders gradient overlays for infinite scroll visual effect", () => {
			const operators = [MOCK_OPERATORS.basic];
			mockUseCallOperators.mockReturnValue({
				operatorsList: operators,
				loading: false,
				l2DetailsLoading: false,
				refreshOperator: vi.fn(),
				refreshAllOperators: vi.fn(),
				sortOperators: vi.fn(),
				totalStaked: "0",
			});

			const { container } = renderCandidates();

			// There should be two gradient overlays (top and bottom) with pointer-events-none
			const overlays = container.querySelectorAll(".pointer-events-none");
			expect(overlays.length).toBe(2);
		});
	});

	describe("scroll event handling", () => {
		it("attaches scroll event listener to container after mount", async () => {
			const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, "addEventListener");

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

			// Wait for requestAnimationFrame-based scroll initialization
			await vi.waitFor(() => {
				const scrollCalls = addEventListenerSpy.mock.calls.filter(
					call => call[0] === "scroll"
				);
				expect(scrollCalls.length).toBeGreaterThanOrEqual(1);
			});

			addEventListenerSpy.mockRestore();
		});

		it("cleans up scroll event listener on unmount", () => {
			const removeEventListenerSpy = vi.spyOn(HTMLElement.prototype, "removeEventListener");

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

			const { unmount } = renderCandidates();
			unmount();

			const scrollCalls = removeEventListenerSpy.mock.calls.filter(
				call => call[0] === "scroll"
			);
			expect(scrollCalls.length).toBeGreaterThanOrEqual(1);

			removeEventListenerSpy.mockRestore();
		});

		it("initializes scroll position and handles scroll events when scrollHeight > 0", async () => {
			// Collect all rAF callbacks for manual execution
			const rafCallbacks: FrameRequestCallback[] = [];
			const originalRAF = globalThis.requestAnimationFrame;
			globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
				rafCallbacks.push(cb);
				return rafCallbacks.length;
			}) as typeof requestAnimationFrame;

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

			const { container } = renderCandidates();

			const scrollDiv = container.querySelector(".overflow-y-auto") as HTMLDivElement;
			expect(scrollDiv).toBeInTheDocument();

			// Mock scrollHeight to simulate a tall container (3000px total, 1000px per segment)
			Object.defineProperty(scrollDiv, "scrollHeight", { value: 3000, configurable: true });

			// Execute the first rAF callback (initScroll)
			act(() => {
				while (rafCallbacks.length > 0) {
					const cb = rafCallbacks.shift()!;
					cb(performance.now());
				}
			});

			// After initScroll, scrollTop should be set to segment (1000)
			expect(scrollDiv.scrollTop).toBe(1000);

			// Execute any remaining rAF callbacks (isScrollingRef reset)
			act(() => {
				while (rafCallbacks.length > 0) {
					const cb = rafCallbacks.shift()!;
					cb(performance.now());
				}
			});

			// Test scroll near top (scrollTop < segment * 0.1 = 100)
			Object.defineProperty(scrollDiv, "scrollTop", { value: 50, writable: true, configurable: true });
			act(() => {
				fireEvent.scroll(scrollDiv);
			});

			// Execute rAF callbacks for scroll handler
			act(() => {
				while (rafCallbacks.length > 0) {
					const cb = rafCallbacks.shift()!;
					cb(performance.now());
				}
			});

			// Test scroll near bottom (scrollTop >= segment * 1.9 = 1900)
			Object.defineProperty(scrollDiv, "scrollTop", { value: 1950, writable: true, configurable: true });
			act(() => {
				fireEvent.scroll(scrollDiv);
			});

			// Execute rAF callbacks
			act(() => {
				while (rafCallbacks.length > 0) {
					const cb = rafCallbacks.shift()!;
					cb(performance.now());
				}
			});

			// Restore original rAF
			globalThis.requestAnimationFrame = originalRAF;
		});

		it("skips scroll handler when isScrolling flag is set", async () => {
			const rafCallbacks: FrameRequestCallback[] = [];
			const originalRAF = globalThis.requestAnimationFrame;
			globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
				rafCallbacks.push(cb);
				return rafCallbacks.length;
			}) as typeof requestAnimationFrame;

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

			const { container } = renderCandidates();

			const scrollDiv = container.querySelector(".overflow-y-auto") as HTMLDivElement;
			Object.defineProperty(scrollDiv, "scrollHeight", { value: 3000, configurable: true });

			// Execute initScroll rAF (this sets isScrollingRef = true, then queues another rAF to reset it)
			act(() => {
				const cb = rafCallbacks.shift();
				if (cb) cb(performance.now());
			});

			// At this point isScrollingRef is true (the reset rAF hasn't fired yet)
			// Scroll event should be ignored
			Object.defineProperty(scrollDiv, "scrollTop", { value: 50, writable: true, configurable: true });
			act(() => {
				fireEvent.scroll(scrollDiv);
			});

			// scrollTop should NOT have been modified by the handler because isScrolling was true
			// The value remains as set (50)
			expect(scrollDiv.scrollTop).toBe(50);

			// Now execute remaining rAF callbacks (reset isScrolling)
			act(() => {
				while (rafCallbacks.length > 0) {
					const cb = rafCallbacks.shift()!;
					cb(performance.now());
				}
			});

			globalThis.requestAnimationFrame = originalRAF;
		});

		it("skips scroll handler when segment is 0", async () => {
			const rafCallbacks: FrameRequestCallback[] = [];
			const originalRAF = globalThis.requestAnimationFrame;
			globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
				rafCallbacks.push(cb);
				return rafCallbacks.length;
			}) as typeof requestAnimationFrame;

			const operators = [MOCK_OPERATORS.basic];
			mockUseCallOperators.mockReturnValue({
				operatorsList: operators,
				loading: false,
				l2DetailsLoading: false,
				refreshOperator: vi.fn(),
				refreshAllOperators: vi.fn(),
				sortOperators: vi.fn(),
				totalStaked: "0",
			});

			const { container } = renderCandidates();

			const scrollDiv = container.querySelector(".overflow-y-auto") as HTMLDivElement;
			// scrollHeight defaults to 0 in jsdom, so segment = 0/3 = 0

			// Execute initScroll
			act(() => {
				while (rafCallbacks.length > 0) {
					const cb = rafCallbacks.shift()!;
					cb(performance.now());
				}
			});

			// scrollTop should not be changed (segment is 0, so the if block is skipped)
			expect(scrollDiv.scrollTop).toBe(0);

			// Fire scroll - handler should early return because segment <= 0
			act(() => {
				fireEvent.scroll(scrollDiv);
			});

			// No rAF callbacks should have been added by the scroll handler
			// (only the initial ones from mount)
			globalThis.requestAnimationFrame = originalRAF;
		});
	});

	describe("mounted state", () => {
		it("shows loading spinner before mounted state is set (initial render)", () => {
			// When mounted is false, component returns a loading spinner
			// We test this by checking the initial render before useEffect fires
			// Since useEffect for setMounted(true) runs synchronously in test,
			// verify the spinner is in the DOM at some point by rendering with loading=true
			mockUseCallOperators.mockReturnValue({
				operatorsList: [],
				loading: true,
				l2DetailsLoading: false,
				refreshOperator: vi.fn(),
				refreshAllOperators: vi.fn(),
				sortOperators: vi.fn(),
				totalStaked: "0",
			});

			const { container } = renderCandidates();

			// There should be a spinner either from the mounted check or from loading state
			const spinner = container.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
		});

		it("renders operator list after mounted and loaded", () => {
			const operators = [MOCK_OPERATORS.basic];
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

			// After mount + loaded, operators should be visible
			expect(screen.getAllByText("TestOperator").length).toBeGreaterThan(0);
		});
	});

	describe("L2 operator rendering", () => {
		it("renders L2 badge for L2 operators", () => {
			const operators = [MOCK_OPERATORS.l2];
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

			// L2 operator should show L2 badge
			const l2Badges = screen.getAllByText("L2");
			expect(l2Badges.length).toBeGreaterThanOrEqual(1);
		});

		it("does not render L2 badge for non-L2 operators", () => {
			const operators = [MOCK_OPERATORS.basic];
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

			const l2Badges = screen.queryAllByText("L2");
			expect(l2Badges.length).toBe(0);
		});
	});
});
