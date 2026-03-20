import { calculatorInputState, inputState } from "recoil/input";
import React from "react";
import { useRecoilState } from "recoil";

type InputProp = {
	placeHolder?: string;
	w?: number | string;
	h?: number | string;
	value?: string | number;
	isError?: boolean;
	maxValue?: any;
	type?: string;
	index?: string;
};

const addComma = (inputVal: any) => {
	const _val = inputVal;
	const checkInputVal = () => {
		if (_val) {
			const floatLen = _val.split(".")[1]?.length;
			if (floatLen) {
				return floatLen > 18 ? _val.slice(0, -1) : _val;
			}
			if (_val.split(".").length > 2) {
				return;
			}
			if (
				_val.split(".")[0]?.length > 1 &&
				_val.split(".")[0]?.substring(0, 1) === "0"
			) {
				return _val.split(".")[0].substring(1);
			}
			if (_val === ".") {
				return _val;
			} else {
				return _val
					.replace(/[^0-9a-zA-Z.]/g, "")
					.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}
		}
		return "";
	};

	return checkInputVal();
};

function BalanceInput(props: InputProp) {
	const { placeHolder, h, isError, maxValue, type, w } = props;

	const [value, setValue] = useRecoilState(inputState);
	const [calculatorValue, setCalculatorValue] =
		useRecoilState(calculatorInputState);

	const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { target } = event;
		let { value: inputValue } = target;
		// Remove commas for comparison
		const numericInput = inputValue.replace(/,/g, "");
		const numericMax = maxValue
			? String(maxValue).replace(/,/g, "")
			: undefined;
		if (
			numericMax &&
			!isNaN(Number(numericInput)) &&
			Number(numericInput) > Number(numericMax)
		) {
			inputValue = numericMax;
		}
		type === "staking"
			? setValue(addComma(inputValue))
			: setCalculatorValue(addComma(inputValue));
	};

	const getButtonPosition = () => {
		if (!value || value.length <= 4) return "86px";

		const charWidth = 17.5;
		const maxChars = 20;
		const basePos = 86;
		const charsToConsider = Math.min(value.length - 4, maxChars);

		const maxPosition =
			basePos + charsToConsider * charWidth > 310
				? 310
				: basePos + charsToConsider * charWidth;
		return `${maxPosition}px`;
	};

	const getInputStyles = () => {
		if (type === "staking") {
			return "text-[30px] h-full rounded-none text-left overflow-auto font-semibold font-open-sans placeholder:text-[#304156] border-0 mt-1.5 ml-4";
		} else if (type === "unstaking") {
			return "text-lg h-full rounded-none text-right overflow-auto font-bold placeholder:text-[#c6cbd9] border-0";
		} else if (type === "calculator") {
			// Calculator 모달용 스타일 - 입력 필드를 왼쪽으로 이동
			return "text-[13px] font-normal h-7 border-none text-right text-[#3e495c] placeholder:text-[#86929d] p-0 w-[65px] ml-1.5 mt-0.5";
		} else {
			return "text-[13px] font-normal h-7 border-none text-right text-[#3e495c] placeholder:text-[#86929d] p-0 w-[70px] ml-1.5 mt-0.5";
		}
	};

	return (
		<div className="flex items-center relative justify-start">
			{/* Staking용 MAX 버튼 - 왼쪽에 배치 */}
			{/* {type === "staking" && (
				<button
					className="w-[43px] h-5 border border-[#dfe4ee] rounded-[4px] bg-white text-xs font-normal font-open-sans text-[#86929d] z-[1] hover:bg-gray-50 transition-colors mr-2"
					onClick={() => {
						setValue(String(maxValue));
					}}
				>
					MAX
				</button>
			)} */}
			
			<div className={`${type === "staking" ? "w-auto" : "w-[118px]"} ${h ? `h-[${h}px]` : "h-[45px]"} ${isError ? "border-red-500" : ""} rounded-[4px] ${type === "staking" || type === "unstaking" ? "border-0" : "border border-[#dfe4ee]"} mr-1.5 relative`}>
				<div className="flex">
					<input
						className={`${getInputStyles()} text-[#1c1c1c] p-0 pl-0 text-left placeholder:text-[#C6CBD9] placeholder:font-semibold w-auto focus:outline-none`}
						placeholder={placeHolder}
						onChange={onChange}
						value={addComma(type === "staking" ? value : calculatorValue)}
					/>
					{type !== "staking" && (
						<span className="text-[13px] font-normal mr-2.5 ml-1.5 mt-1.5">
							TON
						</span>
					)}
				</div>
			</div>
			
			{/* Calculator용 MAX 버튼 - 오른쪽에 배치 */}
			{(type === "calculator" || type === "staking") && (
				<button
					className="w-[43px] h-5 border border-[#dfe4ee] rounded-[4px] bg-white text-xs font-normal font-open-sans text-[#86929d] z-[1] hover:bg-gray-50 transition-colors"
					onClick={() => {
						type === "staking"
							? setValue(String(maxValue))
							: setCalculatorValue(String(maxValue));
					}}
				>
					MAX
				</button>
			)}
		</div>
	);
}

export { BalanceInput };
