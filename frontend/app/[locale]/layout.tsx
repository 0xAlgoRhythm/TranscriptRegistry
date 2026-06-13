import type { Metadata } from "next"
import { Cormorant_Garamond, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Web3Provider } from "@/components/providers/web3-provider"
import { SplashScreen } from "@/components/ui/splash-screen"
import { CookieBanner } from "@/components/app/cookie-banner"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css"

const displayFont = Cormorant_Garamond({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
})

const sansFont = Plus_Jakarta_Sans({
	variable: "--font-sans",
	subsets: ["latin"],
	display: "swap",
})

const monoFont = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	weight: ["400", "500"],
	display: "swap",
})

export const metadata: Metadata = {
	metadataBase: new URL('https://credaxis.app'),
	title: {
		default: "CredAxis — Blockchain Academic Credentials",
		template: "%s | CredAxis",
	},
	description:
		"Issue, manage, and verify academic transcripts on the blockchain. Secure, instant, student-controlled.",
	keywords: ["academic credentials", "blockchain transcripts", "student records", "web3 education", "decentralized identity", "university records"],
	authors: [{ name: "CredAxis Team" }],
	creator: "CredAxis",
	publisher: "CredAxis",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	alternates: {
		canonical: "/",
		languages: {
			'en': '/en',
			'es': '/es',
		},
	},
	openGraph: {
		title: "CredAxis — Blockchain Academic Credentials",
		description:
			"Issue, manage, and verify academic transcripts on the blockchain.",
		siteName: "CredAxis",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "CredAxis — Blockchain Academic Credentials",
		description:
			"Issue, manage, and verify academic transcripts on the blockchain.",
	},
}

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	// Await params since it is an asynchronous context in Next.js 15+
	const { locale } = await params;

	// Providing all messages to the client
	// side is the easiest way to get started
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body
				className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} font-sans antialiased`}
			>
				<NextIntlClientProvider messages={messages}>
					<Web3Provider>
						<SplashScreen>{children}</SplashScreen>
					</Web3Provider>
					<CookieBanner />
				</NextIntlClientProvider>
				<Analytics />
			</body>
		</html>
	)
}

