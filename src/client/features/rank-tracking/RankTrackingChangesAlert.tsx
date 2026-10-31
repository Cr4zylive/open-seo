import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/client/components/ui/alert";

export function RankTrackingChangesAlert() {
  return (
    <Alert variant="info">
      <Info />
      <AlertDescription className="text-foreground">
        <p>
          <span className="font-medium">
            排名追踪现在会重试部分结果。
          </span>{" "}
          自 9 月起，Google 向所有排名追踪工具返回的结果都不完整。{" "}
          <a
            href="https://openseo.so/blogs/rank-tracking-changes"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            了解变化
          </a>
        </p>
      </AlertDescription>
    </Alert>
  );
}
