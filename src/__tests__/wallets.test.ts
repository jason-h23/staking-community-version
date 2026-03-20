import { describe, it, expect } from "vitest";
import { SUPPORTED_WALLETS } from "@/constant/wallets";

describe("SUPPORTED_WALLETS", () => {
	it("should have MetaMask, WalletConnect, and Coinbase", () => {
		expect(SUPPORTED_WALLETS.METAMASK).toBeDefined();
		expect(SUPPORTED_WALLETS.WALLET_CONNECT).toBeDefined();
		expect(SUPPORTED_WALLETS.COINBASE_WALLET).toBeDefined();
	});

	it("each wallet should have required fields", () => {
		Object.values(SUPPORTED_WALLETS).forEach((wallet) => {
			expect(wallet.connector).toBeTruthy();
			expect(wallet.name).toBeTruthy();
			expect(wallet.iconName).toBeTruthy();
			expect(wallet.description).toBeTruthy();
			expect(wallet.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		});
	});

	it("MetaMask connector id should be metaMask", () => {
		expect(SUPPORTED_WALLETS.METAMASK.connector).toBe("metaMask");
	});
});
