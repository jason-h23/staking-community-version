import type { Metadata } from "next";
import "./globals.css";
import RecoilRootWrapper from "@/app/Staking/components/RecoilWrapper";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "@/providers/wagmiProvider";
import Entry from "./Entry";
import "@/styles/globals.css";

export const metadata: Metadata = {
	title: "TON Staking",
	viewport:
		"width=device-width,user-scalable=no,initial-scale=1, maximum-scale=1, minimum-scale=1",
	keywords: "staking",
	openGraph: {
		type: "website",
		title: "TON Staking community version",
		description:
			"TON Staking community version offers a simple interface for customized UI/UX.",
	},
	// icons: {
	//   icon: [{ url: "/favicon.ico" }],
	// },
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body
				style={{ maxHeight: "100vh", margin: 0, padding: 0 }}
				suppressHydrationWarning
			>
				<RecoilRootWrapper>
					<WagmiConfig config={wagmiConfig}>
						<Entry>{children}</Entry>
					</WagmiConfig>
				</RecoilRootWrapper>
			</body>
		</html>
	);
}
