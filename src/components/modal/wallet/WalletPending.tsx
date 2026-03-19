export const WalletPending = ({
	error,
	connector,
	setPendingError,
	tryActivation,
}: {
	error: boolean;
	connector: any;
	setPendingError: (error: boolean) => void;
	tryActivation: (connector: any) => void;
}) => {
	return (
		<div className="flex flex-col px-4 py-8 sm:py-6 justify-center items-center">
			{!error && (
				<div className="flex flex-col items-center">
					<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
					<span className="text-gray-600 text-sm">
						Connecting to wallet...
					</span>
				</div>
			)}
			{error && (
				<div className="flex flex-col items-center">
					<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
						<svg
							className="w-6 h-6 text-red-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<span className="text-red-500 mb-4 text-center">
						Connection failed
					</span>
					<button
						className="px-6 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation font-medium"
						onClick={() => {
							setPendingError(false);
							tryActivation(connector);
						}}
					>
						Try again
					</button>
				</div>
			)}
		</div>
	);
};
