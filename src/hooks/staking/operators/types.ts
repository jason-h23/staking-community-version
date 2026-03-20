import { Operator } from "@/recoil/staking/operator";

export type SortDirection = "asc" | "desc";

export interface CommonContracts {
	seigManager: any;
	wton: any;
	layer2manager: any;
	ton: any;
}

export type { Operator };
