"use client";

// Passkey verification step for agentic enrollment.
// Used by both "save a new card" and "issue a virtual card" flows.

import { Loader2, ShieldCheck, X } from "lucide-react";
import { PaymentMethodAgenticEnrollmentVerification } from "@crossmint/client-sdk-react-ui";
import type { AgenticEnrollmentResponse } from "@/lib/crossmint-types";
import { verificationAppearance } from "@/lib/verification-appearance";

type PendingEnrollment = Extract<AgenticEnrollmentResponse, { status: "pending" }>;

export function EnrollmentVerificationStep({
  enrollment,
  onComplete,
  onError,
  onCancel,
  message = "Waiting for passkey verification...",
}: {
  enrollment: PendingEnrollment;
  onComplete: () => void;
  onError: () => void;
  onCancel?: () => void;
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] bg-[#E8F9EF]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-[#00C768]" />
          <span className="text-xs font-medium text-[#0A1825]">Complete card enrollment</span>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-[#5F6B7A] hover:text-[#0A1825]">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-[#5F6B7A] mb-3">
          <Loader2 className="size-4 animate-spin text-[#00C768]" />
          <span>{message}</span>
        </div>
        <PaymentMethodAgenticEnrollmentVerification
          paymentMethodAgenticEnrollment={enrollment}
          appearance={verificationAppearance}
          onVerificationComplete={onComplete}
          onVerificationError={onError}
        />
      </div>
    </div>
  );
}
