import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { useHostedPlanGate } from "@/client/features/billing/HostedPlanGate";
import { getScheduledRankChecksPaused } from "@/serverFunctions/rank-tracking";

/**
 * Shown while ops has paused scheduled checks during a provider outage. Free
 * plans never run scheduled checks, so they get the upgrade alert instead.
 */
export function ScheduledChecksPausedAlert({
  hasScheduledCheck,
}: {
  hasScheduledCheck: boolean;
}) {
  const affected = useHostedPlanGate() === "paid" && hasScheduledCheck;
  const { data: paused } = useQuery({
    queryKey: ["scheduledRankChecksPaused"],
    queryFn: () => getScheduledRankChecksPaused(),
    enabled: affected,
  });

  if (!affected || !paused) return null;

  return (
    <Alert variant="warning">
      <AlertTriangle />
      <AlertDescription className="text-foreground">
        <p>
          <span className="font-medium">计划检查已暂停</span>
          ，排名数据提供商正在从故障中恢复。恢复后会自动补跑。
        </p>
      </AlertDescription>
    </Alert>
  );
}
