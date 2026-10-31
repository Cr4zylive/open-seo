import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/client/components/Spinner";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AuthPageCard, AuthPageShell } from "@/client/features/auth/AuthPage";
import { clearLastProjectId } from "@/client/lib/active-project";
import { captureClientEvent } from "@/client/lib/posthog";
import { authClient, signOutAndRedirect, useSession } from "@/lib/auth-client";
import { usesBetterAuthClient } from "@/lib/auth-mode";

export const Route = createFileRoute("/accept-invitation/$id")({
  beforeLoad: () => {
    if (!usesBetterAuthClient()) {
      throw notFound();
    }
  },
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { id } = Route.useParams();
  const { data: session, isPending: isSessionPending } = useSession();

  return (
    <AuthPageShell>
      {isSessionPending ? (
        <Spinner />
      ) : session?.user ? (
        <InvitationCard invitationId={id} userEmail={session.user.email} />
      ) : (
        <SignedOutInvitationCard invitationId={id} />
      )}
    </AuthPageShell>
  );
}

// getInvitation requires a session matching the invited email, so a
// logged-out visitor gets a generic shell — no invitation details are
// exposed pre-auth by design.
function SignedOutInvitationCard({ invitationId }: { invitationId: string }) {
  const redirect = `/accept-invitation/${invitationId}`;

  return (
    <AuthPageCard title="你收到了邀请">
      <p className="text-sm text-muted-foreground">
        你被邀请加入 OpenSEO 上的一个组织。请用收到邀请的邮箱地址登录，或用它创建账户，然后接受邀请。
      </p>
      <div className="space-y-2">
        <Button
          nativeButton={false}
          render={<Link to="/sign-up" search={{ redirect }} />}
          variant="secondary"
          className="w-full"
        >
          创建账户
        </Button>
        <Button
          nativeButton={false}
          render={<Link to="/sign-in" search={{ redirect }} />}
          variant="ghost"
          className="w-full"
        >
          登录
        </Button>
      </div>
    </AuthPageCard>
  );
}

function InvitationCard({
  invitationId,
  userEmail,
}: {
  invitationId: string;
  userEmail: string;
}) {
  const [pendingAction, setPendingAction] = useState<
    "accept" | "decline" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

  const invitationQuery = useQuery({
    queryKey: ["invitation", invitationId],
    queryFn: async () => {
      const result = await authClient.organization.getInvitation({
        query: { id: invitationId },
      });
      if (result.error) {
        throw new Error(result.error.message || "找不到该邀请");
      }
      return result.data;
    },
    retry: false,
  });

  async function handleAccept() {
    setActionError(null);
    setPendingAction("accept");
    try {
      const accepted = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (accepted.error) {
        setActionError(
          accepted.error.message || "无法接受该邀请。",
        );
        setPendingAction(null);
        return;
      }

      // Accepting updates the session row but not the session cookie cache;
      // setActive refreshes the cookie so the app opens in the joined org
      // immediately instead of after the cache expires.
      await authClient.organization.setActive({
        organizationId: accepted.data.invitation.organizationId,
      });
      captureClientEvent("team:invitation_accept");
      // Full navigation: every cached query in this tab, and the remembered
      // project, belong to the old workspace.
      clearLastProjectId();
      window.location.assign("/");
    } catch {
      setActionError("无法接受该邀请，请重试。");
      setPendingAction(null);
    }
  }

  async function handleDecline() {
    setActionError(null);
    setPendingAction("decline");
    try {
      const result = await authClient.organization.rejectInvitation({
        invitationId,
      });
      if (result.error) {
        setActionError(
          result.error.message || "无法拒绝该邀请。",
        );
        setPendingAction(null);
        return;
      }
      captureClientEvent("team:invitation_decline");
      setDeclined(true);
    } catch {
      setActionError("无法拒绝该邀请，请重试。");
      setPendingAction(null);
    }
  }

  if (invitationQuery.isPending) {
    return (
      <AuthPageCard title="正在核对邀请…">
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </AuthPageCard>
    );
  }

  if (invitationQuery.isError) {
    return (
      <AuthPageCard title="邀请不可用">
        <p className="text-sm text-muted-foreground">
          此邀请可能已过期、已取消，或不属于当前邮箱。你当前登录的是{" "}
          <span className="font-medium" data-ph-mask>
            {userEmail}
          </span>
          .
        </p>
        <p className="text-sm text-muted-foreground">
          如果邀请发到了另一个邮箱，请退出并用那个邮箱重新登录。否则请让同事再发一封邀请。
        </p>
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              // Signs out, then lands on sign-in with a redirect back to this
              // invitation (staying signed in would bounce straight back here).
              signOutAndRedirect();
            }}
          >
            换一个账户
          </Button>
          <Button
            nativeButton={false}
            render={<Link to="/" />}
            variant="ghost"
            className="w-full"
          >
            前往仪表盘
          </Button>
        </div>
      </AuthPageCard>
    );
  }

  if (declined) {
    return (
      <AuthPageCard title="已拒绝邀请">
        <p className="text-sm text-muted-foreground">
          你已拒绝加入{" "}
          <span className="font-medium">
            {invitationQuery.data.organizationName}
          </span>
          .
        </p>
        <Button
          nativeButton={false}
          render={<Link to="/" />}
          variant="ghost"
          className="w-full"
        >
            前往仪表盘
        </Button>
      </AuthPageCard>
    );
  }

  return (
    <AuthPageCard title="加入组织">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium" data-ph-mask>
          {invitationQuery.data.inviterEmail}
        </span>{" "}
        邀请你加入{" "}
        <span className="font-medium">
          {invitationQuery.data.organizationName}
        </span>{" "}
        （OpenSEO）。
      </p>
      {actionError ? (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          pending={pendingAction === "accept"}
          disabled={pendingAction !== null}
          onClick={() => void handleAccept()}
        >
          {pendingAction === "accept" ? "加入中…" : "接受邀请"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          pending={pendingAction === "decline"}
          disabled={pendingAction !== null}
          onClick={() => void handleDecline()}
        >
          {pendingAction === "decline" ? "正在拒绝…" : "拒绝"}
        </Button>
      </div>
    </AuthPageCard>
  );
}
