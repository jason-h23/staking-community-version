import { Operator } from "@/recoil/staking/operator";

export type SortDirection = "asc" | "desc";

export interface CommonContracts {
	seigManager: any;
	wton: any;
	layer2manager: any;
	ton: any;
}

export type AbiInput =
	| readonly Record<string, unknown>[]
	| { abi: readonly Record<string, unknown>[]; contractName?: string };

export type { Operator };
