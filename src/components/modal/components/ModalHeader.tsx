import Image from "next/image";

export const ModalHeader = (args: {
	main: string;
	sub: string;
	closeThisModal: any;
	type?: number;
	sub2?: string;
}) => {
	const { main, sub, closeThisModal, type, sub2 } = args;

	const getRightPosition = () => {
		if (main === "Withdraw" && type === 3) return "-490px";
		if (main === "Withdraw" && type === 2) return "-330px";
		if (main === "Withdraw") return "-160px";
		if (type === 4) return "-180px";
		if (main === "Stake") return "-110px";
		return "-110px";
	};

	return (
		<div className="relative flex flex-col items-center">
			<div
				className="absolute cursor-pointer"
				style={{
					right: getRightPosition(),
					top: "-60px"
				}}
				onClick={() => closeThisModal()}
			>
				{/* Close icon would go here */}
			</div>
			<h2 className="text-[#3d495d] text-xl font-bold mt-1.5 w-[200px] text-center">
				{main}
			</h2>
			<div className={`${type === 2 ? "text-[#3d495d]" : "text-[#86929d]"} text-xs font-normal mb-5 max-w-[290px] text-center flex flex-row`}>
				<span>{sub}</span>
				{type === 2 ? (
					<span className="text-[#257eee] ml-0.5">
						{sub2}
					</span>
				) : (
					""
				)}
			</div>
		</div>
	);
};

export default ModalHeader;
