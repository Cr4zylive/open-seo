import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";
import { AppBanner } from "@/client/layout/AppBanner";
import { dataforseoHelpLinkOptions } from "@/client/navigation/items";
import { isEveryAppClientAuthMode } from "@/lib/auth-mode";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";

function SeoApiStatusBanners({
  shouldShowSeoApiWarning,
  seoApiKeyStatusError,
}: {
  shouldShowSeoApiWarning: boolean;
  seoApiKeyStatusError: boolean;
}) {
  const icon = <AlertTriangle className="size-4 shrink-0" />;
  const helpLink = (
    <Link
      {...dataforseoHelpLinkOptions}
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      帮助页面
    </Link>
  );
  return (
    <>
      {shouldShowSeoApiWarning ? (
        <AppBanner variant="warning" icon={icon}>
          {isEveryAppClientAuthMode() ? (
            <>
              Every App 网关尚未配置 DataForSEO。所有者或管理员可用{" "}
              <code>pnpm everyapp secret set DATAFORSEO_API_KEY</code>{" "}
              设置。步骤见{helpLink}。
            </>
          ) : (
            <>
              需要完成设置：添加 DataForSEO API 密钥后才能使用 OpenSEO
              功能。请查看{helpLink}中的快速步骤。
            </>
          )}
        </AppBanner>
      ) : null}

      {seoApiKeyStatusError ? (
        <AppBanner variant="info" icon={icon}>
          无法验证 DataForSEO 设置。如果功能无法使用，请查看{helpLink}
          中的设置步骤。
        </AppBanner>
      ) : null}
    </>
  );
}

const DOCKER_MOVE_URL =
  "https://github.com/every-app/open-seo/blob/main/docs/SELF_HOSTING_DOCKER.md#move-from-the-old-docker-image";
const DOCKER_MOVE_DISMISSED_KEY = "openseo:docker-move-dismissed";

// The old single-container Docker image builds the app at startup with this
// flag set (deploy/docker/Dockerfile), so only its users see the notice.
function LegacyDockerBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DOCKER_MOVE_DISMISSED_KEY) === "1",
  );
  if (import.meta.env.VITE_OPENSEO_LEGACY_DOCKER !== "true" || dismissed) {
    return null;
  }
  return (
    <AppBanner variant="info" icon={<Info className="size-4 shrink-0" />}>
      新的 OpenSEO Docker 方案几秒即可启动，并支持账户。当前镜像会持续更新，迁移不会丢失数据。{" "}
      <a
        href={DOCKER_MOVE_URL}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        如何迁移
      </a>{" "}
      ·{" "}
      <button
        type="button"
        className="font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => {
          localStorage.setItem(DOCKER_MOVE_DISMISSED_KEY, "1");
          setDismissed(true);
        }}
      >
        关闭
      </button>
    </AppBanner>
  );
}

function MissingSeoSetupModal({ onClose }: { onClose: () => void }) {
  const everyApp = isEveryAppClientAuthMode();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex-row items-start gap-3 text-left">
          <div className="rounded-full bg-warning/20 p-2 text-warning">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-2">
            <DialogTitle>
              {everyApp ? "尚未配置 DataForSEO" : "还需完成一项设置"}
            </DialogTitle>
            <DialogDescription>
              {everyApp ? (
                <>
                  关键词、域名、反向链接和排名数据通过你的 Every App 网关来自
                  DataForSEO。所有者或管理员用{" "}
                  <code>pnpm everyapp secret set DATAFORSEO_API_KEY</code>{" "}
                  为所有应用设置一次；设置指南中有详细步骤。
                </>
              ) : (
                "添加 DataForSEO API 密钥后即可开始使用 OpenSEO。"
              )}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            暂不处理
          </Button>
          <Button
            nativeButton={false}
            render={<Link {...dataforseoHelpLinkOptions} onClick={onClose} />}
          >
            打开设置指南
            <ExternalLink className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { LegacyDockerBanner, MissingSeoSetupModal, SeoApiStatusBanners };
