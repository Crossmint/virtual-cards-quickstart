"use client";

// Displays the user's saved payment methods.
// Each card shows brand, last 4 digits, and actions to inspect raw data,
// issue a virtual card, or delete the payment method.

import { useState } from "react";
import { CreditCard, Loader2, Trash2, Code } from "lucide-react";
import type { PaymentMethodResponse } from "@/lib/crossmint-types";

export function SavedCardsList({
  cards,
  loading,
  canIssue,
  onIssueVirtualCard,
  onDeleteCard,
}: {
  cards: PaymentMethodResponse[];
  loading: boolean;
  canIssue: boolean;
  onIssueVirtualCard: (paymentMethodId: string) => void;
  onDeleteCard: (paymentMethodId: string) => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#5F6B7A] py-4">
        <Loader2 className="size-4 animate-spin text-[#00C768]" />
        <span>Loading...</span>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-sm text-[#5F6B7A] py-8 text-center">
        No saved cards yet. Add a card to get started.
      </div>
    );
  }

  const handleDelete = async (paymentMethodId: string) => {
    setDeletingId(paymentMethodId);
    try {
      await onDeleteCard(paymentMethodId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
        {cards.map((card) => (
          <div key={card.paymentMethodId}>
            <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] px-4 py-3">
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-[#5F6B7A]" />
                <div>
                  <div className="text-sm font-medium text-[#0A1825]">
                    {card.card?.brand ?? "Card"} •••• {card.card?.last4 ?? "????"}
                  </div>
                  <div className="text-xs text-[#5F6B7A] font-mono">{card.paymentMethodId}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === card.paymentMethodId ? null : card.paymentMethodId)}
                  className="text-[#5F6B7A] hover:text-[#0A1825] transition-colors p-1.5 rounded-md hover:bg-[#E5E7EB]/50"
                  title="Raw data"
                >
                  <Code className="size-3.5" />
                </button>
                <button
                  onClick={() => onIssueVirtualCard(card.paymentMethodId)}
                  disabled={!canIssue}
                  className="text-xs px-3 py-1.5 rounded-md border text-[#00C768] border-[#00C768]/30 hover:bg-[#E8F9EF] disabled:text-[#9CA3AF] disabled:border-[#E5E7EB] disabled:cursor-not-allowed transition-colors"
                >
                  Issue virtual card
                </button>
                <button
                  onClick={() => handleDelete(card.paymentMethodId)}
                  disabled={deletingId === card.paymentMethodId}
                  className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                >
                  {deletingId === card.paymentMethodId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
            {expandedId === card.paymentMethodId && (
              <pre className="mt-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] p-3 text-xs font-mono text-[#0A1825] overflow-auto max-h-96">
                {JSON.stringify(card, null, 2)}
              </pre>
            )}
          </div>
        ))}
    </div>
  );
}
