import { DEFAULT_NETWORK } from "@/constant";

export function useAppChainId(): number {
	return Number(DEFAULT_NETWORK);
}
