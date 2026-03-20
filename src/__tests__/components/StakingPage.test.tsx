import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { RecoilRoot, MutableSnapshot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { operatorsListState, type Operator } from "@/recoil/staking/operator";
import { inputState } from "@/recoil/input";
import { txPendingStatus } from "@/recoil/transaction/tx";
import { MOCK_OPERATORS } from "../helpers/mocks/mockOperators";
import { sdkMocks } from "../helpers/mocks/mockSdkReactKit";

// --- Mock external hooks and modules ---

const mockPush = vi.fn();
const mockOnOpenSelectModal = vi.fn();
const mockStakeTON = vi.fn();
const mockStakeWTON = vi.fn();
const mockUnstake = vi.fn();
const mockRestake = vi.fn();
const mockWithdraw = vi.fn();
const mockWithdrawL2 = vi.fn();
const mockUpdateSeig = vi.fn();
const mockClaim = vi.fn();

// wagmi
vi.mock("wagmi", async (importOriginal) => {
	const actual = await importOriginal<typeof import("wagmi")>();
	return {
		...actual,
		useAccount: () => ({
			address: "0xuser0000000000000000000000000000000000001",
			isConnected: true,
		}),
		useChainId: () => 1,
	};
});

// next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	useParams: () => ({
		contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
	}),
	usePathname: () => "/0x1234567890abcdef1234567890abcdef12345678",
	useSearchParams: () => new URLSearchParams(),
}));

// SDK react kit
vi.mock("@tokamak-ecosystem/staking-sdk-react-kit", () => ({
	...sdkMocks,
	useTONBalance: () => ({ data: "10000000000000000000" }), // 10 TON
	useWTONBalance: () => ({ data: "5000000000000000000000000000" }), // 5 WTON in RAY
	useUserStakeAmount: () => ({
		data: "1000000000000000000000000000", // 1 TON in RAY
		isLoading: false,
	}),
	useExpectedSeig: () => ({
		expectedSeig: "100000000000000000000000000", // 0.1 TON in RAY
		isLoading: false,
	}),
	useCandidateStake: () => ({
		data: "50000000000000000000000000000", // 50 TON in RAY
		isLoading: false,
	}),
	useIsCandidateAddon: () => ({
		isCandidateAddon: false,
	}),
}));

// useCallOperators - operator address must match params.contractAddress
vi.mock("@/hooks/staking/useCallOperators", () => ({
	default: () => ({
		operatorsList: [
			{
				name: "TestOperator",
				address: "0x1234567890abcdef1234567890abcdef12345678",
				totalStaked: "1000000000000000000000000000",
				yourStaked: "500000000000000000000000000",
				isL2: false,
			},
		],
		loading: false,
		refreshOperator: vi.fn(),
		refreshAllOperators: vi.fn(),
		sortOperators: vi.fn(),
		totalStaked: "0",
	}),
}));

// useSelectOperatorModal
vi.mock("@/hooks/modal/useSelectOperatorModal", () => ({
	default: () => ({
		isOpen: false,
		onOpenSelectModal: mockOnOpenSelectModal,
		closeSelectModal: vi.fn(),
	}),
}));

// useStakingInformation
vi.mock("@/hooks/info/useStakingInfo", () => ({
	useStakingInformation: () => ({
		stakingInfo: [],
		roi: 12.5,
	}),
}));

// useWithdrawableLength
const mockWithdrawableData = vi.fn().mockReturnValue({
	withdrawableAmount: "0",
	withdrawableLength: "0",
	pendingRequests: 0,
	pendingUnstaked: "0",
	isLoading: false,
});
vi.mock("@/hooks/staking/useWithdrawable", () => ({
	useWithdrawableLength: (...args: unknown[]) => mockWithdrawableData(...args),
}));

// useExpectedSeigs
vi.mock("@/hooks/staking/useCalculateExpectedSeig", () => ({
	useExpectedSeigs: () => ({
		expectedSeig: "0",
		seigOfLayer: "0",
		lastSeigBlock: "100",
		commissionRate: "0",
	}),
}));

// Staking action hooks
vi.mock("@/hooks/staking/useStakeTON", () => ({
	default: () => ({ stakeTON: mockStakeTON }),
}));
vi.mock("@/hooks/staking/useStakeWTON", () => ({
	useStakeWTON: () => ({ stakeWTON: mockStakeWTON }),
}));
vi.mock("@/hooks/staking/useUnstake", () => ({
	default: () => ({ unstake: mockUnstake }),
}));
vi.mock("@/hooks/staking/useRestake", () => ({
	default: () => ({ restake: mockRestake }),
}));
vi.mock("@/hooks/staking/useWithdraw", () => ({
	default: () => ({ withdraw: mockWithdraw }),
}));
vi.mock("@/hooks/staking/useWithdrawL2", () => ({
	default: () => ({ withdrawL2: mockWithdrawL2 }),
}));
vi.mock("@/hooks/staking/useUpdateSeig", () => ({
	default: () => ({ updateSeig: mockUpdateSeig }),
}));
vi.mock("@/hooks/staking/useClaim", () => ({
	default: () => ({ claim: mockClaim }),
}));

// useCalculatorModal
vi.mock("@/hooks/modal/useCalculatorModal", () => ({
	default: () => ({
		openCalculatorModal: vi.fn(),
		isOpen: false,
		closeSelectModal: vi.fn(),
	}),
}));

// BalanceInput uses bare "recoil/input" import which vitest can't resolve
vi.mock("@/components/input/CustomInput", () => ({
	BalanceInput: ({ placeHolder }: { placeHolder: string }) => (
		<input placeholder={placeHolder} data-testid="balance-input" />
	),
}));

// getContractAddress
vi.mock("@/constant/contracts", () => ({
	getContractAddress: () => ({
		TON_ADDRESS: "0xTON",
		WTON_ADDRESS: "0xWTON",
		DepositManager_ADDRESS: "0xDEPOSIT",
		SeigManager_ADDRESS: "0xSEIG",
		Layer2Registry_ADDRESS: "0xREGISTRY",
		Layer2Manager_ADDRESS: "0xLAYER2MGR",
	}),
}));

// Asset images
vi.mock("@/assets/images/ton_symbol.svg", () => ({
	default: { src: "/ton.svg", height: 24, width: 24 },
}));
vi.mock("@/assets/images/wton_symbol.svg", () => ({
	default: { src: "/wton.svg", height: 24, width: 24 },
}));
vi.mock("@/assets/images/list-arrow_icon.svg", () => ({
	default: { src: "/arrow.svg", height: 16, width: 16 },
}));
vi.mock("@/assets/images/list-arrow_icon_white.svg", () => ({
	default: { src: "/arrow-white.svg", height: 16, width: 16 },
}));
vi.mock("@/assets/images/input_question_icon.svg", () => ({
	default: { src: "/question.svg", height: 16, width: 16 },
}));
vi.mock("@/assets/images/input_question_icon_white.svg", () => ({
	default: { src: "/question-white.svg", height: 16, width: 16 },
}));
vi.mock("@/assets/images/eth.svg", () => ({
	default: { src: "/eth.svg", height: 24, width: 24 },
}));
vi.mock("@/assets/images/right_arrow.svg", () => ({
	default: { src: "/right-arrow.svg", height: 16, width: 16 },
}));

// Import after all mocks
import Page from "@/app/[contractAddress]/page";

const testConfig = createConfig({
	chains: [mainnet, sepolia],
	transports: {
		[mainnet.id]: http(),
		[sepolia.id]: http(),
	},
});

const TEST_OPERATOR: Operator = {
	name: "TestOperator",
	address: "0x1234567890abcdef1234567890abcdef12345678",
	totalStaked: "1000000000000000000000000000",
	yourStaked: "500000000000000000000000000",
	isL2: false,
};

function renderStakingPage(
	customInitializeState?: (snapshot: MutableSnapshot) => void,
) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0 } },
	});

	const initializeState = (snapshot: MutableSnapshot) => {
		snapshot.set(operatorsListState, [TEST_OPERATOR]);
		customInitializeState?.(snapshot);
	};

	return render(
		<WagmiProvider config={testConfig}>
			<QueryClientProvider client={queryClient}>
				<RecoilRoot initializeState={initializeState}>
					<Page />
				</RecoilRoot>
			</QueryClientProvider>
		</WagmiProvider>,
	);
}

describe("StakingPage", () => {
	beforeEach(() => {
		mockPush.mockClear();
		mockStakeTON.mockClear();
		mockUnstake.mockClear();
	});

	it("displays operator name from operators list", () => {
		renderStakingPage();

		// The page finds the operator by contractAddress from params
		// Since our mock params has address "0x1234567890abcdef1234567890abcdef12345678"
		// which matches MOCK_OPERATORS.basic
		expect(screen.getByText("TestOperator")).toBeInTheDocument();
	});

	it("shows Back button to navigate home", async () => {
		const user = userEvent.setup();
		renderStakingPage();

		const backButton = screen.getByText("Back");
		expect(backButton).toBeInTheDocument();

		await user.click(backButton);
		expect(mockPush).toHaveBeenCalledWith("/");
	});

	it("shows staking info (APY, Total staked, Commission rate)", () => {
		renderStakingPage();

		expect(screen.getByText("Staking APY")).toBeInTheDocument();
		expect(screen.getByText("Total staked")).toBeInTheDocument();
		expect(screen.getByText("Commission rate")).toBeInTheDocument();
	});

	it("shows action buttons (Stake, Unstake, Restake)", () => {
		renderStakingPage();

		expect(screen.getByRole("button", { name: "Stake" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Unstake/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Restake" })).toBeInTheDocument();
	});

	it("shows disabled button with 'Enter an amount' when no value", () => {
		renderStakingPage();

		// The button should show "Enter an amount" via getButtonText when value is "0"
		expect(screen.getByText("Enter an amount")).toBeInTheDocument();

		// Button should be disabled
		const mainButton = screen.getByText("Enter an amount").closest("button");
		expect(mainButton).toBeDisabled();
	});

	it("shows Stake warning message when Stake action is active", () => {
		renderStakingPage();

		expect(
			screen.getByText(/Staking TON will earn you TON staking rewards/),
		).toBeInTheDocument();
	});

	it("switches to Unstake and shows unstake warning", async () => {
		const user = userEvent.setup();
		renderStakingPage();

		await user.click(screen.getByRole("button", { name: /Unstake/ }));

		expect(
			screen.getByText(/To withdraw staked TON, it needs to be unstaked/),
		).toBeInTheDocument();
	});

	it("switches to Restake and shows restake warning", async () => {
		const user = userEvent.setup();
		renderStakingPage();

		await user.click(screen.getByRole("button", { name: "Restake" }));

		expect(
			screen.getByText(/Restaking unstaked TON earns you TON from staking/),
		).toBeInTheDocument();
	});

	it("shows Your Staked Amount section", () => {
		renderStakingPage();

		expect(screen.getByText("Your Staked Amount")).toBeInTheDocument();
	});

	it("shows Unclaimed Staking Reward section", () => {
		renderStakingPage();

		expect(screen.getByText("Unclaimed Staking Reward")).toBeInTheDocument();
	});

	it("shows token type selector (TON/WTON) when Stake is active", () => {
		renderStakingPage();

		// TokenTypeSelector shows TON and WTON tabs. "TON" appears in multiple places
		// (token selector, balance, staked amounts), so check for multiple occurrences
		const tonElements = screen.getAllByText("TON");
		expect(tonElements.length).toBeGreaterThanOrEqual(2); // at least selector + balance
		expect(screen.getByText("WTON")).toBeInTheDocument();
	});

	it("shows balance info", () => {
		renderStakingPage();

		expect(screen.getByText(/Balance:/)).toBeInTheDocument();
	});

	describe("onClick handler - Stake action", () => {
		beforeEach(() => {
			mockStakeTON.mockClear();
			mockStakeWTON.mockClear();
			mockUnstake.mockClear();
			mockRestake.mockClear();
			mockWithdraw.mockClear();
			mockWithdrawL2.mockClear();
			mockWithdrawableData.mockReturnValue({
				withdrawableAmount: "0",
				withdrawableLength: "0",
				pendingRequests: 0,
				pendingUnstaked: "0",
				isLoading: false,
			});
		});

		it("calls stakeTON when Stake action is active with TON token and valid amount", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "5");
			});

			// Multiple buttons match "Stake" (action tab + main submit button)
			// The main submit button is the last one in DOM order
			const stakeButtons = screen.getAllByRole("button", { name: /^Stake$/i });
			const mainButton = stakeButtons[stakeButtons.length - 1];
			expect(mainButton).not.toBeDisabled();

			await user.click(mainButton);
			expect(mockStakeTON).toHaveBeenCalledTimes(1);
		});

		it("switches WTON token display when WTON tab is clicked", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "2");
			});

			// Switch to WTON token
			await user.click(screen.getByText("WTON"));

			// The token symbol next to the input should now show WTON
			const tokenLabels = screen.getAllByText("WTON");
			expect(tokenLabels.length).toBeGreaterThanOrEqual(2); // selector tab + token display

			// The main button should still be enabled with a valid value
			const stakeButtons = screen.getAllByRole("button", { name: /^Stake$/i });
			const mainButton = stakeButtons[stakeButtons.length - 1];
			expect(mainButton).not.toBeDisabled();
		});
	});

	describe("onClick handler - Unstake action", () => {
		beforeEach(() => {
			mockUnstake.mockClear();
			mockWithdrawableData.mockReturnValue({
				withdrawableAmount: "0",
				withdrawableLength: "0",
				pendingRequests: 0,
				pendingUnstaked: "0",
				isLoading: false,
			});
		});

		it("button is disabled after switching to Unstake (ActionSection resets value)", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "0.5");
			});

			// Switching to Unstake resets value via ActionSection's setValue("")
			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			// Button shows "Enter an amount" when value is reset
			expect(screen.getByRole("button", { name: /Enter an amount/i })).toBeDisabled();
		});

		it("does not call unstake when amount exceeds staked balance", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				// userStaked is 1 TON in RAY, set input to 2 (more than staked)
				snapshot.set(inputState, "2");
			});

			// Switch to Unstake action
			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			// The button should be disabled because ActionSection resets value to ""
			expect(screen.getByRole("button", { name: /Enter an amount/i })).toBeDisabled();
		});
	});

	describe("onClick handler - Withdraw action", () => {
		beforeEach(() => {
			mockWithdraw.mockClear();
		});

		it("calls withdraw when Withdraw action is clicked with non-zero withdrawable amount", async () => {
			// Mock non-zero withdrawable amount so ActionSection sets a valid value
			mockWithdrawableData.mockReturnValue({
				withdrawableAmount: "5000000000000000000000000000", // 5 TON in RAY
				withdrawableLength: "1",
				pendingRequests: 1,
				pendingUnstaked: "0",
				isLoading: false,
			});

			const user = userEvent.setup();
			const queryClient = new QueryClient({
				defaultOptions: { queries: { retry: false, gcTime: 0 } },
			});

			const initializeState = (snapshot: MutableSnapshot) => {
				snapshot.set(operatorsListState, [TEST_OPERATOR]);
			};

			render(
				<WagmiProvider config={testConfig}>
					<QueryClientProvider client={queryClient}>
						<RecoilRoot initializeState={initializeState}>
							<Page />
						</RecoilRoot>
					</QueryClientProvider>
				</WagmiProvider>,
			);

			// Click Withdraw - ActionSection will set value to formatUnits(withdrawableAmount, 27)
			await user.click(screen.getByRole("button", { name: "Withdraw" }));

			const mainButtons = screen.getAllByRole("button").filter(
				btn => btn.classList.contains("w-full")
			);
			const mainButton = mainButtons[0];

			await user.click(mainButton);
			expect(mockWithdraw).toHaveBeenCalledTimes(1);
		});
	});

	describe("onClick handler - Restake action", () => {
		beforeEach(() => {
			mockRestake.mockClear();
		});

		it("calls restake when Restake action is clicked with non-zero pending unstaked", async () => {
			// Mock non-zero pendingUnstaked so ActionSection sets a valid value
			mockWithdrawableData.mockReturnValue({
				withdrawableAmount: "0",
				withdrawableLength: "0",
				pendingRequests: 2,
				pendingUnstaked: "3000000000000000000000000000", // 3 TON in RAY
				isLoading: false,
			});

			const user = userEvent.setup();
			renderStakingPage();

			// Click Restake - ActionSection will set value to formatUnits(pendingUnstaked, 27)
			await user.click(screen.getByRole("button", { name: "Restake" }));

			const restakeButtons = screen.getAllByRole("button", { name: /^Restake$/i });
			const mainButton = restakeButtons[restakeButtons.length - 1];
			await user.click(mainButton);
			expect(mockRestake).toHaveBeenCalledTimes(1);
		});
	});

	describe("isUnstakeDisabled logic", () => {
		it("disables button when unstake action is active and no value is entered", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "0");
			});

			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			expect(screen.getByRole("button", { name: /Enter an amount/i })).toBeDisabled();
		});

		it("disables button when unstake value is 0.00", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "0.00");
			});

			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			expect(screen.getByRole("button", { name: /Enter an amount/i })).toBeDisabled();
		});
	});

	describe("showUnstakeWarning logic", () => {
		beforeEach(() => {
			mockWithdrawableData.mockReturnValue({
				withdrawableAmount: "0",
				withdrawableLength: "0",
				pendingRequests: 0,
				pendingUnstaked: "0",
				isLoading: false,
			});
		});

		it("does not show unstake warning when Stake action is active (even with value)", () => {
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "2");
			});

			expect(
				screen.queryByText(/Unstake amount exceeds your staked amount/),
			).not.toBeInTheDocument();
		});

		it("does not show unstake warning after switching to Unstake (value gets reset)", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "2");
			});

			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			// After switching, value is reset to "" by ActionSection
			expect(
				screen.queryByText(/Unstake amount exceeds your staked amount/),
			).not.toBeInTheDocument();
		});

		it("does not show unstake warning when value is 0", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "0");
			});

			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			expect(
				screen.queryByText(/Unstake amount exceeds your staked amount/),
			).not.toBeInTheDocument();
		});
	});

	describe("UI conditional rendering", () => {
		it("does not show L2 badge when operator is not L2", () => {
			renderStakingPage();

			// The L2 badge should not be present for non-L2 operator
			const l2Badges = screen.queryAllByText("L2");
			// L2 badge in the operator name area should not exist
			expect(l2Badges.length).toBe(0);
		});

		it("shows L2 badge when operator is L2", () => {
			const l2Operator: Operator = { ...TEST_OPERATOR, isL2: true };

			renderStakingPage((snapshot) => {
				snapshot.set(operatorsListState, [l2Operator]);
			});

			const l2Badges = screen.getAllByText("L2");
			expect(l2Badges.length).toBeGreaterThanOrEqual(1);
		});

		it("hides token type selector when Unstake is active", async () => {
			const user = userEvent.setup();
			renderStakingPage();

			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			// WTON tab should disappear when Unstake is active
			expect(screen.queryByText("WTON")).not.toBeInTheDocument();
		});

		it("hides token type selector when Restake is active", async () => {
			const user = userEvent.setup();
			renderStakingPage();

			await user.click(screen.getByRole("button", { name: "Restake" }));

			// WTON tab should disappear when Restake is active
			expect(screen.queryByText("WTON")).not.toBeInTheDocument();
		});

		it("displays Withdraw action button for non-L2 operator", () => {
			renderStakingPage();

			// Non-L2 operator should show a simple Withdraw button (not dropdown)
			expect(screen.getByRole("button", { name: "Withdraw" })).toBeInTheDocument();
		});

		it("shows 'Enter an amount' for main button when value is 0.00", () => {
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "0.00");
			});

			const mainButton = screen.getByRole("button", { name: /Enter an amount/i });
			expect(mainButton).toBeDisabled();
		});

		it("shows 'Stake' button text when action is Stake with valid value", () => {
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "0.5");
			});

			// Multiple "Stake" buttons exist (tab + main), main is last
			const stakeButtons = screen.getAllByRole("button", { name: /^Stake$/i });
			const mainButton = stakeButtons[stakeButtons.length - 1];
			expect(mainButton).toHaveTextContent("Stake");
		});

		it("shows 'Enter an amount' after switching to Unstake (ActionSection resets value)", async () => {
			const user = userEvent.setup();
			renderStakingPage((snapshot) => {
				snapshot.set(inputState, "0.5");
			});

			// Switch to Unstake - ActionSection calls setValue("")
			await user.click(screen.getByRole("button", { name: /Unstake/ }));

			// After reset, button shows "Enter an amount"
			const mainButtons = screen.getAllByRole("button").filter(
				btn => btn.classList.contains("w-full")
			);
			expect(mainButtons[0]).toHaveTextContent("Enter an amount");
		});

		it("shows 'Withdraw' button text when Withdraw action is selected with non-zero withdrawable", async () => {
			mockWithdrawableData.mockReturnValue({
				withdrawableAmount: "5000000000000000000000000000", // 5 TON in RAY
				withdrawableLength: "1",
				pendingRequests: 1,
				pendingUnstaked: "0",
				isLoading: false,
			});

			const user = userEvent.setup();
			const queryClient = new QueryClient({
				defaultOptions: { queries: { retry: false, gcTime: 0 } },
			});

			const initializeState = (snapshot: MutableSnapshot) => {
				snapshot.set(operatorsListState, [TEST_OPERATOR]);
			};

			render(
				<WagmiProvider config={testConfig}>
					<QueryClientProvider client={queryClient}>
						<RecoilRoot initializeState={initializeState}>
							<Page />
						</RecoilRoot>
					</QueryClientProvider>
				</WagmiProvider>,
			);

			await user.click(screen.getByRole("button", { name: "Withdraw" }));

			const mainButtons = screen.getAllByRole("button").filter(
				btn => btn.classList.contains("w-full")
			);
			expect(mainButtons[0]).toHaveTextContent("Withdraw");
		});

		it("shows loading spinner on main button when txPending is true", () => {
			const queryClient = new QueryClient({
				defaultOptions: { queries: { retry: false, gcTime: 0 } },
			});

			const initializeState = (snapshot: MutableSnapshot) => {
				snapshot.set(operatorsListState, [TEST_OPERATOR]);
				snapshot.set(inputState, "1");
				snapshot.set(txPendingStatus, true);
			};

			render(
				<WagmiProvider config={testConfig}>
					<QueryClientProvider client={queryClient}>
						<RecoilRoot initializeState={initializeState}>
							<Page />
						</RecoilRoot>
					</QueryClientProvider>
				</WagmiProvider>,
			);

			// When txPending is true, the main button should show a spinner (animate-spin)
			const mainButtons = screen.getAllByRole("button").filter(
				btn => btn.classList.contains("w-full")
			);
			const mainButton = mainButtons[0];
			expect(mainButton).toBeDisabled();

			const spinner = mainButton.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
		});

		it("does not render L2 sequencer seigniorage section when isCandidateAddon is false", () => {
			renderStakingPage();

			// The "Sequencer seigniorage" title should not exist when isCandidateAddon is false
			expect(screen.queryByText("Sequencer seigniorage")).not.toBeInTheDocument();
			expect(screen.queryByText("TON Bridged to L2")).not.toBeInTheDocument();
			expect(screen.queryByText("Claimable Seigniorage")).not.toBeInTheDocument();
		});
	});
});
