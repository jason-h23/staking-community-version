import { atom, selector } from "recoil";

const inputState = atom({
	key: "inputState",
	default: "0",
});

const inputBalanceState = selector({
	key: "inputBalanceState",
	get: ({ get }) => {
		const selectedModalState = get(inputState);
		return selectedModalState;
	},
});

const calculatorInputState = atom({
	key: "calculatorInputState",
	default: "0",
});

const inputCalculatorBalanceState = selector({
	key: "inputCalculatorBalanceState",
	get: ({ get }) => {
		const selectedModalState = get(calculatorInputState);
		return selectedModalState;
	},
});

export {
	inputState,
	inputBalanceState,
	calculatorInputState,
	inputCalculatorBalanceState,
};
