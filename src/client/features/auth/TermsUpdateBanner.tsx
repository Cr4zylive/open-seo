import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/client/components/ui/button";
import { AppBanner } from "@/client/layout/AppBanner";
import { useSession } from "@/lib/auth-client";
import { acceptTermsUpdate } from "@/serverFunctions/terms";
import {
  CURRENT_TERMS_EFFECTIVE_DATE,
  CURRENT_TERMS_VERSION,
  PRIVACY_URL,
  TERMS_URL,
} from "@/shared/terms";

// Asks existing users to affirmatively accept updated Terms. It never blocks
// the app: a user who doesn't accept stays on their prior agreement.
export function TermsUpdateBanner() {
  const { data: session, refetch } = useSession();
  const acceptMutation = useMutation({
    mutationFn: () => acceptTermsUpdate(),
    // The session is served from a signed cookie cache, so bypass it to pick
    // up the new acceptance and hide the banner.
    onSuccess: () => refetch({ query: { disableCookieCache: true } }),
    onError: () => toast.error("无法记录你的接受。"),
  });

  if (!session || session.user.termsAcceptedVersion === CURRENT_TERMS_VERSION) {
    return null;
  }

  return (
    <AppBanner variant="info">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          我们更新了{" "}
          <a href={TERMS_URL} target="_blank" rel="noreferrer">
            服务条款
          </a>{" "}
          和{" "}
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
            隐私政策
          </a>{" "}
          （生效日期 {CURRENT_TERMS_EFFECTIVE_DATE}）。请查阅并接受。
        </span>
        <Button
          size="sm"
          pending={acceptMutation.isPending}
          onClick={() => acceptMutation.mutate()}
        >
          接受
        </Button>
      </div>
    </AppBanner>
  );
}
