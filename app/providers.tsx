"use client";

import { createStytchClient, StytchProvider } from "@stytch/nextjs";
import {
  CrossmintProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";

const stytch = createStytchClient(
  process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StytchProvider stytch={stytch}>
      <CrossmintProvider apiKey={process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY!}>
        <CrossmintWalletProvider>
          {children}
        </CrossmintWalletProvider>
      </CrossmintProvider>
    </StytchProvider>
  );
}
