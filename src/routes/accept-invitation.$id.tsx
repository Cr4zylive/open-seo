import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AuthPageCard, AuthPageShell } from "@/client/features/auth/AuthPage";
import { captureClientEvent } from "@/client/lib/posthog";
import { authClient, signOutAndRedirect, useSession } from "@/lib/auth-client";
import { isHostedClientAuthMode } from "@/lib/auth-mode";

export const Route = createFileRoute("/accept-invitation/$id")({
  beforeLoad: () => {
    if (!isHostedClientAuthMode()) {
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
      {isSessionPending ? null : session?.user ? (
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
      <p className="text-sm text-base-content/70">
        你被邀请加入 OpenSEO 上的一个组织。请使用收到邀请的邮箱登录后接受。
      </p>
      <div className="space-y-2">
        <Link
          to="/sign-up"
          search={{ redirect }}
          className="btn btn-soft w-full"
        >
          创建账号
        </Link>
        <Link
          to="/sign-in"
          search={{ redirect }}
          className="btn btn-ghost w-full"
        >
          登录
        </Link>
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    try {
      const accepted = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (accepted.error) {
        setActionError(
          accepted.error.message || "无法接受该邀请。",
        );
        setIsSubmitting(false);
        return;
      }

      // Accepting updates the session row but not the session cookie cache;
      // setActive refreshes the cookie so the app opens in the joined org
      // immediately instead of after the cache expires.
      await authClient.organization.setActive({
        organizationId: accepted.data.invitation.organizationId,
      });
      captureClientEvent("team:invitation_accept");
      // Full navigation: every cached query in this tab belongs to the old
      // workspace.
      window.location.assign("/");
    } catch {
      setActionError("无法接受该邀请，请重试。");
      setIsSubmitting(false);
    }
  }

  async function handleDecline() {
    setActionError(null);
    setIsSubmitting(true);
    try {
      const result = await authClient.organization.rejectInvitation({
        invitationId,
      });
      if (result.error) {
        setActionError(
          result.error.message || "无法拒绝该邀请。",
        );
        setIsSubmitting(false);
        return;
      }
      captureClientEvent("team:invitation_decline");
      setDeclined(true);
    } catch {
      setActionError("无法拒绝该邀请，请重试。");
      setIsSubmitting(false);
    }
  }

  if (invitationQuery.isPending) {
    return (
      <AuthPageCard title="正在核对邀请…">
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-md" />
        </div>
      </AuthPageCard>
    );
  }

  if (invitationQuery.isError) {
    return (
      <AuthPageCard title="邀请不可用">
        <p className="text-sm text-base-content/70">
          此邀请可能已过期、已取消，或不属于当前邮箱。你当前登录的是{" "}
          <span className="font-medium" data-ph-mask>
            {userEmail}
          </span>
          .
        </p>
        <p className="text-sm text-base-content/70">
          如果邀请发到了另一个邮箱，请退出后用那个邮箱重新登录。否则请让同事重新发送邀请。
        </p>
        <div className="space-y-2">
          <button
            type="button"
            className="btn btn-soft w-full"
            onClick={() => {
              // Signs out, then lands on sign-in with a redirect back to this
              // invitation (staying signed in would bounce straight back here).
              signOutAndRedirect();
            }}
          >
            使用其他账号
          </button>
          <Link to="/" className="btn btn-ghost w-full">
            前往仪表盘
          </Link>
        </div>
      </AuthPageCard>
    );
  }

  if (declined) {
    return (
      <AuthPageCard title="已拒绝邀请">
        <p className="text-sm text-base-content/70">
          你已拒绝加入{" "}
          <span className="font-medium">
            {invitationQuery.data.organizationName}
          </span>
          .
        </p>
        <Link to="/" className="btn btn-ghost w-full">
          前往仪表盘
        </Link>
      </AuthPageCard>
    );
  }

  return (
    <AuthPageCard title="加入组织">
      <p className="text-sm text-base-content/70">
        <span className="font-medium" data-ph-mask>
          {invitationQuery.data.inviterEmail}
        </span>{" "}
        邀请你加入{" "}
        <span className="font-medium">
          {invitationQuery.data.organizationName}
        </span>
        。
      </p>
      {actionError ? <p className="text-sm text-error">{actionError}</p> : null}
      <div className="space-y-2">
        <button
          type="button"
          className="btn btn-soft w-full"
          disabled={isSubmitting}
          onClick={() => void handleAccept()}
        >
          {isSubmitting ? "加入中…" : "接受邀请"}
        </button>
        <button
          type="button"
          className="btn btn-ghost w-full"
          disabled={isSubmitting}
          onClick={() => void handleDecline()}
        >
          拒绝
        </button>
      </div>
    </AuthPageCard>
  );
}
