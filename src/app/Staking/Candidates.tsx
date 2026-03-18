"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import useCallOperators from "@/hooks/staking/useCallOperators";
import { useAllCandidates } from "@tokamak-ecosystem/staking-sdk-react-kit";
import React from "react";
import { OperatorItem } from "./components/OperatorItem";

const Candidates: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [mounted, setMounted] = useState(false);
	const { operatorsList, loading } = useCallOperators();
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const segmentRef = useRef<number>(0);
	const isScrollingRef = useRef<boolean>(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const filteredOperators = useMemo(() => 
		operatorsList.filter((op) =>
			op.name.toLowerCase().includes(searchTerm.toLowerCase()),
		),
		[operatorsList, searchTerm]
	);

	const { baseOperators, repeatedOperators } = useMemo(() => {
		const minItems = 30;
		const base =
			filteredOperators.length < minItems
				? Array(minItems).fill(filteredOperators).flat().slice(0, minItems)
				: filteredOperators;

		const repeated = [
			...base,
			...base,
			...base,
		];
		
		return { baseOperators: base, repeatedOperators: repeated };
	}, [filteredOperators]);

	const operatorsCount = baseOperators.length;

	console.log("repeatedOperators", repeatedOperators.length);
	useEffect(() => {
		if (!mounted || loading) return;
		const container = scrollContainerRef.current;
		if (!container) return;

		// Wait for the container to be properly sized
		const initScroll = () => {
			const totalHeight = container.scrollHeight;
			const segment = totalHeight / 3;
			segmentRef.current = segment;
			
			if (segment > 0) {
				isScrollingRef.current = true;
				container.scrollTop = segment;
				// Reset the flag after scroll completes
				requestAnimationFrame(() => {
					isScrollingRef.current = false;
				});
			}
		};

		// Use requestAnimationFrame to ensure DOM is ready
		requestAnimationFrame(initScroll);

		const onScroll = () => {
			if (isScrollingRef.current) return;
			
			const segment = segmentRef.current;
			if (segment <= 0) return;
			
			const top = container.scrollTop;
			if (top < segment * 0.1) {
				isScrollingRef.current = true;
				container.scrollTop = top + segment;
				requestAnimationFrame(() => {
					isScrollingRef.current = false;
				});
			} else if (top >= segment * 1.9) {
				isScrollingRef.current = true;
				container.scrollTop = top - segment;
				requestAnimationFrame(() => {
					isScrollingRef.current = false;
				});
			}
		};

		container.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			container.removeEventListener("scroll", onScroll);
		};
	}, [mounted, loading, operatorsCount]);

	if (!mounted) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<div className="h-[600px] lg:h-[1056px] mx-auto px-0 lg:px-4 relative">
			<div
				ref={scrollContainerRef}
				className="h-[600px] lg:h-[1056px] max-h-[600px] lg:max-h-[1056px] overflow-y-auto mt-6 relative pt-10 pb-10 scrollbar-hide"
				style={{
					scrollbarWidth: "none", // hide scrollbar for Firefox
					msOverflowStyle: "none", // hide scrollbar for IE/Edge
					willChange: "scroll-position",
					overscrollBehavior: "none",
				}}
			>
				<div
					className="w-full flex flex-col"
					style={{ willChange: "transform" }}
				>
					{loading ? (
						<div className="flex justify-center items-center h-[400px] lg:h-[856px]">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a72e5]"></div>
						</div>
					) : (
						repeatedOperators.map((operator) => (
							<OperatorItem key={operator.address} operator={operator} />
						))
					)}
				</div>
			</div>
			{/* Top gradient overlay */}
			<div
				className="absolute top-0 left-0 right-0 h-[150px] lg:h-[300px] pointer-events-none z-[2]"
				style={{
					background: "linear-gradient(to bottom, rgba(250,251,252,1) 0%, rgba(250,251,252,0.9) 30%, rgba(250,251,252,0.5) 60%, transparent 100%)"
				}}
			/>
			{/* Bottom gradient overlay */}
			<div
				className="absolute bottom-0 left-0 right-0 h-[150px] lg:h-[300px] pointer-events-none z-[2]"
				style={{
					background: "linear-gradient(to top, rgba(250,251,252,1) 0%, rgba(250,251,252,0.9) 30%, rgba(250,251,252,0.5) 60%, transparent 100%)"
				}}
			/>
		</div>
	);
};

export default Candidates;
