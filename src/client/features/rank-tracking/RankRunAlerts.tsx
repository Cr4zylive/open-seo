import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { InsufficientCreditsError } from "@/client/features/billing/InsufficientCreditsError";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import type { useRankRunPolling } from "./useRankRunPolling";

/** Warnings about the latest rank check: stale, failed, or incomplete. */
export function RankRunAlerts({
  run,
}: {
  run: ReturnType<typeof useRankRunPolling>;
}) {
  if (!run) return null;

  if (run.maybeStale) {
    return (
      <Alert variant="warning">
        <AlertTriangle />
        <AlertDescription className="text-foreground">
          此次运行可能已无响应，系统会自动清理。
        </AlertDescription>
      </Alert>
    );
  }

  if (run.status === "failed" && run.errorMessage === "INSUFFICIENT_CREDITS") {
    return <InsufficientCreditsError title="上次排名检查未能运行" />;
  }

  if (run.status === "failed") {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertDescription className="text-foreground">
          <p>
            <span className="font-medium">上次检查失败。</span>{" "}
            {run.errorMessage &&
              getStandardErrorMessage(new Error(run.errorMessage))}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // A completed run only has an error message when some checks have no
  // result. Most are misses that retries couldn't confirm, not provider
  // errors, so the copy doesn't blame the provider.
  if (run.status === "completed" && run.errorMessage) {
    return (
      <Alert variant="warning">
        <AlertTriangle />
        <AlertDescription className="text-foreground">
          <p>
            <span className="font-medium">上次检查不完整。</span>{" "}
            部分关键词未能确认结果，因此仍显示上次排名。
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
