import { networkModalStatus } from "@/recoil/modal/atom";
import { useCallback } from "react";
import { useRecoilState } from "recoil";

export default function useNetworkModal() {
	const [isOpen, setModalOpen] = useRecoilState(networkModalStatus);

	const openNetworkModal = useCallback(() => {
		setModalOpen(true);
	}, [setModalOpen]);

	const closeNetworkModal = useCallback(() => {
		setModalOpen(false);
	}, [setModalOpen]);

	return {
		isOpen,
		openNetworkModal,
		closeNetworkModal,
	};
}

