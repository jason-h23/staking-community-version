type TokenTypeSelectorProps = {
	tab: any;
	setTab: any;
};

export const TokenTypeSelector = (args: TokenTypeSelectorProps) => {
	const { tab, setTab } = args;
	const mobile = false;

	return (
		<div
			className={`${
				mobile ? "w-full h-10" : "w-[146px] h-[25px]"
			} p-[1px] border border-[#e7ebf2] rounded-[5px] ${
				mobile ? "text-[13px] font-medium" : "text-xs font-normal"
			} flex justify-between`}
		>
			<div
				className={`${
					mobile ? "w-1/2 h-[30px]" : "w-[73px] h-[22px]"
				} text-center rounded-[5px] ${
					tab === "TON" ? "text-white bg-[#2a72e5]" : "text-black bg-white"
				} flex justify-center items-center cursor-pointer transition-colors duration-200 hover:opacity-80`}
				onClick={() => setTab("TON")}
			>
				TON
			</div>
			<div
				className={`${
					mobile ? "w-1/2 h-[30px]" : "w-[73px] h-[22px]"
				} text-center rounded-[5px] ${
					tab === "WTON" ? "text-white bg-[#2a72e5]" : "text-black bg-white"
				} flex justify-center items-center cursor-pointer transition-colors duration-200 hover:opacity-80`}
				onClick={() => setTab("WTON")}
			>
				WTON
			</div>
		</div>
	);
};
