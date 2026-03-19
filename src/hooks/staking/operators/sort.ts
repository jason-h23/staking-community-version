import { BigNumber } from "ethers";
import type { Operator, SortDirection } from "./types";

export function compareTotalStaked(
	a: Operator,
	b: Operator,
	direction: SortDirection,
): number {
	try {
		const aBN = BigNumber.from(a.totalStaked || "0");
		const bBN = BigNumber.from(b.totalStaked || "0");

		if (aBN.eq(bBN)) return 0;

		if (direction === "asc") {
			return aBN.lt(bBN) ? -1 : 1;
		} else {
			return aBN.gt(bBN) ? -1 : 1;
		}
	} catch {
		const aNum = Number(a.totalStaked || "0");
		const bNum = Number(b.totalStaked || "0");

		if (direction === "asc") {
			return aNum - bNum;
		} else {
			return bNum - aNum;
		}
	}
}
