"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, CheckCheck, FileText, FolderOpen, Search, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Workspace } from "@/lib/campaign";
import { workspaceSearch, type WorkspaceTarget, type WorkspaceView } from "./workspace-model";
import styles from "./workspace-upgrade.module.css";

const icons = { Campaign: FolderOpen, Output: FileText, Content: BookOpen, Task: CheckCheck, Evidence: ShieldCheck };
export function WorkspaceCommandCenter({ workspace, open, onOpenChange, studios, navigate }: {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studios: readonly { id: WorkspaceView; label: string }[];
  navigate: (target: WorkspaceTarget) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const records = useMemo(() => workspaceSearch(workspace, query, activeOnly), [workspace, query, activeOnly]);
  const matchingStudios = studios.filter((studio) => query.trim().toLowerCase().split(/\s+/).every((term) => studio.label.toLowerCase().includes(term)));
  const shown = records.slice(0, query.trim() ? 40 : 12);
  const choose = (target: WorkspaceTarget) => { onOpenChange(false); navigate(target); };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={styles.commandDialog}>
      <DialogHeader className={styles.commandHeading}>
        <DialogTitle>Find anything. Keep moving.</DialogTitle>
        <DialogDescription>Search your campaigns, specialist outputs, content, tasks and evidence.</DialogDescription>
      </DialogHeader>
      <Command shouldFilter={false} className={styles.command}>
        <CommandInput aria-label="Search the workspace" placeholder="Try a campaign, claim, task owner or idea…" value={query} onValueChange={setQuery} />
        <div className={styles.searchScope}>
          <label><input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />Current campaign only</label>
          <span>{records.length} records</span>
        </div>
        <CommandList className={styles.commandList}>
          <CommandEmpty>No matches. Try a shorter phrase or search all campaigns.</CommandEmpty>
          {!!matchingStudios.length && <CommandGroup heading="Open a studio">{matchingStudios.map((studio) => <CommandItem key={studio.id} value={`studio:${studio.id}`} onSelect={() => choose({ campaignId: workspace.activeId, view: studio.id })}><Search /><span>{studio.label}</span><ArrowUpRight className={styles.trailingIcon} /></CommandItem>)}</CommandGroup>}
          {Object.entries(icons).map(([kind, Icon]) => {
            const group = shown.filter((result) => result.kind === kind);
            return group.length ? <CommandGroup heading={kind === "Evidence" ? "Evidence" : `${kind}s`} key={kind}>{group.map((result) => <CommandItem key={result.id} value={result.id} onSelect={() => choose(result)}><Icon /><div className={styles.searchResult}><b>{result.title}</b><small>{result.subtitle}</small></div><ArrowUpRight className={styles.trailingIcon} /></CommandItem>)}</CommandGroup> : null;
          })}
          {records.length > shown.length && <p className={styles.searchMore}>Showing {shown.length} of {records.length} records. Refine your search to find a specific item.</p>}
        </CommandList>
        <div className={styles.commandFoot}><span>↑ ↓ to navigate · Enter to open · Esc to close</span><span>Search stays on this device</span></div>
      </Command>
    </DialogContent>
  </Dialog>;
}
