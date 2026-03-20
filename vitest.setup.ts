import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { vi } from "vitest";

// --- next/image mock: render as plain <img> ---
vi.mock("next/image", () => ({
	__esModule: true,
	default: (props: Record<string, unknown>) => {
		const { src, alt, ...rest } = props;
		const imgSrc =
			typeof src === "object" && src !== null && "src" in src
				? (src as { src: string }).src
				: String(src ?? "");
		return createElement("img", { src: imgSrc, alt: String(alt ?? ""), ...rest });
	},
}));

// --- next/navigation mock ---
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	useParams: () => ({}),
	usePathname: () => "/",
	useSearchParams: () => new URLSearchParams(),
}));

// --- next/dynamic mock: synchronous import ---
vi.mock("next/dynamic", () => ({
	__esModule: true,
	default: (loader: () => Promise<{ default: React.ComponentType }>) => {
		let Component: React.ComponentType | null = null;
		try {
			const mod = (loader as unknown as () => { default: React.ComponentType })();
			Component = mod.default || mod;
		} catch {
			// If loader is truly async, fallback to null
		}
		return Component ?? (() => null);
	},
}));

// --- window.ethereum stub ---
Object.defineProperty(globalThis, "ethereum", {
	value: {
		request: vi.fn().mockResolvedValue(null),
		on: vi.fn(),
		removeListener: vi.fn(),
		isMetaMask: true,
	},
	writable: true,
	configurable: true,
});

if (typeof window !== "undefined") {
	Object.defineProperty(window, "ethereum", {
		value: (globalThis as any).ethereum,
		writable: true,
		configurable: true,
	});

	// window.location.reload is non-configurable in jsdom.
	// Tests needing it should mock window.location entirely via vi.stubGlobal.
}
