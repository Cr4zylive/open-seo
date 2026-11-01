import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Unplug } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { SectionHeader } from "@/client/components/PageHeader";
import { QueryState } from "@/client/components/QueryState";
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
import { useOrganizations } from "@/client/features/settings/useOrganizations";
import { captureClientEvent } from "@/client/lib/posthog";
import {
  listMcpConnections,
  revokeMcpConnection,
} from "@/serverFunctions/mcp-connections";

export function McpConnectionsSettings() {
  const queryClient = useQueryClient();
  const [disconnecting, setDisconnecting] = useState<{
    id: string;
    clientName: string;
  } | null>(null);
  const { hasMultiple: showOrganization, organizationName } =
    useOrganizations();

  const connectionsQuery = useQuery({
    queryKey: ["mcpConnections"],
    queryFn: () => listMcpConnections(),
  });

  const disconnectMutation = useMutation({
    mutationFn: (grantId: string) => revokeMcpConnection({ data: { grantId } }),
    onSuccess: () => {
      captureClientEvent("mcp:connection_revoked");
      toast.success("智能体已断开");
      setDisconnecting(null);
      void queryClient.invalidateQueries({ queryKey: ["mcpConnections"] });
    },
  });

  return (
    <section className="space-y-3">
      <SectionHeader title="已连接的智能体" />
      <p className="text-sm">通过 OAuth 登录 OpenSEO 的 AI 客户端。</p>

      <QueryState
        query={connectionsQuery}
        errorFallback="无法加载已连接的智能体。"
      >
        {(connections) =>
          connections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              还没有已连接的智能体。
            </p>
          ) : (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户端</TableHead>
                    {showOrganization ? (
                      <TableHead>组织</TableHead>
                    ) : null}
                    <TableHead>连接时间</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell className="max-w-[220px] truncate font-medium">
                        {connection.clientName}
                      </TableCell>
                      {showOrganization ? (
                        <TableCell className="text-xs text-muted-foreground">
                          {organizationName(connection.organizationId) ?? "—"}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <RowActionsMenu
                          label={`${connection.clientName}的操作`}
                        >
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setDisconnecting({
                                id: connection.id,
                                clientName: connection.clientName,
                              })
                            }
                          >
                            <Unplug />
                            断开连接
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

      {disconnecting ? (
        <ConfirmDialog
          title={`断开「${disconnecting.clientName}」？`}
          confirmLabel="断开连接"
          destructive
          pending={disconnectMutation.isPending}
          onClose={() => setDisconnecting(null)}
          onConfirm={() => disconnectMutation.mutate(disconnecting.id)}
        >
          之后需要重新登录 OpenSEO。
        </ConfirmDialog>
      ) : null}
    </section>
  );
}
