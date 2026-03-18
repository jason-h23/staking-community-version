import React from "react";
import { motion } from "framer-motion";

export const MotionBox = motion.div;

export const Loader = () => {
	return (
		<div className="h-screen flex items-center justify-center">
			<MotionBox
				// as="aside"
				animate={{
					scale: [1, 2, 2, 1, 1],
					rotate: [0, 0, 270, 270, 0],
					borderRadius: ["20%", "20%", "50%", "50%", "20%"],
				}}
				transition={{
					duration: 2,
					ease: "easeInOut",
					times: [0, 0.2, 0.5, 0.8, 1],
					repeat: Infinity,
					repeatType: "loop",
					repeatDelay: 1,
				}}
				className="p-2 bg-gradient-to-l from-[#7928CA] to-[#FF0080] w-12 h-12 flex"
			/>
		</div>
	);
};
