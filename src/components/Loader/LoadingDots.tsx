export const LoadingDots = (args: { size?: string }) => {
	const { size } = args;
	const isSmall = size === "small";
	
	return (
		<div className="flex">
			<div className={`${isSmall ? 'w-2 h-2' : 'w-3 h-3'} bg-[#2a72e5] rounded-full animate-pulse`} style={{ animationDelay: '0ms' }}></div>
			<div className={`${isSmall ? 'w-2 h-2' : 'w-3 h-3'} bg-[#2a72e5] rounded-full animate-pulse mx-1.5`} style={{ animationDelay: '300ms' }}></div>
			<div className={`${isSmall ? 'w-2 h-2' : 'w-3 h-3'} bg-[#2a72e5] rounded-full animate-pulse`} style={{ animationDelay: '600ms' }}></div>
		</div>
	);
};
