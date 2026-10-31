import { Archive, Pause, Pencil, Play } from "lucide-react";
import { RowActionsMenu } from "@/client/components/RowActionsMenu";
import { DropdownMenuItem } from "@/client/components/ui/dropdown-menu";

/** The dots menu of a prompt or topic row in the tracked prompts table. */
export function PromptActionsMenu({
  label,
  kind,
  paused,
  scheduled,
  pending,
  onEdit,
  onTogglePause,
  onArchive,
}: {
  label: string;
  kind: "prompt" | "topic";
  paused: boolean;
  /** Pausing only skips scheduled runs, so it needs a schedule. */
  scheduled: boolean;
  pending: boolean;
  onEdit?: () => void;
  onTogglePause: () => void;
  onArchive: () => void;
}) {
  return (
    <RowActionsMenu label={label}>
      {onEdit && (
        <DropdownMenuItem onClick={onEdit}>
          <Pencil />
          {kind === "topic" ? "重命名主题" : "编辑提示词"}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        disabled={pending || (!paused && !scheduled)}
        onClick={onTogglePause}
      >
        {paused ? <Play /> : <Pause />}
        {paused
          ? kind === "topic"
            ? "恢复主题"
            : "恢复提示词"
          : kind === "topic"
            ? "暂停主题"
            : "暂停提示词"}
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        disabled={pending}
        onClick={onArchive}
      >
        <Archive />
        {kind === "topic" ? "归档主题" : "归档提示词"}
      </DropdownMenuItem>
    </RowActionsMenu>
  );
}
