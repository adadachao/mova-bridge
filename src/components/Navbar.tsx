"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
	return (
		<header className="w-full flex items-top justify-between py-6 px-6 sm:py-2 sm:px-10 sm:items-center">
			<Link href="/">
				<Image src="/mova-logo.svg" alt="Mova" className="w-[110px] h-[30px] lg:w-[197px] lg:h-[72px] hidden sm:block" width={197} height={72} />
				<Image src="/mova-logo-mobile.svg" alt="Mova" className="w-[42px] h-[42px] block sm:hidden" width={42} height={20} />
			</Link>
			<nav className="flex items-end sm:items-center flex-col sm:flex-row gap-2 sm:gap-6">
				<a
					href="https://app.movachain.com/#/faucet"
					target="_blank"
					rel="noreferrer"
					className="text-md text-[#C1FF72] hover:text-white transition-colors font-bold"
				>
					Mova Faucet
				</a>
				<div className="scale-95 sm:scale-100">
					<ConnectButton />
				</div>
			</nav>
		</header>
	);
} 