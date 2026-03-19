export const CloseButton = ({ onClick }: { onClick: () => void }) => (
	<button
		onClick={onClick}
		className="p-2 -mr-2 text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors touch-manipulation rounded-lg hover:bg-gray-100"
		aria-label="Close modal"
	>
		<svg
			className="w-6 h-6"
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
	</button>
);
