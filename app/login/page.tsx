"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  useStytch,
  useStytchUser,
  StytchLogin,
  Products,
} from "@stytch/nextjs";
import { PoweredByCrossmint } from "@/components/powered-by-crossmint";

// Stytch login config — Google OAuth. The redirect URL must match the one
// registered in your Stytch dashboard: https://stytch.com/dashboard/redirect-urls
// Derived from window.location.origin so it works on localhost, Vercel previews,
// production, and custom domains without env vars.
const redirectUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/login`
    : "/login";

const loginConfig = {
  products: [Products.oauth],
  oauthOptions: {
    providers: [{ type: "google" as const }],
    loginRedirectURL: redirectUrl,
    signupRedirectURL: redirectUrl,
  },
};

const loginPresentation = {
  theme: { "container-border": "transparent" },
};

// After Stytch redirects back with ?token=...&stytch_token_type=oauth,
// exchange the token for a session and clean up the URL.
function useStytchTokenAuth() {
  const stytch = useStytch();
  const { user } = useStytchUser();

  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("stytch_token_type") === "oauth"
      ? params.get("token")
      : null;
  });

  useEffect(() => {
    if (!token || user) return;
    stytch.oauth
      .authenticate(token, { session_duration_minutes: 60 })
      .catch((err) => console.error("Stytch OAuth authentication failed:", err))
      .finally(() => window.history.replaceState({}, "", "/login"));
  }, [token, stytch, user]);

  return !!token && !user;
}

export default function LoginPage() {
  const { user } = useStytchUser();
  const authenticating = useStytchTokenAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  if (authenticating || user) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-white">
        <Loader2 className="size-5 animate-spin text-[#00C768]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-white px-4">
      <div className="flex flex-col items-center gap-2">
        <StytchLogin config={loginConfig} presentation={loginPresentation} />
        <PoweredByCrossmint />
      </div>
    </div>
  );
}
