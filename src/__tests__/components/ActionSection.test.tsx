import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionSection } from "@/app/[contractAddress]/components/ActionSection";

// Mock useCalculatorModal
vi.mock("@/hooks/modal/useCalculatorModal", () => ({
	default: () => ({
		openCalculatorModal: vi.fn(),
		isOpen: false,
		closeSelectModal: vi.fn(),
	}),
}));

const defaultProps = {
	activeAction: "Stake",
	setActiveAction: vi.fn(),
	isL2: false,
	setValue: vi.fn(),
	withdrawableAmount: "1000000000000000000000000000", // 1 TON in RAY
	withdrawTarget: "Ethereum",
	pendingUnstaked: "500000000000000000000000000", // 0.5 TON in RAY
};

function renderActionSection(overrides: Partial<typeof defaultProps> = {}) {
	const props = { ...defaultProps, ...overrides };
	return render(<ActionSection {...props} />);
}

describe("ActionSection", () => {
	beforeEach(() => {
		defaultProps.setActiveAction.mockClear();
		defaultProps.setValue.mockClear();
	});

	describe("tab switching", () => {
		it("calls setActiveAction and clears value when Stake tab is clicked", async () => {
			const user = userEvent.setup();
			renderActionSection({ activeAction: "Unstake" });

			await user.click(screen.getByRole("button", { name: "Stake" }));

			expect(defaultProps.setActiveAction).toHaveBeenCalledWith("Stake");
			expect(defaultProps.setValue).toHaveBeenCalledWith("");
		});

		it("calls setActiveAction and clears value when Unstake tab is clicked", async () => {
			const user = userEvent.setup();
			renderActionSection({ activeAction: "Stake" });

			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			expect(defaultProps.setActiveAction).toHaveBeenCalledWith("Unstake");
			expect(defaultProps.setValue).toHaveBeenCalledWith("");
		});

		it("calls setActiveAction with Restake and sets pendingUnstaked value", async () => {
			const user = userEvent.setup();
			renderActionSection();

			await user.click(screen.getByRole("button", { name: "Restake" }));

			expect(defaultProps.setActiveAction).toHaveBeenCalledWith("Restake");
			// viem formatUnits(BigInt(pendingUnstaked), 27) is called
			expect(defaultProps.setValue).toHaveBeenCalled();
		});
	});

	describe("active tab styling", () => {
		it("highlights the active Stake tab", () => {
			renderActionSection({ activeAction: "Stake" });

			const stakeButton = screen.getByRole("button", { name: "Stake" });
			expect(stakeButton.className).toContain("bg-[#2a72e5]");
			expect(stakeButton.className).toContain("text-white");
		});

		it("highlights the active Unstake tab", () => {
			renderActionSection({ activeAction: "Unstake" });

			const unstakeButton = screen.getByRole("button", { name: /Unstake/ });
			expect(unstakeButton.className).toContain("bg-[#2a72e5]");
		});
	});

	describe("non-L2 withdraw", () => {
		it("shows a simple Withdraw button when isL2 is false", () => {
			renderActionSection({ isL2: false });

			expect(screen.getByRole("button", { name: "Withdraw" })).toBeInTheDocument();
		});

		it("calls setActiveAction with Withdraw and sets withdrawable value", async () => {
			const user = userEvent.setup();
			renderActionSection({ isL2: false });

			await user.click(screen.getByRole("button", { name: "Withdraw" }));

			expect(defaultProps.setActiveAction).toHaveBeenCalledWith("Withdraw");
			expect(defaultProps.setValue).toHaveBeenCalled();
		});
	});

	describe("L2 withdraw dropdown", () => {
		it("shows a Withdraw dropdown button when isL2 is true", () => {
			renderActionSection({ isL2: true });

			// The button text should be "Withdraw" (no specific target selected)
			expect(screen.getByText("Withdraw")).toBeInTheDocument();
		});

		it("opens dropdown menu on click and shows Ethereum and L2 options", async () => {
			const user = userEvent.setup();
			renderActionSection({ isL2: true });

			// Click the withdraw dropdown button
			const withdrawButton = screen.getByText("Withdraw").closest("button");
			await user.click(withdrawButton!);

			// Dropdown should show Ethereum and L2 options
			expect(screen.getByRole("button", { name: "Ethereum" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "L2" })).toBeInTheDocument();
		});

		it("selects Ethereum target and calls WithdrawL1", async () => {
			const user = userEvent.setup();
			renderActionSection({ isL2: true });

			// Open dropdown
			const withdrawButton = screen.getByText("Withdraw").closest("button");
			await user.click(withdrawButton!);

			// Click Ethereum
			await user.click(screen.getByRole("button", { name: "Ethereum" }));

			expect(defaultProps.setActiveAction).toHaveBeenCalledWith("WithdrawL1");
			expect(defaultProps.setValue).toHaveBeenCalled();
		});

		it("selects L2 target and calls WithdrawL2", async () => {
			const user = userEvent.setup();
			renderActionSection({ isL2: true });

			// Open dropdown
			const withdrawButton = screen.getByText("Withdraw").closest("button");
			await user.click(withdrawButton!);

			// Click L2
			await user.click(screen.getByRole("button", { name: "L2" }));

			expect(defaultProps.setActiveAction).toHaveBeenCalledWith("WithdrawL2");
			expect(defaultProps.setValue).toHaveBeenCalledWith("");
		});

		it("shows 'Withdraw - Eth' when activeAction is WithdrawL1", () => {
			renderActionSection({ isL2: true, activeAction: "WithdrawL1" });

			expect(screen.getByText("Withdraw - Eth")).toBeInTheDocument();
		});

		it("shows 'Withdraw - L2' when activeAction is WithdrawL2", () => {
			renderActionSection({ isL2: true, activeAction: "WithdrawL2" });

			expect(screen.getByText("Withdraw - L2")).toBeInTheDocument();
		});
	});

	it("shows Simulator link", () => {
		renderActionSection();

		expect(screen.getByRole("button", { name: "Simulator" })).toBeInTheDocument();
	});
});
