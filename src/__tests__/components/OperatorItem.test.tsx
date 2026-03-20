import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestWrapper } from "../helpers/test-wrapper";
import {
	createMockOperator,
	MOCK_OPERATORS,
} from "../helpers/mocks/mockOperators";
import { OperatorItem } from "@/app/Staking/components/OperatorItem";

// Get the mocked router
const mockPush = vi.fn();
vi.mock("next/navigation", async () => {
	return {
		useRouter: () => ({
			push: mockPush,
			replace: vi.fn(),
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
			prefetch: vi.fn(),
		}),
		useParams: () => ({}),
		usePathname: () => "/",
		useSearchParams: () => new URLSearchParams(),
	};
});

function renderOperatorItem(operator: Parameters<typeof OperatorItem>[0]["operator"]) {
	return render(
		<TestWrapper>
			<OperatorItem operator={operator} />
		</TestWrapper>,
	);
}

describe("OperatorItem", () => {
	beforeEach(() => {
		mockPush.mockClear();
	});

	it("displays operator name and total staked amount", () => {
		const operator = createMockOperator({
			name: "Tokamak Network",
			totalStaked: "1000000000000000000000000000", // 1 TON in RAY (27 decimals)
		});

		renderOperatorItem(operator);

		expect(screen.getByText("Tokamak Network")).toBeInTheDocument();
		expect(screen.getByText("Total Staked")).toBeInTheDocument();
		expect(screen.getByText("TON", { exact: false })).toBeInTheDocument();
	});

	it("shows L2 badge when operator is L2", () => {
		renderOperatorItem(MOCK_OPERATORS.l2);

		expect(screen.getByText("L2")).toBeInTheDocument();
	});

	it("does not show L2 badge for non-L2 operator", () => {
		renderOperatorItem(MOCK_OPERATORS.basic);

		expect(screen.queryByText("L2")).not.toBeInTheDocument();
	});

	it("shows Your Staked when yourStaked is a non-zero value", () => {
		renderOperatorItem(MOCK_OPERATORS.withStake);

		expect(screen.getByText("Your Staked")).toBeInTheDocument();
	});

	it("does not show Your Staked when yourStaked is '0'", () => {
		const operator = createMockOperator({ yourStaked: "0" });

		renderOperatorItem(operator);

		expect(screen.queryByText("Your Staked")).not.toBeInTheDocument();
	});

	it("does not show Your Staked when yourStaked is undefined", () => {
		const operator = createMockOperator({ yourStaked: undefined });

		renderOperatorItem(operator);

		expect(screen.queryByText("Your Staked")).not.toBeInTheDocument();
	});

	it("navigates to operator detail page on click", async () => {
		const user = userEvent.setup();
		const operator = createMockOperator({
			address: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		renderOperatorItem(operator);

		const item = screen.getByText(operator.name).closest("div[class*='cursor-pointer']");
		expect(item).toBeInTheDocument();

		await user.click(item!);

		expect(mockPush).toHaveBeenCalledWith(
			`/${operator.address}`,
		);
	});
});
