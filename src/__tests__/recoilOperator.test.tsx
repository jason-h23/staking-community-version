import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	snapshot_UNSTABLE,
	RecoilRoot,
	RecoilState,
	useRecoilState,
} from "recoil";
import { renderHook, act } from "@testing-library/react";

// Mock recoil-persist before importing atoms
vi.mock("recoil-persist", () => ({
	recoilPersist: () => ({
		persistAtom: vi.fn(),
	}),
}));

import {
	operatorsListState,
	operatorsLoadingState,
	selectedOperatorState,
	operatorFilterState,
	filteredOperatorsState,
	type Operator,
} from "@/recoil/staking/operator";

function getAtomDefault<T>(atom: RecoilState<T>): T {
	const snapshot = snapshot_UNSTABLE();
	return snapshot.getLoadable(atom).getValue();
}

function createOperator(overrides: Partial<Operator> = {}): Operator {
	return {
		name: "TestOperator",
		address: "0x0000000000000000000000000000000000000001",
		totalStaked: "1000",
		...overrides,
	};
}

function RecoilWrapper({ children }: { children: React.ReactNode }) {
	return <RecoilRoot>{children}</RecoilRoot>;
}

describe("recoil/staking/operator", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
	});

	// ─── Atom defaults ──────────────────────────────────────────

	describe("atom defaults", () => {
		it("operatorsListState should default to empty array", () => {
			const value = getAtomDefault(operatorsListState);
			expect(value).toEqual([]);
		});

		it("operatorsLoadingState should default to true", () => {
			const value = getAtomDefault(operatorsLoadingState);
			expect(value).toBe(true);
		});

		it("selectedOperatorState should default to null", () => {
			const value = getAtomDefault(selectedOperatorState);
			expect(value).toBeNull();
		});

		it("operatorFilterState should default to empty string", () => {
			const value = getAtomDefault(operatorFilterState);
			expect(value).toBe("");
		});
	});

	// ─── filteredOperatorsState selector ─────────────────────────

	describe("filteredOperatorsState", () => {
		it("should return all operators when filter is empty", () => {
			const operators: Operator[] = [
				createOperator({ name: "Alpha" }),
				createOperator({ name: "Beta" }),
				createOperator({ name: "Gamma" }),
			];

			const snapshot = snapshot_UNSTABLE(({ set }) => {
				set(operatorsListState, operators);
				set(operatorFilterState, "");
			});

			const filtered = snapshot
				.getLoadable(filteredOperatorsState)
				.getValue();
			expect(filtered).toEqual(operators);
			expect(filtered).toHaveLength(3);
		});

		it("should filter operators by name (case insensitive)", () => {
			const operators: Operator[] = [
				createOperator({ name: "Alpha Node" }),
				createOperator({ name: "Beta Operator" }),
				createOperator({ name: "alpha Prime" }),
			];

			const snapshot = snapshot_UNSTABLE(({ set }) => {
				set(operatorsListState, operators);
				set(operatorFilterState, "alpha");
			});

			const filtered = snapshot
				.getLoadable(filteredOperatorsState)
				.getValue();
			expect(filtered).toHaveLength(2);
			expect(filtered[0].name).toBe("Alpha Node");
			expect(filtered[1].name).toBe("alpha Prime");
		});

		it("should return empty array when no operators match filter", () => {
			const operators: Operator[] = [
				createOperator({ name: "Alpha" }),
				createOperator({ name: "Beta" }),
			];

			const snapshot = snapshot_UNSTABLE(({ set }) => {
				set(operatorsListState, operators);
				set(operatorFilterState, "zzz");
			});

			const filtered = snapshot
				.getLoadable(filteredOperatorsState)
				.getValue();
			expect(filtered).toEqual([]);
		});

		it("should handle uppercase filter matching lowercase names", () => {
			const operators: Operator[] = [
				createOperator({ name: "tokamak node" }),
				createOperator({ name: "Other" }),
			];

			const snapshot = snapshot_UNSTABLE(({ set }) => {
				set(operatorsListState, operators);
				set(operatorFilterState, "TOKAMAK");
			});

			const filtered = snapshot
				.getLoadable(filteredOperatorsState)
				.getValue();
			expect(filtered).toHaveLength(1);
			expect(filtered[0].name).toBe("tokamak node");
		});

		it("should return empty array when operators list is empty", () => {
			const snapshot = snapshot_UNSTABLE(({ set }) => {
				set(operatorsListState, []);
				set(operatorFilterState, "anything");
			});

			const filtered = snapshot
				.getLoadable(filteredOperatorsState)
				.getValue();
			expect(filtered).toEqual([]);
		});

		it("should match partial names", () => {
			const operators: Operator[] = [
				createOperator({ name: "Tokamak Network" }),
				createOperator({ name: "StakeHub Pro" }),
				createOperator({ name: "SuperStaker" }),
			];

			const snapshot = snapshot_UNSTABLE(({ set }) => {
				set(operatorsListState, operators);
				set(operatorFilterState, "stak");
			});

			const filtered = snapshot
				.getLoadable(filteredOperatorsState)
				.getValue();
			expect(filtered).toHaveLength(2);
			expect(filtered[0].name).toBe("StakeHub Pro");
			expect(filtered[1].name).toBe("SuperStaker");
		});

		it("should preserve operator properties in filtered results", () => {
			const operators: Operator[] = [
				createOperator({
					name: "Full Props",
					address: "0xABC",
					totalStaked: "5000",
					yourStaked: "100",
					isL2: true,
					sequencerSeig: "200",
					lockedInL2: "300",
					manager: "0xManager",
					operatorAddress: "0xOp",
				}),
			];

			const snapshot = snapshot_UNSTABLE(({ set }) => {
				set(operatorsListState, operators);
				set(operatorFilterState, "Full");
			});

			const filtered = snapshot
				.getLoadable(filteredOperatorsState)
				.getValue();
			expect(filtered).toHaveLength(1);
			expect(filtered[0]).toEqual(operators[0]);
		});
	});

	// ─── Atom effects (localStorage persistence) ────────────────

	describe("operatorsListState effects", () => {
		it("should save operators to localStorage when value is set", () => {
			const operators: Operator[] = [
				createOperator({ name: "Saved Op", address: "0x111" }),
			];

			const { result } = renderHook(
				() => useRecoilState(operatorsListState),
				{ wrapper: RecoilWrapper },
			);

			act(() => {
				const [, setOperators] = result.current;
				setOperators(operators);
			});

			const stored = window.localStorage.getItem("operators-persist");
			expect(stored).not.toBeNull();
			const parsed = JSON.parse(stored!);
			expect(parsed).toHaveLength(1);
			expect(parsed[0].name).toBe("Saved Op");
			expect(parsed[0].address).toBe("0x111");
		});

		it("should serialize values correctly as JSON", () => {
			const operators: Operator[] = [
				createOperator({
					name: "Complex",
					totalStaked: "999999",
					isL2: true,
				}),
			];

			const { result } = renderHook(
				() => useRecoilState(operatorsListState),
				{ wrapper: RecoilWrapper },
			);

			act(() => {
				const [, setOperators] = result.current;
				setOperators(operators);
			});

			const stored = window.localStorage.getItem("operators-persist");
			const parsed = JSON.parse(stored!);
			expect(parsed[0].totalStaked).toBe("999999");
			expect(parsed[0].isL2).toBe(true);
		});

		it("should serialize bigint values as strings in localStorage", () => {
			// The custom JSON replacer converts bigint to string
			const operatorWithBigint = {
				name: "BigintOp",
				address: "0x222",
				totalStaked: BigInt("12345678901234567890"),
			} as unknown as Operator;

			const { result } = renderHook(
				() => useRecoilState(operatorsListState),
				{ wrapper: RecoilWrapper },
			);

			act(() => {
				const [, setOperators] = result.current;
				setOperators([operatorWithBigint]);
			});

			const stored = window.localStorage.getItem("operators-persist");
			expect(stored).not.toBeNull();
			const parsed = JSON.parse(stored!);
			expect(parsed[0].totalStaked).toBe("12345678901234567890");
			expect(typeof parsed[0].totalStaked).toBe("string");
		});

		it("should handle empty array being set", () => {
			const { result } = renderHook(
				() => useRecoilState(operatorsListState),
				{ wrapper: RecoilWrapper },
			);

			act(() => {
				const [, setOperators] = result.current;
				setOperators([createOperator()]);
			});

			act(() => {
				const [, setOperators] = result.current;
				setOperators([]);
			});

			const stored = window.localStorage.getItem("operators-persist");
			expect(stored).not.toBeNull();
			expect(JSON.parse(stored!)).toEqual([]);
		});
	});

	// ─── Atom keys (uniqueness / no collision) ──────────────────

	describe("atom keys", () => {
		it("all atoms should have unique keys", () => {
			const keys = [
				operatorsListState.key,
				operatorsLoadingState.key,
				selectedOperatorState.key,
				operatorFilterState.key,
			];
			const uniqueKeys = new Set(keys);
			expect(uniqueKeys.size).toBe(keys.length);
		});

		it("selector should have a unique key", () => {
			expect(filteredOperatorsState.key).toBe("filteredOperatorsState");
		});
	});
});
