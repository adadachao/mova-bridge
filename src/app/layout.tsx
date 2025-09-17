import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import StyledComponentsRegistry from "./StyledComponentsRegistry";
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Mova Bridge",
	description: "Mova Bridge",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full">
			<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen h-full text-white`}>
				<StyledComponentsRegistry>
					<Providers>
						<Toaster position="top-right" />
						<div className="mx-auto max-w-7xl">
							<Navbar />
							{children}
						</div>
					</Providers>
				</StyledComponentsRegistry>
			</body>
		</html>
	);
}
