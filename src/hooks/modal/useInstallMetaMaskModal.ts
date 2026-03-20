import { installMetaMaskModalStatus } from "@/recoil/modal/atom";
import { useCallback } from "react";
import { useRecoilState } from "recoil";

export default function useInstallMetaMaskModal() {
	const [isOpen, setModalOpen] = useRecoilState(installMetaMaskModalStatus);

	const openInstallModal = useCallback(() => {
		setModalOpen(true);
	}, [setModalOpen]);

	const closeInstallModal = useCallback(() => {
		setModalOpen(false);
	}, [setModalOpen]);

	return {
		isOpen,
		openInstallModal,
		closeInstallModal,
	};
}

