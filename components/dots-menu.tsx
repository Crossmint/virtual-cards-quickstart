"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

export function DotsMenu({ onDelete, deleteLabel = "Delete" }: { onDelete: () => void; deleteLabel?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center p-1.5 rounded-md text-[#00150d] hover:bg-black/5 transition-colors"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-[8px] border border-[rgba(0,0,0,0.1)] shadow-md py-1 z-50">
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            <Trash2 className="size-3.5" />
            {deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}
