import React, { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecoilState } from "recoil";
import { installMetaMaskModalStatus } from "@/recoil/modal/atom";
import { 
	isMobileDevice, 
	isIOSDevice, 
	isAndroidDevice,
	getMetaMaskDeepLink,
	getMetaMaskAppStoreLink,
} from "@/utils/wallet/metamask";
import Image from "next/image";
import METAMASK from "assets/images/metamask_icon.png";

const InstallMetaMaskModal: FC = () => {
	const [isOpen, setIsOpen] = useRecoilState(installMetaMaskModalStatus);
	const [isMobile, setIsMobile] = useState(false);
	const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">("desktop");

	useEffect(() => {
		const mobile = isMobileDevice();
		setIsMobile(mobile);
		
		if (isIOSDevice()) {
			setDeviceType("ios");
		} else if (isAndroidDevice()) {
			setDeviceType("android");
		} else {
			setDeviceType("desktop");
		}
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

	const handleOpenInMetaMask = () => {
		// On mobile, try to open the app with deep link
		window.location.href = getMetaMaskDeepLink();
	};

	const handleInstallMetaMask = () => {
		// Open the appropriate app store or extension page
		window.open(getMetaMaskAppStoreLink(), "_blank");
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

	const getInstallButtonText = () => {
		switch (deviceType) {
			case "ios":
				return "Download from App Store";
			case "android":
				return "Download from Play Store";
			default:
				return "Install Browser Extension";
		}
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
							{/* MetaMask Icon */}
							<div className="mx-auto w-20 h-20 sm:w-16 sm:h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 shadow-sm">
								<Image 
									src={METAMASK} 
									alt="MetaMask" 
									className="w-12 h-12 sm:w-10 sm:h-10"
								/>
							</div>
							
							<h2 className="text-2xl sm:text-xl font-bold text-gray-900 mb-2">
								{isMobile ? "Open in MetaMask" : "MetaMask Required"}
							</h2>
							<p className="text-gray-500 text-base sm:text-sm max-w-[280px] mx-auto">
								{isMobile 
									? "To connect your wallet, open this page in the MetaMask app browser."
									: "To use this app, you need to install the MetaMask browser extension."
								}
							</p>
						</div>

						{/* Actions */}
						<div className="px-6 sm:px-5 pb-6 sm:pb-5 space-y-3">
							{/* Primary action - Open in MetaMask (mobile) or Install (desktop) */}
							{isMobile ? (
								<>
									<button
										onClick={handleOpenInMetaMask}
										className="w-full flex items-center justify-center gap-3 p-4 bg-[#F6851B] hover:bg-[#E2761B] active:bg-[#CD6116] text-white font-semibold rounded-xl transition-colors touch-manipulation"
									>
										<Image 
											src={METAMASK} 
											alt="MetaMask" 
											className="w-6 h-6"
										/>
										Open in MetaMask
									</button>
									
									<p className="text-center text-sm text-gray-500 py-2">
										Don't have MetaMask?
									</p>
									
									<button
										onClick={handleInstallMetaMask}
										className="w-full flex items-center justify-center gap-2 p-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors touch-manipulation"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
										</svg>
										{getInstallButtonText()}
									</button>
								</>
							) : (
								<>
									<button
										onClick={handleInstallMetaMask}
										className="w-full flex items-center justify-center gap-3 p-4 bg-[#F6851B] hover:bg-[#E2761B] active:bg-[#CD6116] text-white font-semibold rounded-xl transition-colors touch-manipulation"
									>
										<Image 
											src={METAMASK} 
											alt="MetaMask" 
											className="w-6 h-6"
										/>
										Install MetaMask
									</button>

									<button
										onClick={closeModal}
										className="w-full p-4 text-gray-500 hover:text-gray-700 font-medium transition-colors touch-manipulation"
									>
										I'll do it later
									</button>
								</>
							)}
						</div>

						{/* Info footer */}
						<div className="px-6 sm:px-5 pb-6 sm:pb-5 pt-0">
							<div className="bg-blue-50 rounded-xl p-4">
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
										<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div>
										<p className="text-sm text-blue-900 font-medium">What is MetaMask?</p>
										<p className="text-xs text-blue-700 mt-1">
											MetaMask is a secure wallet for Ethereum that lets you interact with decentralized apps.
										</p>
										<a 
											href="https://ethereum.org/wallets/" 
											target="_blank" 
											rel="noopener noreferrer"
											className="text-xs text-blue-600 font-medium hover:underline mt-2 inline-block"
										>
											Learn more about wallets →
										</a>
									</div>
								</div>
							</div>
						</div>

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

export default InstallMetaMaskModal;

