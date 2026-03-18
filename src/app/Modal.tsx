import CalculatorModal from "@/components/modal/CalculatorModal";
import OperatorSelectModal from "@/components/modal/OperatorSelectModal";
import WalletModal from "@/components/modal/WalletModal";
import NetworkModal from "@/components/modal/NetworkModal";
import InstallMetaMaskModal from "@/components/modal/InstallMetaMaskModal";

export default function Modals() {
	return (
		<>
			<OperatorSelectModal />
			<CalculatorModal />
			<WalletModal />
			<NetworkModal />
			<InstallMetaMaskModal />
		</>
	);
}
