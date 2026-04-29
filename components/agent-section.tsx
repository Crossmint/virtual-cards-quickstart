"use client";

import { Plus, Loader2, Bot } from "lucide-react";
import type { AgentResponse } from "@/lib/crossmint-types";
import { DotsMenu } from "./dots-menu";

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
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-[#F6F6F6] px-4 py-3 animate-pulse">
        <div className="size-5 rounded-full bg-black/[0.08] shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-28 rounded bg-black/[0.08]" />
          <div className="h-3 w-40 rounded bg-black/[0.05]" />
        </div>
      </div>
    );
  }

  if (agent) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-[#F6F6F6] px-4 py-3">
        <div className="flex items-center gap-3">
          <Bot className="size-5 text-[#05B959]" />
          <div>
            <div className="text-sm font-medium text-[#00150d]">{agent.metadata.name}</div>
            <div className="text-xs text-[#00150d]/50 font-mono">{agent.agentId}</div>
          </div>
        </div>
        {deleting
          ? <Loader2 className="size-3.5 animate-spin text-[#00150d]/40" />
          : <DotsMenu onDelete={onDelete} deleteLabel="Delete agent" />
        }
      </div>
    );
  }

  return (
    <button
      onClick={onCreate}
      disabled={creating}
      className="flex items-center gap-4 h-[35px] disabled:opacity-50 group"
    >
      <div className="bg-white border-[1.5px] border-[rgba(0,0,0,0.1)] rounded-[6px] w-[56px] h-[35px] flex items-center justify-center group-hover:border-[#05B959]/40 transition-colors shrink-0">
        {creating ? (
          <Loader2 className="size-4 animate-spin text-[#05B959]" />
        ) : (
          <Plus className="size-5 text-[#00150d] group-hover:text-[#05B959] transition-colors" />
        )}
      </div>
      <span className="font-medium text-base text-[#00150d] group-hover:text-[#05B959] transition-colors">
        {creating ? "Creating..." : "Create new agent"}
      </span>
    </button>
  );
}
