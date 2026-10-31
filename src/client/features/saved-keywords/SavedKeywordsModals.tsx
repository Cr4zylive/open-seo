import { AlertCircle } from "lucide-react";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { Alert, AlertDescription } from "@/client/components/ui/alert";

export function RemoveSavedKeywordsError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function DeleteSavedKeywordsModal({
  selectedCount,
  isPending,
  onClose,
  onConfirm,
}: {
  selectedCount: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      title="删除关键词？"
      confirmLabel={`删除 ${selectedCount} 个关键词`}
      destructive
      pending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      将永久删除 {selectedCount} 个已保存关键词。
    </ConfirmDialog>
  );
}
