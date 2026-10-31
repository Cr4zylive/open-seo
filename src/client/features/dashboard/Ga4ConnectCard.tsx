import { useState } from "react";
import { toast } from "sonner";
import { CardShell } from "@/client/components/CardShell";
import { Button } from "@/client/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GoogleConnectionCard } from "@/client/features/integrations/GoogleConnectionCard";
import { captureClientEvent } from "@/client/lib/posthog";
import { dismissDashboardGa4Card } from "@/serverFunctions/dashboard";

export function Ga4ConnectCard({
  projectId,
  connected,
}: {
  projectId: string;
  connected: boolean;
}) {
  const queryClient = useQueryClient();
  const [usesGa4, setUsesGa4] = useState(false);
  const dismissMutation = useMutation({
    mutationFn: () => dismissDashboardGa4Card({ data: { projectId } }),
    onSuccess: () => {
      toast.success("用其他分析工具？", {
        description:
          "把它的 MCP 服务器连到智能体，就能用那些分析数据。",
        duration: 10000,
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboardActivation", projectId],
      });
    },
  });

  if (!connected && !usesGa4)
    return (
      <CardShell title="你在用 Google Analytics 4 吗？">
        <p className="text-sm text-muted-foreground">
          把自然流量和转化带到仪表盘。
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => setUsesGa4(true)}>是，连接 GA4</Button>
          <Button
            variant="outline"
            disabled={dismissMutation.isPending}
            onClick={() => {
              captureClientEvent("dashboard:ga4_dismiss");
              dismissMutation.mutate();
            }}
          >
            否
          </Button>
        </div>
      </CardShell>
    );
  return (
    <GoogleConnectionCard
      provider="ga4"
      projectId={projectId}
      prominent
      onDismiss={
        connected
          ? undefined
          : () => {
              captureClientEvent("dashboard:ga4_dismiss");
              dismissMutation.mutate();
            }
      }
      dismissing={dismissMutation.isPending}
    />
  );
}
