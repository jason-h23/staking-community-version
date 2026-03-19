export interface WalletInfo {
	connector: string;
	name: string;
	iconName: string;
	description: string;
	color: string;
}

export const SUPPORTED_WALLETS: Record<string, WalletInfo> = {
	METAMASK: {
		connector: "metaMask",
		name: "MetaMask",
		iconName: "metamask_icon.png",
		description: "Connect to your MetaMask Wallet",
		color: "#E8831D",
	},
	WALLET_CONNECT: {
		connector: "walletConnect",
		name: "WalletConnect",
		iconName: "walletConnectIcon.svg",
		description: "Connect to your WalletConnect Wallet",
		color: "#3B99FC",
	},
	COINBASE_WALLET: {
		connector: "coinbaseWallet",
		name: "Coinbase Wallet",
		iconName: "coinbaseWalletIcon.svg",
		description: "Connect to your Coinbase Wallet",
		color: "#315CF5",
	},
};
