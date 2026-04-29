"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CrossmintPaymentMethodManagement } from "@crossmint/client-sdk-react-ui";

function CardFormSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-3 w-24 rounded bg-black/[0.06]" />
        <div className="h-10 rounded-md bg-black/[0.04]" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 rounded bg-black/[0.06]" />
          <div className="h-10 rounded-md bg-black/[0.04]" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-10 rounded bg-black/[0.06]" />
          <div className="h-10 rounded-md bg-black/[0.04]" />
        </div>
      </div>
      <div className="h-9 w-28 rounded-md bg-black/[0.06]" />
    </div>
  );
}

export function SaveCardSection({
  jwt,
  onCardSaved,
  onCancel,
}: {
  jwt: string;
  onCardSaved: (paymentMethodId: string) => void;
  onCancel: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rounded-[10px] border border-[rgba(0,0,0,0.1)] overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.06)] bg-black/[0.02]">
        <span className="text-sm font-medium text-[#00150d]">Add new card</span>
        <button onClick={onCancel} className="text-[#00150d]/40 hover:text-[#00150d] transition-colors">
          <X className="size-4" />
        </button>
      </div>
      <div className="p-4 relative">
        <CrossmintPaymentMethodManagement
          jwt={jwt}
          onPaymentMethodSelected={(pm) => onCardSaved(pm.paymentMethodId)}
        />
        {!loaded && (
          <div className="absolute inset-0 bg-white p-4">
            <CardFormSkeleton />
          </div>
        )}
      </div>
    </div>
  );
}
