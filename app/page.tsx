"use client";

// Dashboard shown after login. Redirects to /login if not authenticated.
//
//   1. Bridge Stytch JWT to Crossmint (so Crossmint SDK can authenticate requests)
//   2. Fetch existing agents, saved cards, and order intents
//   3. Create an agent if none exists (required before issuing virtual cards)
//   4. Save a card + complete agentic enrollment (passkey verification)
//   5. Issue a virtual card (order intent) with spending mandates
//   6. View issued virtual cards and fetch their credentials

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { useStytch, useStytchUser } from "@stytch/nextjs";
import { useCrossmint } from "@crossmint/client-sdk-react-ui";
import type { PaymentMethodResponse, AgentResponse, OrderIntentResponse } from "@/lib/crossmint-types";
import { fetchAllData, createNewAgent, deleteAgent, removePaymentMethod } from "@/lib/crossmint-api";
import { SavedCardsList } from "@/components/saved-cards-list";
import { SaveCardSection } from "@/components/save-card-section";
import { IssueVirtualCard } from "@/components/issue-virtual-card";
import { OrderIntentsList } from "@/components/order-intents-list";
import { AgentSection } from "@/components/agent-section";
import { PoweredByCrossmint } from "@/components/powered-by-crossmint";

export default function Page() {
  const stytch = useStytch();
  const { user } = useStytchUser();
  const { setJwt } = useCrossmint();
  const router = useRouter();

  const userEmail = user?.emails?.[0]?.email ?? "";
  const getJwt = () => stytch.session.getTokens()?.session_jwt ?? "";

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  // Bridge Stytch session JWT to Crossmint so the SDK can authenticate API requests
  useEffect(() => {
    const tokens = stytch.session.getTokens();
    if (tokens?.session_jwt) setJwt(tokens.session_jwt);
  }, [stytch, user, setJwt]);

  const [agent, setAgent] = useState<AgentResponse | null>(null);
  const [savedCards, setSavedCards] = useState<PaymentMethodResponse[]>([]);
  const [orderIntents, setOrderIntents] = useState<OrderIntentResponse[]>([]);
  const [showSaveCard, setShowSaveCard] = useState(false);
  const [issuingForCard, setIssuingForCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState(false);

  const fetchData = useCallback(async () => {
    const jwt = stytch.session.getTokens()?.session_jwt ?? "";
    if (!jwt) return;
    try {
      const { cards, agents, orderIntents } = await fetchAllData(jwt);
      setSavedCards(cards);
      setOrderIntents(orderIntents);
      if (agents.length > 0) setAgent(agents[0]);
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
    } finally {
      setLoading(false);
    }
  }, [stytch]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleCreateAgent = async () => {
    setCreatingAgent(true);
    try {
      const result = await createNewAgent(getJwt(), "Virtual Card Agent", "Default agent for virtual card issuance");
      setAgent(result);
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!agent) return;
    setDeletingAgent(true);
    try {
      await deleteAgent(getJwt(), agent.agentId);
      setAgent(null);
    } finally {
      setDeletingAgent(false);
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-white">
        <Loader2 className="size-5 animate-spin text-[#00C768]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pt-8 pb-8 space-y-12">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5F6B7A]">{userEmail}</span>
            <button
              onClick={() => stytch.session.revoke()}
              className="text-xs text-[#5F6B7A] hover:text-red-500 transition-colors"
            >
              Log out
            </button>
          </div>

          <AgentSection
            agent={agent}
            loading={loading}
            creating={creatingAgent}
            deleting={deletingAgent}
            onCreate={handleCreateAgent}
            onDelete={handleDeleteAgent}
          />

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
              <div className="mb-4 space-y-3">
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] px-3 py-2 text-xs text-[#5F6B7A]">
                  Use test card <span className="font-mono text-[#0A1825]">4242 4242 4242 4242</span>
                </div>
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

          <section>
            <h2 className="text-sm font-semibold text-[#0A1825] mb-3">Virtual Cards</h2>
            <OrderIntentsList orderIntents={orderIntents} loading={loading} getJwt={getJwt} />
          </section>

          <div className="flex justify-center pt-4">
            <PoweredByCrossmint />
          </div>
        </div>
      </div>
    </div>
  );
}
