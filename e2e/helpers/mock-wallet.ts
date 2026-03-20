import type { Page } from "@playwright/test";

export const MOCK_ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const MOCK_CHAIN_ID = "0xAA36A7"; // Sepolia (11155111 decimal)
export const MOCK_CHAIN_ID_DECIMAL = 11155111;

/**
 * Injects a fake window.ethereum provider into the page.
 * Must be called before page navigation (use addInitScript).
 *
 * The mock:
 * - Responds to eth_chainId, eth_accounts, eth_requestAccounts
 * - Supports wallet_switchEthereumChain (no-op)
 * - Emits chainChanged and accountsChanged events via EventEmitter pattern
 * - Prevents window.location.reload() loops from WalletModal's checkConnection
 */
export async function injectMockWallet(page: Page): Promise<void> {
	await page.addInitScript(
		({ account, chainId }) => {
			// Prevent infinite reload loops that WalletModal triggers
			// when it detects eth_accounts returning an address on mount.
			let reloadCount = 0;
			const originalReload = window.location.reload.bind(window.location);
			Object.defineProperty(window.location, "reload", {
				configurable: true,
				value: () => {
					reloadCount++;
					if (reloadCount > 1) return;
					originalReload();
				},
			});

			const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

			const ethereum = {
				isMetaMask: true,
				selectedAddress: account,
				chainId,
				networkVersion: String(parseInt(chainId, 16)),

				request: async ({
					method,
					params,
				}: {
					method: string;
					params?: unknown[];
				}): Promise<unknown> => {
					switch (method) {
						case "eth_chainId":
							return chainId;
						case "net_version":
							return String(parseInt(chainId, 16));
						case "eth_accounts":
							return [account];
						case "eth_requestAccounts":
							return [account];
						case "wallet_switchEthereumChain":
							return null;
						case "wallet_addEthereumChain":
							return null;
						case "eth_getBalance":
							return "0x0de0b6b3a7640000"; // 1 ETH in wei
						case "eth_sendTransaction":
							return "0xmocktxhash";
						case "eth_getTransactionReceipt":
							return {
								transactionHash: "0xmocktxhash",
								status: "0x1",
								blockNumber: "0x1",
							};
						default:
							return null;
					}
				},

				on: (event: string, callback: (...args: unknown[]) => void) => {
					if (!listeners[event]) {
						listeners[event] = [];
					}
					listeners[event].push(callback);
				},

				removeListener: (
					event: string,
					callback: (...args: unknown[]) => void,
				) => {
					if (listeners[event]) {
						listeners[event] = listeners[event].filter((cb) => cb !== callback);
					}
				},

				emit: (event: string, ...args: unknown[]) => {
					(listeners[event] || []).forEach((cb) => cb(...args));
				},

				// Legacy API compatibility
				send: async (method: string, params: unknown[]) => {
					return ethereum.request({ method, params });
				},
				enable: async () => [account],
			};

			// Attach to window
			Object.defineProperty(window, "ethereum", {
				value: ethereum,
				writable: true,
				configurable: true,
			});
		},
		{ account: MOCK_ACCOUNT, chainId: MOCK_CHAIN_ID },
	);
}

/**
 * Sets up a page with mock wallet injection.
 * Call this before navigating to any page that uses wallet.
 */
export async function setupMockWallet(page: Page): Promise<void> {
	await injectMockWallet(page);
}
