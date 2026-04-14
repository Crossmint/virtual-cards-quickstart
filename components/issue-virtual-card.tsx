"use client";

// Issue a virtual card (order intent) against a saved payment method.
//
// Flow:
//   1. "form" — User fills in merchant details and spending limits
//   2. "checking-enrollment" — Verify the card is enrolled for agentic payments
//   3. "enrollment-verification" — If not enrolled, complete passkey verification
//   4. "creating" — Create the order intent with mandates (spending rules)
//   5. "order-verification" — User authorizes spending via passkey
//   6. "fetching-credentials" — Retrieve the virtual card credentials
//   7. "done" — Virtual card issued successfully

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import type { OrderIntentResponse, AgenticEnrollmentResponse } from "@/lib/crossmint-types";
import { checkEnrollment, enrollPaymentMethod, createNewOrderIntent, fetchCardCredentials } from "@/lib/crossmint-api";
import {
  OrderIntentVerification,
  PaymentMethodAgenticEnrollmentVerification,
} from "@crossmint/client-sdk-react-ui";

type Step =
  | "form"
  | "checking-enrollment"
  | "enrollment-verification"
  | "creating"
  | "order-verification"
  | "fetching-credentials"
  | "done"
  | "error";

export function IssueVirtualCard({
  agentId,
  paymentMethodId,
  email,
  getJwt,
  onCardIssued,
  onCancel,
}: {
  agentId: string;
  paymentMethodId: string;
  email: string;
  getJwt: () => string;
  onCardIssued: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [orderIntent, setOrderIntent] = useState<OrderIntentResponse | null>(null);
  const [enrollment, setEnrollment] = useState<AgenticEnrollmentResponse | null>(null);

  // Form fields for the order intent
  const [merchantName, setMerchantName] = useState("");
  const [merchantUrl, setMerchantUrl] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const jwt = getJwt();

      // First, ensure the card is enrolled for agentic payments
      setStep("checking-enrollment");
      let enrollmentRes = await checkEnrollment(jwt, paymentMethodId);

      if (enrollmentRes.status === "not_started") {
        enrollmentRes = await enrollPaymentMethod(jwt, paymentMethodId, email);
      }

      setEnrollment(enrollmentRes);

      if (enrollmentRes.status === "pending") {
        // Needs passkey verification before we can proceed
        setStep("enrollment-verification");
        return;
      }

      // Enrollment is active — create the order intent
      await createOrderIntentAndContinue(jwt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check enrollment");
      setStep("error");
    }
  };

  // Create the order intent with mandates and handle verification if needed
  const createOrderIntentAndContinue = async (jwt?: string) => {
    setStep("creating");
    try {
      const token = jwt ?? getJwt();
      const intent = await createNewOrderIntent(token, agentId, paymentMethodId, [
        { type: "maxAmount", value: maxAmount, details: { currency: "usd", period: "transaction" } },
        { type: "description", value: description || `Purchase from ${merchantName}` },
      ]);

      setOrderIntent(intent);

      if (intent.phase === "requires-verification") {
        // User must authorize the spending via passkey
        setStep("order-verification");
      } else {
        // Already active — fetch credentials
        await getCredentials(intent.orderIntentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create virtual card");
      setStep("error");
    }
  };

  // Fetch the virtual card credentials (card number, expiration, CVC)
  const getCredentials = async (orderIntentId: string) => {
    setStep("fetching-credentials");
    try {
      await fetchCardCredentials(getJwt(), orderIntentId, {
        name: merchantName,
        url: merchantUrl,
        countryCode: "US",
      });
      onCardIssued();
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get credentials");
      setStep("error");
    }
  };

  // ── Step 1: Form ──────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-[#5F6B7A] block mb-1">Merchant name</label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g. Whole Foods"
              required
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#00C768] focus:ring-1 focus:ring-[#00C768]/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#5F6B7A] block mb-1">Merchant URL</label>
            <input
              type="url"
              value={merchantUrl}
              onChange={(e) => setMerchantUrl(e.target.value)}
              placeholder="e.g. https://www.wholefoodsmarket.com"
              required
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#00C768] focus:ring-1 focus:ring-[#00C768]/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#5F6B7A] block mb-1">Max amount (USD)</label>
            <input
              type="text"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="e.g. 150.00"
              required
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#00C768] focus:ring-1 focus:ring-[#00C768]/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#5F6B7A] block mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Weekly groceries"
              className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#00C768] focus:ring-1 focus:ring-[#00C768]/20"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="text-xs font-medium text-white bg-[#00C768] hover:bg-[#05CE6C] px-4 py-2 rounded-md transition-colors"
            >
              Issue card
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[#5F6B7A] hover:text-[#0A1825] px-4 py-2 rounded-md hover:bg-[#F0F1F1] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Loading states ────────────────────────────────────────────────────────
  if (step === "checking-enrollment" || step === "creating" || step === "fetching-credentials") {
    const messages: Record<string, string> = {
      "checking-enrollment": "Checking enrollment status...",
      creating: "Creating order intent...",
      "fetching-credentials": "Retrieving credentials...",
    };
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 flex items-center justify-center gap-2 text-sm text-[#5F6B7A]">
        <Loader2 className="size-4 animate-spin text-[#00C768]" />
        <span>{messages[step]}</span>
      </div>
    );
  }

  // ── Enrollment verification (passkey) ─────────────────────────────────────
  if (step === "enrollment-verification" && enrollment && enrollment.status === "pending") {
    return (
      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden bg-white">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5E7EB] bg-[#E8F9EF]">
          <ShieldCheck className="size-3.5 text-[#00C768]" />
          <span className="text-xs font-medium text-[#0A1825]">Complete card enrollment</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-[#5F6B7A] mb-3">
            <Loader2 className="size-4 animate-spin text-[#00C768]" />
            <span>Waiting for passkey verification...</span>
          </div>
          <PaymentMethodAgenticEnrollmentVerification
            paymentMethodAgenticEnrollment={enrollment}
            onVerificationComplete={() => createOrderIntentAndContinue()}
            onVerificationError={() => {
              setError("Enrollment verification failed");
              setStep("error");
            }}
          />
        </div>
      </div>
    );
  }

  // ── Order intent verification (passkey to authorize spending) ─────────────
  if (step === "order-verification" && orderIntent && orderIntent.phase === "requires-verification") {
    return (
      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden bg-white">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5E7EB] bg-[#E8F9EF]">
          <ShieldCheck className="size-3.5 text-[#00C768]" />
          <span className="text-xs font-medium text-[#0A1825]">Authorize spending</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-[#5F6B7A] mb-3">
            <Loader2 className="size-4 animate-spin text-[#00C768]" />
            <span>Waiting for passkey authorization...</span>
          </div>
          <OrderIntentVerification
            orderIntent={orderIntent}
            onVerificationComplete={() => getCredentials(orderIntent.orderIntentId)}
            onVerificationError={() => getCredentials(orderIntent.orderIntentId)}
          />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
        <p className="text-sm font-medium text-red-700">Failed to issue virtual card</p>
        <p className="text-xs text-red-600">{error}</p>
        <button
          onClick={() => { setStep("form"); setError(""); }}
          className="text-xs text-red-600 hover:text-red-800 underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return null;
}
