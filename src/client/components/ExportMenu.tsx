import { Fragment, type ReactNode } from "react";
import {
  ChevronDown,
  Copy,
  Download,
  FileDown,
  FileJson,
  FileSpreadsheet,
  List,
  Sheet,
} from "lucide-react";
import { Button } from "@/client/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import type { ExportFormat } from "@/client/lib/exportRows";

/** Every `exportRows()` format, plus a plain list copy (one item per line). */
type ExportAction = ExportFormat | "copy-list";

const ACTION_ITEMS: Record<ExportAction, { label: string; icon: ReactNode }> = {
  sheets: { label: "导出到 Google 表格", icon: <Sheet /> },
  csv: { label: "导出 CSV", icon: <FileDown /> },
  excel: { label: "导出 Excel", icon: <FileSpreadsheet /> },
  json: { label: "下载 JSON", icon: <FileJson /> },
  "copy-json": { label: "复制 JSON", icon: <Copy /> },
  "copy-list": { label: "复制列表", icon: <List /> },
};

/**
 * The toolbar Export button. The caller runs each action through
 * `exportRows()`, so every format shares the empty check and the analytics
 * event. With `scopes`, each scope is a labelled section, for example
 * "Current category" and "All actionable". A scope lists its own `actions`
 * when it offers fewer than the menu.
 */
export function ExportMenu<A extends ExportAction>({
  actions,
  onExport,
  busy = false,
  disabled = false,
  copyListLabel,
  scopes,
}: {
  actions: A[];
  onExport: (action: A, scope?: string) => void;
  /** Shows a spinner on the trigger and disables it, for example while Sheets opens. */
  busy?: boolean;
  disabled?: boolean;
  /** Label for "copy-list", for example "复制关键词". */
  copyListLabel?: string;
  scopes?: { id: string; label: string; actions?: A[] }[];
}) {
  const renderItems = (scope?: string, scopeActions: A[] = actions) =>
    scopeActions.map((action) => (
      <DropdownMenuItem key={action} onClick={() => onExport(action, scope)}>
        {ACTION_ITEMS[action].icon}
        {action === "copy-list" && copyListLabel
          ? copyListLabel
          : ACTION_ITEMS[action].label}
      </DropdownMenuItem>
    ));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            pending={busy}
            disabled={disabled}
          />
        }
      >
        {busy ? null : <Download data-icon="inline-start" />}
        导出
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {scopes
          ? scopes.map((scope, index) => (
              <Fragment key={scope.id}>
                {index > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{scope.label}</DropdownMenuLabel>
                  {renderItems(scope.id, scope.actions)}
                </DropdownMenuGroup>
              </Fragment>
            ))
          : renderItems()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
