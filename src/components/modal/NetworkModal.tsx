import React, { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecoilState } from "recoil";
import { networkModalStatus } from "@/recoil/modal/atom";
import { switchNetwork, isMobileDevice } from "@/utils/wallet/metamask";

const NetworkModal: FC = () => {
	const [isOpen, setIsOpen] = useRecoilState(networkModalStatus);
	const [isMobile, setIsMobile] = useState(false);
	const [isSwitching, setIsSwitching] = useState(false);

	useEffect(() => {
		setIsMobile(isMobileDevice());
	}, []);

	// Prevent body scroll when modal is open on mobile
	useEffect(() => {
		if (isOpen && isMobile) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen, isMobile]);

	const handleSwitchNetwork = async (chainId: "0x1" | "0xaa36a7") => {
		setIsSwitching(true);
		try {
			const success = await switchNetwork(chainId);
			if (success) {
				setIsOpen(false);
			}
		} catch (error) {
			console.error("Failed to switch network:", error);
		} finally {
			setIsSwitching(false);
		}
	};

	const closeModal = () => {
		setIsOpen(false);
	};

	// Animation variants
	const overlayVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1 },
	};

	const mobileModalVariants = {
		hidden: { y: "100%" },
		visible: { y: 0 },
	};

	const desktopModalVariants = {
		hidden: { opacity: 0, scale: 0.95, x: "-50%", y: "-50%" },
		visible: { opacity: 1, scale: 1, x: "-50%", y: "-50%" },
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center">
					{/* Overlay */}
					<motion.div
						className="fixed inset-0 bg-black/60 backdrop-blur-sm"
						onClick={closeModal}
						initial="hidden"
						animate="visible"
						exit="hidden"
						variants={overlayVariants}
						transition={{ duration: 0.2 }}
					/>

					{/* Modal Content */}
					<motion.div
						className={`
							bg-white shadow-2xl overflow-hidden
							${isMobile 
								? "fixed inset-x-0 bottom-0 rounded-t-3xl" 
								: "fixed top-1/2 left-1/2 w-[380px] rounded-2xl"
							}
						`}
						initial="hidden"
						animate="visible"
						exit="hidden"
						variants={isMobile ? mobileModalVariants : desktopModalVariants}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
					>
						{/* Mobile drag handle */}
						{isMobile && (
							<div className="flex justify-center pt-3 pb-1">
								<div className="w-10 h-1 bg-gray-300 rounded-full" />
							</div>
						)}

						{/* Header */}
						<div className="p-6 sm:p-5 text-center">
							{/* Warning Icon */}
							<div className="mx-auto w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4">
								<svg 
									className="w-8 h-8 sm:w-7 sm:h-7 text-orange-500" 
									fill="none" 
									stroke="currentColor" 
									viewBox="0 0 24 24"
								>
									<path 
										strokeLinecap="round" 
										strokeLinejoin="round" 
										strokeWidth={2} 
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
									/>
								</svg>
							</div>
							
							<h2 className="text-2xl sm:text-xl font-bold text-gray-900 mb-2">
								Wrong Network
							</h2>
							<p className="text-gray-500 text-base sm:text-sm">
								This app doesn't support your current network. Please switch to a supported network to continue.
							</p>
						</div>

						{/* Network Options */}
						<div className="px-6 sm:px-5 pb-6 sm:pb-5 space-y-3">
							{/* Mainnet Button */}
							<button
								onClick={() => handleSwitchNetwork("0x1")}
								disabled={isSwitching}
								className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-manipulation disabled:opacity-50"
							>
								<div className="flex items-center">
									<div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
										<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
											<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
										</svg>
									</div>
									<div className="text-left">
										<p className="font-semibold text-gray-900">Ethereum Mainnet</p>
										<p className="text-sm text-gray-500">Production network</p>
									</div>
								</div>
								<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</button>

							{/* Sepolia Button */}
							<button
								onClick={() => handleSwitchNetwork("0xaa36a7")}
								disabled={isSwitching}
								className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-manipulation disabled:opacity-50"
							>
								<div className="flex items-center">
									<div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mr-3">
										<svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
											<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
										</svg>
									</div>
									<div className="text-left">
										<p className="font-semibold text-gray-900">Sepolia Testnet</p>
										<p className="text-sm text-gray-500">Test network</p>
									</div>
								</div>
								<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</div>

						{/* Loading overlay when switching */}
						{isSwitching && (
							<div className="absolute inset-0 bg-white/80 flex items-center justify-center">
								<div className="flex flex-col items-center">
									<div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
									<p className="text-gray-600 text-sm">Switching network...</p>
								</div>
							</div>
						)}

						{/* Close button - only on desktop */}
						{!isMobile && (
							<button
								onClick={closeModal}
								className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						)}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default NetworkModal;

