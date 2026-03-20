import { vi } from "vitest";

/**
 * Default mock implementations for @tokamak-ecosystem/staking-sdk-react-kit
 *
 * Usage in tests:
 *   vi.mock("@tokamak-ecosystem/staking-sdk-react-kit", () => sdkMocks);
 *   // Or override individual hooks:
 *   vi.mock("@tokamak-ecosystem/staking-sdk-react-kit", () => ({
 *     ...sdkMocks,
 *     useTONBalance: () => ({ data: "5000000000000000000" }),
 *   }));
 */
export const sdkMocks = {
	// Provider — renders children as-is
	TONStakingProvider: ({ children }: { children: React.ReactNode }) => children,

	// Candidates
	useAllCandidates: () => ({
		candidates: [],
		isLoading: false,
	}),

	useAllCandidatesTotalStaked: () => ({
		data: "0",
		isLoading: false,
	}),

	// Balances
	useTONBalance: () => ({
		data: "0",
		isLoading: false,
	}),

	useWTONBalance: () => ({
		data: "0",
		isLoading: false,
	}),

	// Staking
	useUserStakeAmount: () => ({
		data: "0",
		isLoading: false,
	}),

	useCandidateStake: () => ({
		data: "0",
		isLoading: false,
	}),

	// Seigniorage
	useExpectedSeig: () => ({
		expectedSeig: "0",
		isLoading: false,
	}),

	useLayer2RewardInfo: () => ({
		layer2Reward: {
			layer2Tvl: BigInt(0),
		},
	}),

	useClaimableL2Seigniorage: () => ({
		claimableAmount: BigInt(0),
	}),

	// L2 addon
	useIsCandidateAddon: () => ({
		isCandidateAddon: false,
	}),
};

/**
 * Convenience function to create a vi.mock call with custom overrides.
 *
 * Usage:
 *   vi.mock("@tokamak-ecosystem/staking-sdk-react-kit",
 *     () => createSdkMock({ useTONBalance: () => ({ data: "100" }) })
 *   );
 */
export function createSdkMock(
	overrides: Partial<typeof sdkMocks> = {},
): typeof sdkMocks {
	return { ...sdkMocks, ...overrides };
}
