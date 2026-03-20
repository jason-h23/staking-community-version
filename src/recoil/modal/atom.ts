import { atom } from "recoil";

type withdrawModal = {
	isOpen: boolean;
	modalData?: any;
};

export const transactionModalStatus = atom<
	"confirming" | "confirmed" | "error" | null
>({
	key: "transactionModalStatus",
	default: null,
});

export const operatorSelectModalStatus = atom<boolean>({
	key: "operatorSelectStatus",
	default: false,
});

export const walletModalStatus = atom<boolean>({
	key: "walletStatus",
	default: false,
});

export const transactionModalOpenStatus = atom<boolean>({
	key: "transactionModalOpenStatus",
	default: false,
});

export const calculatorModalStatus = atom<boolean>({
	key: "calculatorStatus",
	default: false,
});

// New modal atoms for mobile wallet experience
export const networkModalStatus = atom<boolean>({
	key: "networkModalStatus",
	default: false,
});

export const installMetaMaskModalStatus = atom<boolean>({
	key: "installMetaMaskModalStatus",
	default: false,
});
