import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { RecoilRoot, MutableSnapshot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { operatorsListState, type Operator } from "@/recoil/staking/operator";
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
vi.mock("@/hooks/staking/useWithdrawable", () => ({
	useWithdrawableLength: () => ({
		withdrawableAmount: "0",
		withdrawableLength: "0",
		pendingRequests: 0,
		pendingUnstaked: "0",
		isLoading: false,
	}),
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

function renderStakingPage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0 } },
	});

	const initializeState = (snapshot: MutableSnapshot) => {
		snapshot.set(operatorsListState, [TEST_OPERATOR]);
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
});
