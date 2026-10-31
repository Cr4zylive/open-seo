import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";
import { usesBetterAuthClient } from "@/lib/auth-mode";
import {
  getWorkspaceMergeStatus,
  mergeLegacyWorkspaces,
} from "@/serverFunctions/workspace";

// Shown on self-hosted Cloudflare Access deployments that still have per-user
// workspaces from before the shared workspace existed. The server decides
// visibility (AUTH_MODE is a runtime var there); hosted builds skip the query
// entirely since the mode is known at build time.
export function WorkspaceMergeBanner() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["workspaceMergeStatus"],
    queryFn: () => getWorkspaceMergeStatus(),
    enabled: !usesBetterAuthClient(),
  });

  const mergeMutation = useMutation({
    mutationFn: () => mergeLegacyWorkspaces(),
    onSuccess: ({ mergedWorkspaces }) => {
      toast.success(
        `已将 ${mergedWorkspaces} 个组织迁移到共享组织。`,
      );
      // The merge changes projects, connections, and the banner's own status —
      // refetch everything rather than enumerating keys.
      void queryClient.invalidateQueries();
    },
  });

  if (!statusQuery.data || statusQuery.data.legacyWorkspaceCount === 0) {
    return null;
  }

  return (
    <Alert variant="warning" className="p-5">
      <AlertDescription className="max-w-3xl text-foreground">
        在 Cloudflare 上自托管时，曾有一个 bug：每个用户都有独立工作区。原本应
        该所有人共用一个工作区。点击下方按钮，会把大家之前的工作迁移到这个共享
        工作区。
      </AlertDescription>
      <Button
        size="sm"
        className="mt-4 justify-self-start"
        pending={mergeMutation.isPending}
        onClick={() => mergeMutation.mutate()}
      >
        {mergeMutation.isPending ? "迁移中…" : "迁移工作区"}
      </Button>
    </Alert>
  );
}
