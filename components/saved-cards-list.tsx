"use client";

// Displays the user's saved payment methods.
//
// Each card must be enrolled for agentic use before virtual cards can be issued.
// Unenrolled cards show a callout below the card with an "Enroll card" button
// that runs ensureEnrollment + passkey verification. Once enrolled, the card row
// swaps in the "Issue virtual card" action.

import { useEffect, useState } from "react";
import { CreditCard, Loader2, Trash2, Code, ShieldCheck, ShieldAlert } from "lucide-react";
import type { PaymentMethodResponse, AgenticEnrollmentResponse } from "@/lib/crossmint-types";
import { ensureEnrollment } from "@/lib/crossmint-api";
import { EnrollmentVerificationStep } from "./enrollment-verification-step";

export function SavedCardsList({
  cards,
  loading,
  canIssue,
  jwt,
  email,
  enrollmentStatuses,
  onIssueVirtualCard,
  onDeleteCard,
}: {
  cards: PaymentMethodResponse[];
  loading: boolean;
  canIssue: boolean;
  jwt: string;
  email: string;
  enrollmentStatuses: Record<string, string>;
  onIssueVirtualCard: (paymentMethodId: string) => void;
  onDeleteCard: (paymentMethodId: string) => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Which card is currently running ensureEnrollment (spinner on its Enroll button)
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  // Which card is showing the inline passkey verification UI
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  // Pending enrollment object for the card being verified
  const [pendingEnrollment, setPendingEnrollment] = useState<AgenticEnrollmentResponse | null>(null);
  // Locally-tracked enrolled card IDs (swap Enroll → Issue once confirmed).
  // Seeded from the server-fetched enrollmentStatuses prop on load, then
  // mutated locally as the user completes enrollment in-session.
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      for (const [pmId, status] of Object.entries(enrollmentStatuses)) {
        if (status === "active") next.add(pmId);
      }
      return next;
    });
  }, [enrollmentStatuses]);

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

  const markEnrolled = (pmId: string) => {
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      next.add(pmId);
      return next;
    });
    setVerifyingId(null);
    setPendingEnrollment(null);
  };

  const handleEnroll = async (pmId: string) => {
    setEnrollingId(pmId);
    try {
      const res = await ensureEnrollment(jwt, pmId, email);
      if (res.status === "active") {
        markEnrolled(pmId);
      } else if (res.status === "pending") {
        setPendingEnrollment(res);
        setVerifyingId(pmId);
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {cards.map((card) => {
        const pmId = card.paymentMethodId;
        const isEnrolled = enrolledIds.has(pmId);
        const isEnrolling = enrollingId === pmId;
        const isVerifying = verifyingId === pmId;

        return (
          <div key={pmId} className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] px-4 py-3">
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-[#5F6B7A]" />
                <div>
                  <div className="text-sm font-medium text-[#0A1825]">
                    {card.card?.brand ?? "Card"} •••• {card.card?.last4 ?? "????"}
                  </div>
                  <div className="text-xs text-[#5F6B7A] font-mono">{pmId}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === pmId ? null : pmId)}
                  className="text-[#5F6B7A] hover:text-[#0A1825] transition-colors p-1.5 rounded-md hover:bg-[#E5E7EB]/50"
                  title="Raw data"
                >
                  <Code className="size-3.5" />
                </button>

                {isEnrolled && (
                  <button
                    onClick={() => onIssueVirtualCard(pmId)}
                    disabled={!canIssue}
                    className="text-xs px-3 py-1.5 rounded-md border bg-white text-[#00C768] border-[#00C768]/30 hover:bg-[#E8F9EF] disabled:text-[#9CA3AF] disabled:border-[#E5E7EB] disabled:bg-white disabled:cursor-not-allowed transition-colors"
                  >
                    Issue virtual card
                  </button>
                )}

                <button
                  onClick={() => handleDelete(pmId)}
                  disabled={deletingId === pmId}
                  className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                >
                  {deletingId === pmId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Enroll-card callout for unenrolled cards (sits below the row, visually distinct) */}
            {!isEnrolled && (
              <div className="flex items-center justify-between gap-3 pl-3 pr-2 py-2 rounded-md bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-2 text-xs text-amber-800">
                  <ShieldAlert className="size-3.5 shrink-0 text-amber-600" />
                  <span>This card needs to be enrolled for agentic use before creating virtual cards.</span>
                </div>
                <button
                  onClick={() => handleEnroll(pmId)}
                  disabled={isEnrolling || isVerifying}
                  className="inline-flex items-center gap-1.5 shrink-0 text-xs font-medium px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isEnrolling && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Enroll card</span>
                </button>
              </div>
            )}

            {/* Inline passkey verification for the card being enrolled */}
            {isVerifying && pendingEnrollment?.status === "pending" && (
              <EnrollmentVerificationStep
                enrollment={pendingEnrollment}
                message="Complete passkey verification to enable agentic payments..."
                onComplete={() => markEnrolled(pmId)}
                onError={() => {
                  setVerifyingId(null);
                  setPendingEnrollment(null);
                }}
                onCancel={() => {
                  setVerifyingId(null);
                  setPendingEnrollment(null);
                }}
              />
            )}

            {expandedId === pmId && (
              <pre className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] p-3 text-xs font-mono text-[#0A1825] overflow-auto max-h-96">
                {JSON.stringify(card, null, 2)}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
