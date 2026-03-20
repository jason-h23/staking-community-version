import type { Operator } from "@/recoil/staking/operator";

const DEFAULTS: Operator = {
	name: "TestOperator",
	address: "0x1234567890abcdef1234567890abcdef12345678",
	totalStaked: "1000000000000000000000000000", // 1 TON in RAY
	yourStaked: "0",
	isL2: false,
};

export function createMockOperator(
	overrides: Partial<Operator> = {},
): Operator {
	return { ...DEFAULTS, ...overrides };
}

export function createMockOperatorList(count: number): Operator[] {
	return Array.from({ length: count }, (_, i) =>
		createMockOperator({
			name: `Operator-${i + 1}`,
			address: `0x${String(i + 1).padStart(40, "0")}`,
			totalStaked: `${(count - i) * 1000000000000000000000000000}`,
		}),
	);
}

export const MOCK_OPERATORS = {
	basic: createMockOperator(),
	l2: createMockOperator({
		name: "L2Operator",
		address: "0xabcdef1234567890abcdef1234567890abcdef12",
		isL2: true,
		sequencerSeig: "500000000000000000000000000",
		lockedInL2: "200000000000000000000000000",
		manager: "0xmanager0000000000000000000000000000000001",
		operatorAddress: "0xoperator000000000000000000000000000000001",
	}),
	withStake: createMockOperator({
		name: "StakedOperator",
		yourStaked: "500000000000000000000000000", // 0.5 TON in RAY
		totalStaked: "2000000000000000000000000000", // 2 TON in RAY
	}),
} as const;
