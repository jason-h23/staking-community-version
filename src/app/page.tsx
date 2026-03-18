"use client";

import Staking from "./Staking/index";
import { useAccount, useChainId } from "wagmi";
import Image from "next/image";
import VECTOR from "@/assets/images/Vector.svg";
import { DEFAULT_NETWORK, SUPPORTED_CHAIN_IDS } from "@/constant";
import useWalletModal from "@/hooks/modal/useWalletModal";
import dynamic from "next/dynamic";
import { useRecoilState } from "recoil";
import { chainIdState } from "@/recoil/chainId";
import WalletModal from "@/components/modal/WalletModal";

const Candidates = dynamic(
	() => import("./Staking/index"),
	{ ssr: false }, // ← client-only
);

export default function Page() {
	const { address } = useAccount();
	const [chainId] = useRecoilState(chainIdState);
	const { onOpenSelectModal } = useWalletModal();

	return (
		<div className="flex items-center h-full justify-center px-4 lg:px-0">
			{address && SUPPORTED_CHAIN_IDS.includes(chainId || 0) ? (
				<Candidates />
			) : (
				<div className="w-full max-w-[338px] h-auto min-h-[208px] p-5 flex items-center justify-center rounded-[10px] bg-white border border-[#e7ebf2] flex-col">
					<Image src={VECTOR} alt="vector" />
					<div className="text-[#1c1c1c] text-[15px] font-light my-5 font-open-sans text-center">
						Connect your wallet to start Tokamak staking service
					</div>
					<button
						className="w-full max-w-[298px] h-10 rounded-[4px] bg-[#257eee] text-white text-sm font-roboto hover:bg-[#1a5cbf] transition-colors duration-200"
						onClick={() => onOpenSelectModal()}
					>
						Connect Wallet
					</button>
				</div>
			)}
			{/* WalletModal 추가 */}
			<WalletModal />
		</div>
	);
}
