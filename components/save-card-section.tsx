"use client";

// Save a payment method via Crossmint's embedded tokenization UI.
//
// Saving ≠ enrolling. This component only tokenizes the card. Agentic
// enrollment is a separate, explicit step triggered from the card row
// (see SavedCardsList → "Enroll Card" button).

import { Wallet, X } from "lucide-react";
import { CrossmintPaymentMethodManagement } from "@crossmint/client-sdk-react-ui";

export function SaveCardSection({
  jwt,
  onCardSaved,
  onCancel,
}: {
  jwt: string;
  onCardSaved: (paymentMethodId: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] bg-[#E8F9EF]">
        <div className="flex items-center gap-2">
          <Wallet className="size-3.5 text-[#00C768]" />
          <span className="text-xs font-medium text-[#0A1825]">Save a new card</span>
        </div>
        <button onClick={onCancel} className="text-[#5F6B7A] hover:text-[#0A1825]">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="p-4">
        <CrossmintPaymentMethodManagement
          jwt={jwt}
          onPaymentMethodSelected={(pm) => onCardSaved(pm.paymentMethodId)}
        />
      </div>
    </div>
  );
}
