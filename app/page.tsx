"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Bot, Loader2, Code } from "lucide-react";
import { useStytch, useStytchUser, StytchLogin, Products } from "@stytch/nextjs";
import { useCrossmint } from "@crossmint/client-sdk-react-ui";
import type { PaymentMethodResponse, AgentResponse, OrderIntentResponse } from "@/lib/crossmint-types";
import { fetchAllData, createNewAgent, removePaymentMethod } from "@/lib/crossmint-api";
import { SavedCardsList } from "@/components/saved-cards-list";
import { SaveCardSection } from "@/components/save-card-section";
import { IssueVirtualCard } from "@/components/issue-virtual-card";
import { OrderIntentsList } from "@/components/order-intents-list";

// ─── Stytch login config ─────────────────────────────────────────────────────
// Configures Google OAuth as the authentication method in the Stytch login UI.
// The redirect URL must match the one registered in your Stytch dashboard:
// https://stytch.com/dashboard/redirect-urls

const loginConfig = {
  products: [Products.oauth],
  oauthOptions: {
    providers: [{ type: "google" as const }],
    loginRedirectURL: "http://localhost:3000",
    signupRedirectURL: "http://localhost:3000",
  },
};

// ─── Token authentication hook ───────────────────────────────────────────────
// After Stytch redirects back with a token in the URL (e.g. ?token=...&stytch_token_type=oauth),
// this hook exchanges it for a session. The token is consumed once and the URL is cleaned up.

function useStytchTokenAuth() {
  const stytch = useStytch();
  const { user } = useStytchUser();

  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const tokenType = params.get("stytch_token_type");

    if (!token || tokenType !== "oauth" || user) return;

    setAuthenticating(true);

    const authenticate = async () => {
      try {
        await stytch.oauth.authenticate(token, { session_duration_minutes: 60 });
        window.history.replaceState({}, "", "/");
      } catch (err) {
        console.error("Stytch OAuth authentication failed:", err);
      }
      setAuthenticating(false);
    };
    authenticate();
  }, [stytch, user]);

  return { authenticating };
}

// ─── Page ────────────────────────────────────────────────────────────────────
// Entry point: shows a loading spinner while authenticating, the Stytch login
// form if unauthenticated, or the main dashboard if logged in.

export default function Page() {
  const { user } = useStytchUser();
  const { authenticating } = useStytchTokenAuth();

  if (authenticating) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-white">
        <Loader2 className="size-5 animate-spin text-[#00C768]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-white px-4">
          <StytchLogin config={loginConfig} />
      </div>
    );
  }

  return <AuthenticatedApp />;
}

// ─── Authenticated app ───────────────────────────────────────────────────────
// Main dashboard shown after login. The flow is:
//
//   1. Bridge Stytch JWT to Crossmint (so Crossmint SDK can authenticate requests)
//   2. Fetch existing agents, saved cards, and order intents
//   3. Create an agent if none exists (required before issuing virtual cards)
//   4. Save a card + complete agentic enrollment (passkey verification)
//   5. Issue a virtual card (order intent) with spending mandates
//   6. View issued virtual cards and fetch their credentials

function AuthenticatedApp() {
  const stytch = useStytch();
  const { user } = useStytchUser();
  const { setJwt } = useCrossmint();

  const getJwt = () => stytch.session.getTokens()?.session_jwt ?? "";
  const userEmail = user?.emails?.[0]?.email ?? "";

  // Bridge Stytch session JWT to Crossmint so the SDK can authenticate API requests
  useEffect(() => {
    const tokens = stytch.session.getTokens();
    if (tokens?.session_jwt) {
      setJwt(tokens.session_jwt);
    }
  }, [stytch, user]);

  const [agent, setAgent] = useState<AgentResponse | null>(null);
  const [savedCards, setSavedCards] = useState<PaymentMethodResponse[]>([]);
  const [orderIntents, setOrderIntents] = useState<OrderIntentResponse[]>([]);
  const [showSaveCard, setShowSaveCard] = useState(false);
  const [issuingForCard, setIssuingForCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [showAgentRaw, setShowAgentRaw] = useState(false);

  // Load all user data on mount: saved cards, agents, and issued virtual cards.
  // Uses a single server action to fetch everything in parallel on the server,
  // avoiding Next.js's sequential serialization of concurrent server action calls.
  const fetchData = useCallback(async () => {
    try {
      const jwt = getJwt();
      if (!jwt) return;

      const { cards, agents, orderIntents } = await fetchAllData(jwt);

      setSavedCards(cards);
      setOrderIntents(orderIntents);
      if (agents.length > 0) setAgent(agents[0]);
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create a new agent — required before any virtual cards can be issued
  const handleCreateAgent = async () => {
    setCreatingAgent(true);
    try {
      const result = await createNewAgent(getJwt(), "Virtual Card Agent", "Default agent for virtual card issuance");
      setAgent(result);
    } catch (err) {
      console.error("Failed to create agent:", err);
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleCardSaved = () => {
    setShowSaveCard(false);
    fetchData();
  };

  const handleDeleteCard = async (paymentMethodId: string) => {
    await removePaymentMethod(getJwt(), paymentMethodId);
    fetchData();
  };

  const handleCardIssued = () => {
    setIssuingForCard(null);
    fetchData();
  };

  return (
    <div className="flex flex-col h-dvh bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5F6B7A]">{userEmail}</span>
            <button
              onClick={() => stytch.session.revoke()}
              className="text-xs text-[#5F6B7A] hover:text-red-500 transition-colors"
            >
              Log out
            </button>
          </div>

          {/* ── Step 1: Agent ─────────────────────────────────────────────── */}
          {/* An agent must exist before virtual cards can be issued.         */}
          <section>
            <h2 className="text-sm font-semibold text-[#0A1825] mb-3">Agent</h2>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[#5F6B7A] py-4">
                <Loader2 className="size-4 animate-spin text-[#00C768]" />
                <span>Loading...</span>
              </div>
            ) : agent ? (
              <div>
                <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Bot className="size-5 text-[#00C768]" />
                    <div>
                      <div className="text-sm font-medium text-[#0A1825]">{agent.metadata.name}</div>
                      <div className="text-xs text-[#5F6B7A] font-mono">{agent.agentId}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAgentRaw(!showAgentRaw)}
                    className="text-[#5F6B7A] hover:text-[#0A1825] transition-colors p-1.5 rounded-md hover:bg-[#E5E7EB]/50"
                    title="Raw data"
                  >
                    <Code className="size-3.5" />
                  </button>
                </div>
                {showAgentRaw && (
                  <pre className="mt-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] p-3 text-xs font-mono text-[#0A1825] overflow-auto max-h-96">
                    {JSON.stringify(agent, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#F9FAFA] p-4 text-center">
                <p className="text-sm text-[#5F6B7A] mb-3">
                  Create an agent to start issuing virtual cards.
                </p>
                <button
                  onClick={handleCreateAgent}
                  disabled={creatingAgent}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#00C768] hover:bg-[#05CE6C] disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
                >
                  {creatingAgent ? <Loader2 className="size-3.5 animate-spin" /> : <Bot className="size-3.5" />}
                  <span>{creatingAgent ? "Creating..." : "Create agent"}</span>
                </button>
              </div>
            )}
          </section>

          {/* ── Step 2: Save a payment method ─────────────────────────────── */}
          {/* User adds a physical card via Crossmint's embedded UI, then     */}
          {/* completes agentic enrollment (passkey) to authorize the agent.   */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0A1825]">Saved Cards</h2>
              <button
                onClick={() => setShowSaveCard(true)}
                className="flex items-center gap-1.5 text-xs text-[#00C768] hover:text-[#05CE6C] transition-colors px-2.5 py-1.5 rounded-md hover:bg-[#E8F9EF] border border-[#00C768]/30"
              >
                <Plus className="size-3.5" />
                <span>Add card</span>
              </button>
            </div>

            {showSaveCard && (
              <div className="mb-4">
                <SaveCardSection
                  jwt={getJwt()}
                  email={userEmail}
                  onCardSaved={handleCardSaved}
                  onCancel={() => setShowSaveCard(false)}
                />
              </div>
            )}

            <SavedCardsList
              cards={savedCards}
              loading={loading}
              canIssue={!!agent}
              onIssueVirtualCard={(paymentMethodId) => setIssuingForCard(paymentMethodId)}
              onDeleteCard={handleDeleteCard}
            />
          </section>

          {/* ── Step 3: Issue a virtual card ──────────────────────────────── */}
          {/* Creates an order intent with spending mandates (max amount,     */}
          {/* description). Requires passkey verification before activation.  */}
          {issuingForCard && agent && (
            <section>
              <h2 className="text-sm font-semibold text-[#0A1825] mb-4">Issue Virtual Card</h2>
              <IssueVirtualCard
                agentId={agent.agentId}
                paymentMethodId={issuingForCard}
                email={userEmail}
                getJwt={getJwt}
                onCardIssued={handleCardIssued}
                onCancel={() => setIssuingForCard(null)}
              />
            </section>
          )}

          {/* ── Step 4: View issued virtual cards ────────────────────────── */}
          {/* Lists all order intents. Active ones can fetch card credentials */}
          {/* (card number, expiration, CVC) for use at a merchant.          */}
          <section>
            <h2 className="text-sm font-semibold text-[#0A1825] mb-3">Virtual Cards</h2>
            <OrderIntentsList orderIntents={orderIntents} loading={loading} getJwt={getJwt} />
          </section>
        </div>
      </div>
    </div>
  );
}
