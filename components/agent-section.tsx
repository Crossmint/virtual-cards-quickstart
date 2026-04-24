"use client";

import { Bot, Loader2, Trash2 } from "lucide-react";
import type { AgentResponse } from "@/lib/crossmint-types";

export function AgentSection({
  agent,
  loading,
  creating,
  deleting,
  onCreate,
  onDelete,
}: {
  agent: AgentResponse | null;
  loading: boolean;
  creating: boolean;
  deleting: boolean;
  onCreate: () => void;
  onDelete: () => void;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[#0A1825] mb-3">Agent</h2>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#5F6B7A] py-4">
          <Loader2 className="size-4 animate-spin text-[#00C768]" />
          <span>Loading...</span>
        </div>
      ) : agent ? (
        <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFA] px-4 py-3">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-[#00C768]" />
            <div>
              <div className="text-sm font-medium text-[#0A1825]">{agent.metadata.name}</div>
              <div className="text-xs text-[#5F6B7A] font-mono">{agent.agentId}</div>
            </div>
          </div>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="text-[#5F6B7A] hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 disabled:opacity-50"
            title="Delete agent"
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#F9FAFA] p-4 text-center">
          <p className="text-sm text-[#5F6B7A] mb-3">
            Create an agent to start issuing virtual cards.
          </p>
          <button
            onClick={onCreate}
            disabled={creating}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#00C768] hover:bg-[#05CE6C] disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
          >
            {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Bot className="size-3.5" />}
            <span>{creating ? "Creating..." : "Create agent"}</span>
          </button>
        </div>
      )}
    </section>
  );
}
