import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/**/*.test.{ts,tsx}"],
		setupFiles: ["./vitest.setup.ts"],
	},
	resolve: {
		alias: {
			"@/abis": path.resolve(__dirname, "./src/constant/abis"),
			"@/contracts": path.resolve(__dirname, "./src/constant/contracts"),
			"@/constant/": path.resolve(__dirname, "./src/constant/"),
			"@": path.resolve(__dirname, "./src"),
			"assets": path.resolve(__dirname, "./src/assets"),
			"connectors": path.resolve(__dirname, "./src/connectors"),
		},
	},
});
