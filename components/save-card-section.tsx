"use client";

// Save a payment method and complete agentic enrollment.
//
// Flow:
//   1. "saving" — Crossmint's embedded UI collects card details
//   2. "checking-enrollment" — Check if the card is already enrolled for agentic payments
//   3. "verifying-enrollment" — User completes passkey verification to authorize the agent
//
// After enrollment is active, the card can be used to issue virtual cards.

import { useState, useRef } from "react";
import { Wallet, X, Loader2, ShieldCheck, Check } from "lucide-react";
import {
  CrossmintPaymentMethodManagement,
  PaymentMethodAgenticEnrollmentVerification,
} from "@crossmint/client-sdk-react-ui";
import type { AgenticEnrollmentResponse } from "@/lib/crossmint-types";
import { checkEnrollment, enrollPaymentMethod } from "@/lib/crossmint-api";
import { verificationAppearance } from "@/lib/verification-appearance";

type Phase = "saving" | "checking-enrollment" | "verifying-enrollment";

export function SaveCardSection({
  jwt,
  email,
  onCardSaved,
  onCancel,
}: {
  jwt: string;
  email: string;
  onCardSaved: (paymentMethodId: string) => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("saving");
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<AgenticEnrollmentResponse | null>(null);
  const completedRef = useRef(false);

  const complete = (paymentMethodId: string) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCardSaved(paymentMethodId);
  };

  // Called when the user saves a card through Crossmint's embedded UI.
  // Immediately checks enrollment status and initiates enrollment if needed.
  const handlePaymentMethodSelected = async (paymentMethod: { paymentMethodId: string }) => {
    const pmId = paymentMethod.paymentMethodId;
    setSavedPaymentMethodId(pmId);
    setPhase("checking-enrollment");

    try {
      let enrollmentRes = await checkEnrollment(jwt, pmId);

      // If not enrolled yet, start enrollment
      if (enrollmentRes.status === "not_started") {
        enrollmentRes = await enrollPaymentMethod(jwt, pmId, email);
      }

      setEnrollment(enrollmentRes);

      if (enrollmentRes.status === "active") {
        // Already enrolled — done
        complete(pmId);
      } else if (enrollmentRes.status === "pending") {
        // Needs passkey verification
        setPhase("verifying-enrollment");
      }
    } catch (err) {
      console.error("Agentic enrollment failed:", err);
      complete(pmId);
    }
  };

  // Passkey verification UI for completing agentic enrollment
  if (phase === "verifying-enrollment" && enrollment && enrollment.status === "pending") {
    return (
      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden bg-white">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] bg-[#E8F9EF]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-[#00C768]" />
            <span className="text-xs font-medium text-[#0A1825]">Complete card enrollment</span>
          </div>
          <button onClick={onCancel} className="text-[#5F6B7A] hover:text-[#0A1825]">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-[#5F6B7A] mb-3">
            <Loader2 className="size-4 animate-spin text-[#00C768]" />
            <span>Complete passkey verification to enable agentic payments...</span>
          </div>
          <PaymentMethodAgenticEnrollmentVerification
            paymentMethodAgenticEnrollment={enrollment}
            appearance={verificationAppearance}
            onVerificationComplete={() => {
              if (savedPaymentMethodId) complete(savedPaymentMethodId);
            }}
            onVerificationError={() => {
              if (savedPaymentMethodId) complete(savedPaymentMethodId);
            }}
          />
        </div>
      </div>
    );
  }

  // Card saving UI (Crossmint embedded component) + checking-enrollment loading state
  return (
    <div className="rounded-lg border border-[#E5E7EB] overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] bg-[#E8F9EF]">
        <div className="flex items-center gap-2">
          {phase === "checking-enrollment" ? (
            <>
              <Check className="size-3.5 text-[#00C768]" />
              <span className="text-xs font-medium text-[#0A1825]">Card saved</span>
            </>
          ) : (
            <>
              <Wallet className="size-3.5 text-[#00C768]" />
              <span className="text-xs font-medium text-[#0A1825]">Save a new card</span>
            </>
          )}
        </div>
        <button onClick={onCancel} className="text-[#5F6B7A] hover:text-[#0A1825]">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="p-4">
        <div className={phase === "checking-enrollment" ? "h-0 overflow-hidden" : undefined}>
          <CrossmintPaymentMethodManagement
            jwt={jwt}
            onPaymentMethodSelected={handlePaymentMethodSelected}
          />
        </div>
        {phase === "checking-enrollment" && (
          <div className="flex items-center gap-2 text-sm text-[#5F6B7A]">
            <Loader2 className="size-4 animate-spin text-[#00C768]" />
            <span>Setting up agentic enrollment...</span>
          </div>
        )}
      </div>
    </div>
  );
}
