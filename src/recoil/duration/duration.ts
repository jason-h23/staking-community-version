import { atom, selector } from "recoil";

export type Duration = "1-year" | "6-month" | "3-month" | "1-month";

const durationState = atom<Duration>({
	key: "durationState",
	default: "1-year",
});

const selectedDurationState = selector({
	key: "selectedDurationState",
	get: ({ get }) => {
		const selectedDurationState = get(durationState);
		return selectedDurationState;
	},
});

export { durationState, selectedDurationState };
