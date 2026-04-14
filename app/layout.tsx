"use client";

import { Geist } from "next/font/google"

import "./globals.css"
import { createStytchClient, StytchProvider } from "@stytch/nextjs";
import {
  CrossmintProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const stytch = createStytchClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!
);

/**
 * Root layout — wraps the entire app with two providers:
 *
 * 1. StytchProvider — handles user authentication (Google OAuth)
 * 2. CrossmintProvider + CrossmintWalletProvider — provides the Crossmint SDK context
 *    for payment method management and virtual card issuance.
 *
 * The Stytch session JWT is bridged to Crossmint in the AuthenticatedApp component
 * (see page.tsx) via `useCrossmint().setJwt()`.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`antialiased font-sans ${geist.variable}`}>
      <head>
        <title>Virtual Cards Quickstart</title>
      </head>
      <body>
        <StytchProvider stytch={stytch}>
          <CrossmintProvider apiKey={process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY!}>
            <CrossmintWalletProvider>
              {children}
            </CrossmintWalletProvider>
          </CrossmintProvider>
        </StytchProvider>
      </body>
    </html>
  )
}
