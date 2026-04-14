"use client";

// Displays issued virtual cards (order intents).
// Each item shows the description, max amount, phase (active/expired/requires-verification),
// and allows fetching card credentials for active intents.

import { useState } from "react";
import { Loader2, CreditCard, Code } from "lucide-react";
import type { OrderIntentResponse, CardCredentials } from "@/lib/crossmint-types";
import { fetchCardCredentials } from "@/lib/crossmint-api";

function OrderIntentItem({ oi, getJwt }: { oi: OrderIntentResponse; getJwt: () => string }) {
  const [credentials, setCredentials] = useState<CardCredentials | null>(null);
  const [fetchingCreds, setFetchingCreds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Fetch virtual card credentials (card number, expiration, CVC) for an active order intent
  const handleFetchCredentials = async () => {
    setFetchingCreds(true);
    setError(null);
    try {
      const creds = await fetchCardCredentials(getJwt(), oi.orderIntentId, {
        name: "Test Merchant",
        url: "https://example.com",
        countryCode: "US",
      });
      setCredentials(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch credentials");
    } finally {
      setFetchingCreds(false);
    }
  };

  // Extract mandate values for display
  const description = oi.mandates.find((m) => m.type === "description") as { value: string } | undefined;
  const maxAmount = oi.mandates.find((m) => m.type === "maxAmount") as { value: string; details: { currency: string } } | undefined;

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] px-4 py-3">
        <div className="flex items-center gap-3">
          <CreditCard className="size-5 text-[#5F6B7A]" />
          <div>
            <div className="text-sm font-medium text-[#0A1825]">
              {description?.value ?? "Virtual Card"}
              {maxAmount && (
                <span className="ml-2 text-[#5F6B7A]">
                  {maxAmount.value} {maxAmount.details.currency.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-xs text-[#5F6B7A] font-mono">{oi.orderIntentId}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-[#5F6B7A] hover:text-[#0A1825] transition-colors p-1.5 rounded-md hover:bg-[#E5E7EB]/50"
            title="Raw data"
          >
            <Code className="size-3.5" />
          </button>
          {oi.phase === "active" && (
            credentials ? (
              <span className="text-xs font-mono text-[#5F6B7A]">
                •••• {credentials.card.number.slice(-4)} | {credentials.card.expirationMonth}/{credentials.card.expirationYear}
              </span>
            ) : (
              <button
                onClick={handleFetchCredentials}
                disabled={fetchingCreds}
                className="text-xs px-3 py-1.5 rounded-md border text-[#00C768] border-[#00C768]/30 hover:bg-[#E8F9EF] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
              >
                {fetchingCreds && <Loader2 className="size-3 animate-spin" />}
                {fetchingCreds ? "Fetching..." : "Fetch credentials"}
              </button>
            )
          )}
          <span
            className={`text-xs font-medium ${
              oi.phase === "active" ? "text-[#00C768]" : oi.phase === "expired" ? "text-red-500" : "text-amber-600"
            }`}
          >
            {oi.phase}
          </span>
        </div>
      </div>

      {error && <div className="text-xs text-red-500 px-4">{error}</div>}
      {/* Show raw API response data (order intent or credentials if fetched) */}
      {showRaw && (
        <pre className="mt-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] p-3 text-xs font-mono text-[#0A1825] overflow-auto max-h-96">
          {JSON.stringify(credentials ?? oi, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function OrderIntentsList({
  orderIntents,
  loading,
  getJwt,
}: {
  orderIntents: OrderIntentResponse[];
  loading: boolean;
  getJwt: () => string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#5F6B7A] py-4">
        <Loader2 className="size-4 animate-spin text-[#00C768]" />
        <span>Loading...</span>
      </div>
    );
  }

  if (orderIntents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#F9FAFA] p-4 text-center">
        <p className="text-sm text-[#5F6B7A]">
          No virtual cards yet. Issue one from a saved card above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orderIntents.map((oi) => (
        <OrderIntentItem key={oi.orderIntentId} oi={oi} getJwt={getJwt} />
      ))}
    </div>
  );
}
