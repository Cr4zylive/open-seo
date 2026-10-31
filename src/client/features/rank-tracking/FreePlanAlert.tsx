import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { SUBSCRIBE_ROUTE } from "@/shared/billing";

export function FreePlanAlert({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Alert variant="warning">
      <AlertTriangle />
      <AlertDescription className="text-foreground">
        <p>
          只有{" "}
          <Link
            to={SUBSCRIBE_ROUTE}
            search={{ upgrade: true }}
            className="font-medium underline underline-offset-3"
          >
            升级到付费套餐
          </Link>
          后才会开始追踪关键词排名。
        </p>
      </AlertDescription>
    </Alert>
  );
}
