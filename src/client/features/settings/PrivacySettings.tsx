import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { SectionHeader } from "@/client/components/PageHeader";
import {
  updatePrivacyChoices,
  usePrivacyChoices,
} from "@/client/components/PrivacyChoices";
import { Switch } from "@/client/components/ui/switch";
import { useSession } from "@/lib/auth-client";
import { setProductUpdatesOptIn } from "@/serverFunctions/product-updates";

export function PrivacySettings() {
  const choices = usePrivacyChoices();
  const { data: session, refetch } = useSession();
  const productUpdates = useMutation({
    mutationFn: (optIn: boolean) => setProductUpdatesOptIn({ data: { optIn } }),
    // The session is served from a signed cookie cache, so bypass it to pick
    // up the saved choice.
    onSuccess: () => refetch({ query: { disableCookieCache: true } }),
    onError: () => toast.error("无法保存你的邮件偏好。"),
  });
  if (!choices || !session) return null;

  return (
    <section className="space-y-3">
      <SectionHeader title="隐私和邮件" />
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">使用分析</p>
          <p className="mt-1 text-sm text-muted-foreground">
            分享使用分析和会话回放，帮助改进 OpenSEO。
          </p>
        </div>
        <Switch
          checked={choices.analytics}
          onCheckedChange={(analytics) =>
            void updatePrivacyChoices({ ...choices, analytics }, true)
          }
          aria-label="分享使用分析"
        />
      </div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">产品更新</p>
          <p className="mt-1 text-sm text-muted-foreground">
            偶尔发送新功能和技巧邮件。随时可取消订阅。
          </p>
        </div>
        <Switch
          checked={
            productUpdates.isPending
              ? productUpdates.variables
              : session.user.productUpdatesOptIn === true
          }
          disabled={productUpdates.isPending}
          onCheckedChange={(optIn) => productUpdates.mutate(optIn)}
          aria-label="接收产品更新邮件"
        />
      </div>
    </section>
  );
}
