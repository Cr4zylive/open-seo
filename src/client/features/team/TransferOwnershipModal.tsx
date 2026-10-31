import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { getErrorCode } from "@/client/lib/error-messages";
import { captureClientEvent } from "@/client/lib/posthog";
import { transferOwnership } from "@/serverFunctions/organization";

// NOT_FOUND: the member left. FORBIDDEN: the caller is no longer the owner
// (another tab). CONFLICT: a row changed mid-transfer.
function isTeamChangedError(error: Error) {
  const code = getErrorCode(error);
  return code === "CONFLICT" || code === "NOT_FOUND" || code === "FORBIDDEN";
}

export function TransferOwnershipModal({
  member,
  onClose,
  onTransferred,
}: {
  member: { id: string; user: { name?: string | null; email: string } };
  onClose: () => void;
  onTransferred: () => void;
}) {
  const displayName = member.user.name || member.user.email;

  const transferMutation = useMutation({
    mutationFn: () => transferOwnership({ data: { memberId: member.id } }),
    onSuccess: () => {
      captureClientEvent("team:ownership_transfer");
      toast.success(`${displayName} 现在是所有者`);
      onTransferred();
      onClose();
    },
    onError: (error: Error) => {
      const teamChanged = isTeamChangedError(error);
      toast.error(
        teamChanged
          ? "打开期间团队发生了变化，所有权未变更。"
          : "无法转让所有权，所有权未变更。",
      );
      // Refresh either way so the list and the caller's role are current.
      onTransferred();
      // The confirmation is stale once the team changed: close it so the
      // refreshed list shows who is still there. Other errors keep it open
      // for a retry.
      if (teamChanged) onClose();
    },
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !transferMutation.isPending) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>转让所有权？</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground" data-ph-mask>
              {displayName}
            </span>{" "}
            将成为此组织的所有者并管理账单。你会变成管理员，仍可访问每个项目。
          </DialogDescription>
          <DialogDescription>
            项目、数据和订阅仍属于组织。只有新所有者可以再次转让所有权。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={transferMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={() => transferMutation.mutate()}
            pending={transferMutation.isPending}
          >
            转让所有权
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
