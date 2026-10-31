import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";

/**
 * Shown when Shopify rate limited an unrendered crawl that carried a crawler
 * signature. Shopify's edge can still throttle Cloudflare Workers then, and a
 * rendered audit reads throttled pages from outside Cloudflare.
 */
export function ShopifyRateLimitAlert({
  projectId,
  startUrl,
}: {
  projectId: string;
  startUrl: string;
}) {
  return (
    <Alert variant="warning">
      <ShieldAlert />
      <AlertTitle>你的 Shopify 域名遇到了错误。</AlertTitle>
      <AlertDescription>
        Shopify 正在进行全局限流，因此本报告不完整。要完成审计，请开启「渲染
        JavaScript」后开始新的审计。
      </AlertDescription>
      <div className="col-start-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link
              to="/p/$projectId/audit"
              params={{ projectId }}
              search={{ url: startUrl }}
            />
          }
        >
          开始新审计
        </Button>
      </div>
    </Alert>
  );
}
