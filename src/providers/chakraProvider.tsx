"use client";

import { theme } from "@/style/theme/chakraTheme";
import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";

export function ChakraProvidersForNextJs({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<RecoilRoot>
			<ChakraProvider resetCSS theme={theme}>
				{children}
			</ChakraProvider>
		</RecoilRoot>
	);
}
