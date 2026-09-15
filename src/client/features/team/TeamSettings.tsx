import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  InviteTeammateModal,
  inviteErrorMessage,
} from "@/client/features/team/InviteTeammateModal";
import { organizationContextQueryOptions } from "@/client/features/team/organizationQueries";
import { InvitationRow, MemberRow } from "@/client/features/team/TeamTableRows";
import { captureClientEvent } from "@/client/lib/posthog";
import { authClient, useSession } from "@/lib/auth-client";
import { hasOrgPermission } from "@/lib/org-permissions";
import { getTeam, sendTeamInvitation } from "@/serverFunctions/organization";

// The Organization tab of account settings: who has access to the active org.
export function TeamSettings() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const orgContextQuery = useQuery(organizationContextQueryOptions());

  const teamQuery = useQuery({
    queryKey: ["organization-team", orgContextQuery.data?.organizationId],
    queryFn: () => getTeam(),
    enabled: orgContextQuery.data?.organizationId !== undefined,
  });

  const refreshTeam = () =>
    queryClient.invalidateQueries({
      queryKey: ["organization-team", orgContextQuery.data?.organizationId],
    });

  // Same server call as inviting: for an already-pending address it re-mails
  // the same link with a refreshed expiry.
  const resendMutation = useMutation({
    mutationFn: (email: string) => sendTeamInvitation({ data: { email } }),
    onSuccess: () => {
      captureClientEvent("team:invitation_resend");
      toast.success("邀请已重新发送");
      void refreshTeam();
    },
    onError: (error: Error) => {
      toast.error(inviteErrorMessage(error));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const result = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      });
      if (result.error) {
        throw new Error(result.error.message || "无法移除该成员");
      }
    },
    onSuccess: () => {
      captureClientEvent("team:member_remove");
      toast.success("已移除成员");
      void refreshTeam();
    },
    onError: (error: Error) => {
      toast.error(error.message || "无法移除该成员。");
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (result.error) {
        throw new Error(
          result.error.message || "无法取消该邀请",
        );
      }
    },
    onSuccess: () => {
      captureClientEvent("team:invitation_cancel");
      toast.success("邀请已取消");
      void refreshTeam();
    },
    onError: (error: Error) => {
      toast.error(error.message || "无法取消该邀请。");
    },
  });

  const role = orgContextQuery.data?.role ?? "member";
  const canManageTeam = hasOrgPermission(role, { invitation: ["create"] });
  // billing:manage is the owner-only statement (organization:delete is
  // disabled app-wide, so it would read as a dead capability).
  const isOwner = hasOrgPermission(role, { billing: ["manage"] });

  const members = teamQuery.data?.members ?? [];
  const pendingInvitations = teamQuery.data?.pendingInvitations ?? [];

  if (teamQuery.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/70">
          暂时无法加载团队信息。
        </p>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          onClick={() => void teamQuery.refetch()}
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-base-content/50">成员</h2>
        {canManageTeam ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsInviteOpen(true)}
          >
            邀请同事
          </button>
        ) : null}
      </div>
      <p className="text-sm text-base-content/60">
        同事将以管理员身份加入。管理员除账单外可访问每个项目。
      </p>

      {teamQuery.isPending ? (
        <div className="flex justify-center py-6">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>成员</th>
                <th>角色</th>
                <th>状态</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isSelf={member.userId === session?.user?.id}
                  canManageTeam={canManageTeam}
                  isOwner={isOwner}
                  isRemoving={removeMemberMutation.isPending}
                  onRemove={() => removeMemberMutation.mutate(member.id)}
                />
              ))}
              {pendingInvitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  canManageTeam={canManageTeam}
                  isResending={resendMutation.isPending}
                  isCanceling={cancelInvitationMutation.isPending}
                  onResend={() => resendMutation.mutate(invitation.email)}
                  onCancel={() =>
                    cancelInvitationMutation.mutate(invitation.id)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isInviteOpen ? (
        <InviteTeammateModal
          onClose={() => setIsInviteOpen(false)}
          onInvited={() => void refreshTeam()}
        />
      ) : null}
    </section>
  );
}
