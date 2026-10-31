import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryState } from "@/client/components/QueryState";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { revalidateLogic } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { SectionHeader } from "@/client/components/PageHeader";
import { useAppForm } from "@/client/components/form/useAppForm";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { RowActionsMenu } from "@/client/components/RowActionsMenu";
import { DropdownMenuItem } from "@/client/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { CopyButton } from "@/client/components/CopyButton";
import { useOrganizations } from "@/client/features/settings/useOrganizations";
import { captureClientEvent } from "@/client/lib/posthog";
import { authClient } from "@/lib/auth-client";

// Better Auth rejects longer names with INVALID_NAME_LENGTH.
const MAX_KEY_NAME_LENGTH = 32;

const createKeySchema = z.object({
  name: z.string().trim().min(1, "请填写名称"),
});

// Stamped server-side when the key is created (see the /api-key/create hook
// in lib/auth.ts). Older keys were backfilled; only keys whose user had no
// organization at the time have none.
const apiKeyMetadataSchema = z.looseObject({
  organizationId: z.string().optional(),
});

export function ApiKeySettings() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<{ id: string; name: string } | null>(
    null,
  );
  const {
    hasMultiple: showOrganization,
    activeOrganizationName,
    organizationName,
  } = useOrganizations();

  const mcpUrl =
    typeof window === "undefined"
      ? "https://app.openseo.so/mcp"
      : `${window.location.origin}/mcp`;

  const apiKeysQuery = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const result = await authClient.apiKey.list();
      if (result.error) {
        throw new Error(result.error.message ?? "API 密钥加载失败");
      }
      return result.data.apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        start: key.start,
        createdAt: new Date(key.createdAt),
        lastRequest: key.lastRequest ? new Date(key.lastRequest) : null,
        organizationId:
          apiKeyMetadataSchema.safeParse(key.metadata).data?.organizationId ??
          null,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (keyName: string) => {
      const result = await authClient.apiKey.create({ name: keyName });
      if (result.error || !result.data?.key) {
        throw new Error(result.error?.message ?? "API 密钥创建失败");
      }
      return result.data.key;
    },
    onSuccess: (key) => {
      setCreatedKey(key);
      captureClientEvent("mcp:api_key_created");
      void queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const result = await authClient.apiKey.delete({ keyId });
      if (result.error) {
        throw new Error(result.error.message ?? "API 密钥撤销失败");
      }
    },
    onSuccess: () => {
      captureClientEvent("mcp:api_key_revoked");
      toast.success("API 密钥已撤销");
      setRevoking(null);
      void queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });

  const form = useAppForm({
    defaultValues: { name: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: createKeySchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value.name.trim());
    },
  });

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setCreatedKey(null);
    form.reset();
  };

  return (
    <section className="space-y-3">
      <SectionHeader title="API 密钥" />
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">
            OAuth 不可用时，用 API 密钥验证 MCP 客户端
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            适合 Hermes 这类远程智能体，常规登录流程走不通时用。
          </p>
          <p className="mt-1 text-sm">
            <a
              className="text-primary underline-offset-4 hover:underline"
              href="https://openseo.so/docs/mcp"
              target="_blank"
              rel="noreferrer"
            >
              设置指南
            </a>
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          创建 API 密钥
        </Button>
      </div>

      <QueryState
        query={apiKeysQuery}
        errorFallback="无法加载你的 API 密钥。"
      >
        {(apiKeys) =>
          apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">还没有 API 密钥。</p>
          ) : (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>密钥</TableHead>
                    {showOrganization ? (
                      <TableHead>组织</TableHead>
                    ) : null}
                    <TableHead>创建时间</TableHead>
                    <TableHead>最近使用</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="max-w-[220px] truncate font-medium">
                        {key.name || "未命名密钥"}
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs text-muted-foreground"
                        data-ph-mask
                      >
                        {key.start || "oseo_"}…
                      </TableCell>
                      {showOrganization ? (
                        <TableCell className="text-xs text-muted-foreground">
                          {organizationName(key.organizationId) ?? "—"}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-xs text-muted-foreground">
                        {key.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {key.lastRequest
                          ? key.lastRequest.toLocaleDateString()
                          : "从未使用"}
                      </TableCell>
                      <TableCell>
                        <RowActionsMenu
                          label={`${key.name || "API 密钥"}的操作`}
                        >
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setRevoking({
                                id: key.id,
                                name: key.name || "未命名密钥",
                              })
                            }
                          >
                            <Trash2 />
                            撤销密钥
                          </DropdownMenuItem>
                        </RowActionsMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )
        }
      </QueryState>

      {revoking ? (
        <ConfirmDialog
          title={`撤销「${revoking.name}」？`}
          confirmLabel="撤销密钥"
          destructive
          pending={revokeMutation.isPending}
          onClose={() => setRevoking(null)}
          onConfirm={() => revokeMutation.mutate(revoking.id)}
        >
          正在使用它的客户端将无法继续工作。
        </ConfirmDialog>
      ) : null}

      <Dialog
        open={isCreateOpen}
        // The key is shown once, so only Done closes the reveal step. Escape
        // and an outside click close the name step.
        onOpenChange={(open) => {
          if (!open && createdKey == null) closeCreateModal();
        }}
      >
        <DialogContent
          showCloseButton={false}
          // A minmax(0, 1fr) track, so the long key scrolls in its box and does
          // not push the Copy and Done buttons out of the dialog.
          className="grid-cols-1 sm:max-w-md"
        >
          {createdKey ? (
            <>
              <DialogHeader>
                <DialogTitle>复制你的新 API 密钥</DialogTitle>
                <DialogDescription>
                  之后不会再显示。请以{" "}
                  <span className="font-mono text-xs">
                    Authorization: Bearer
                  </span>{" "}
                  的形式发送到{" "}
                  <span className="font-mono text-xs break-all">{mcpUrl}</span>
                  。
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <code
                  className="min-w-0 flex-1 overflow-x-auto rounded bg-muted px-2.5 py-2 font-mono text-xs"
                  data-ph-mask
                >
                  {createdKey}
                </code>
                <CopyButton
                  value={createdKey}
                  successMessage="API 密钥已复制"
                  label="复制 API 密钥"
                  variant="ghost"
                  size="icon-sm"
                />
              </div>
              <DialogFooter>
                <Button onClick={closeCreateModal}>完成</Button>
              </DialogFooter>
            </>
          ) : (
            <form.AppForm>
              <form.Form className="grid gap-4">
                <DialogHeader>
                  <DialogTitle>创建 API 密钥</DialogTitle>
                </DialogHeader>
                <form.AppField name="name">
                  {(field) => (
                    <field.TextField
                      label="名称"
                      placeholder="笔记本电脑上的 Claude Code"
                      maxLength={MAX_KEY_NAME_LENGTH}
                      required
                      autoFocus
                    />
                  )}
                </form.AppField>
                {showOrganization ? (
                  <p className="text-sm text-muted-foreground">
                    此密钥在 {activeOrganizationName} 中有效。
                  </p>
                ) : null}
                <DialogFooter>
                  <Button variant="ghost" onClick={closeCreateModal}>
                    取消
                  </Button>
                  <form.SubmitButton>创建</form.SubmitButton>
                </DialogFooter>
              </form.Form>
            </form.AppForm>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
