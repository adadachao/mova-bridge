"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode, useMemo } from "react";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from "./theme";

// 自定义链：HOLE Test(6174) 与 Mova Dev(8891)
// const HOLE_TEST = {
// 	id: 6174,
// 	name: 'HOLE Test',
// 	network: 'hole-test',
// 	nativeCurrency: {
// 		decimals: 18,
// 		name: 'HOLE',
// 		symbol: 'HOLE',
// 	},
// 	rpcUrls: {
// 		public: { http: ['https://rpc.hole.bitheart.org'] },
// 		default: { http: ['https://rpc.hole.bitheart.org'] },
// 	},
// 	blockExplorers: {
// 		default: { name: 'HoleScan', url: 'https://holescan.bitheart.org/' },
// 	},
// } as const;

// const MOVA_DEV = {
// 	id: 8891,
// 	name: 'Mova Dev',
// 	network: 'mova-dev',
// 	nativeCurrency: {
// 		decimals: 18,
// 		name: 'MOVA',
// 		symbol: 'MOVA',
// 	},
// 	rpcUrls: {
// 		public: { http: ['https://rpc.mova.bitheart.org'] },
// 		default: { http: ['https://rpc.mova.bitheart.org'] },
// 	},
// 	blockExplorers: {
// 		default: { name: 'MovaScan', url: 'https://scan.mova.bitheart.org' },
// 	},
// } as const;

// 自定义链：BSC Testnet 与 Mova Beta
const BSC_TESTNET = {
	id: 97,
	name: 'BSC Testnet',
	network: 'bsc-testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'Binance Testnet',
		symbol: 'tBNB',
	},
	rpcUrls: {
		public: { http: ['https://bsc-testnet.publicnode.com'] },
		default: { http: ['https://bsc-testnet.publicnode.com'] },
	},
	blockExplorers: {
		default: { name: 'BscScan', url: 'https://testnet.bscscan.com' },
	},
} as const;

const MOVA_BETA = {
	id: 10323,
	name: 'Mova Beta',
	network: 'mova-beta',
	nativeCurrency: {
		decimals: 18,
		name: 'MARS Testnet GasCoin',
		symbol: 'MARS',
	},
	iconUrl: '/images/mars-logo.png',
	rpcUrls: {
		public: { http: ['https://mars.rpc.movachain.com'] },
		default: { http: ['https://mars.rpc.movachain.com'] },
	},
	blockExplorers: {
		default: { name: 'MovaScan', url: 'https://mars.scan.movachain.com' },
	},
} as const;

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo";

const wagmiConfig = getDefaultConfig({
	appName: "MarsBoss",
	projectId,
	chains: [BSC_TESTNET, MOVA_BETA],
	ssr: true,
});

// 自定义 RainbowKit 主题
const customTheme = darkTheme({
	accentColor: '#C1FF72', // 绿色主题色
	accentColorForeground: '#231F20', // 深色文字
	borderRadius: 'large',
	fontStack: 'system',
	overlayBlur: 'small',
});

export function Providers({ children }: { children: ReactNode }) {
	const queryClient = useMemo(() => new QueryClient(), []);
	return (
		<ThemeProvider>
			<FixedGlobalStyle />
			<ThemedGlobalStyle />
			<WagmiProvider config={wagmiConfig}>
				<QueryClientProvider client={queryClient}>
					<RainbowKitProvider 
						theme={customTheme} 
						modalSize="compact"
						locale="en-US"
					>
						{children}
					</RainbowKitProvider>
				</QueryClientProvider>
			</WagmiProvider>
		</ThemeProvider>
	);
} 