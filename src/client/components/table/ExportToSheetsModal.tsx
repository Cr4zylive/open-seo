import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import {
  closeExportToSheetsModal,
  openGoogleSheetsTab,
  useExportToSheetsModalState,
} from "@/client/lib/exportToSheets";

export function ExportToSheetsModal() {
  const state = useExportToSheetsModalState();
  // Close any stale modal when the user navigates away mid-flow. Deps must
  // be `[pathname]` only — adding `isOpen` would close the modal the instant
  // it opens (the effect would fire on the open->true transition).
  const pathname = useLocation({ select: (l) => l.pathname });
  useEffect(() => {
    closeExportToSheetsModal();
  }, [pathname]);

  if (!state.isOpen) return null;

  const { rowCount } = state;

  const handleOpenSheet = () => {
    openGoogleSheetsTab();
    closeExportToSheetsModal();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeExportToSheetsModal();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8 leading-snug">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="size-4" />
            </span>
            已复制 {rowCount} 行到剪贴板
          </DialogTitle>
          <DialogDescription>
            打开新的 Google 表格并粘贴即可填入。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleOpenSheet}>
            打开新的 Google 表格
            <ExternalLink data-icon="inline-end" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
