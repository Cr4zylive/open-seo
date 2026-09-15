import { Send, Trash2 } from "lucide-react";
import { PortalMenu } from "@/client/components/PortalMenu";
import { hasOrgPermission } from "@/lib/org-permissions";

const ROLE_LABELS: Record<string, string> = {
  owner: "所有者",
  admin: "管理员",
  member: "成员",
};

function formatRole(role: string) {
  return role
    .split(",")
    .map((name) => ROLE_LABELS[name.trim()] ?? name.trim())
    .join(", ");
}

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { name?: string | null; email: string };
};

type Invitation = {
  id: string;
  email: string;
  role?: string | null;
  expiresAt: Date | string;
};

export function MemberRow({
  member,
  isSelf,
  canManageTeam,
  isOwner,
  isRemoving,
  onRemove,
}: {
  member: Member;
  isSelf: boolean;
  canManageTeam: boolean;
  isOwner: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const memberIsOwner = hasOrgPermission(member.role, {
    billing: ["manage"],
  });
  // Owners are protected server-side (only an owner can touch an owner; the
  // last owner can't be removed) — don't render controls that would just 403.
  const canRemove = canManageTeam && !isSelf && (!memberIsOwner || isOwner);

  return (
    <tr className="hover">
      <td className="max-w-[280px]">
        <p className="truncate font-medium" data-ph-mask>
          {member.user.name || member.user.email}
          {isSelf ? (
            <span className="font-normal text-base-content/50">（你）</span>
          ) : null}
        </p>
        <p className="truncate text-xs text-base-content/50" data-ph-mask>
          {member.user.email}
        </p>
      </td>
      <td>
        <span className="badge badge-ghost badge-sm">
          {formatRole(member.role)}
        </span>
      </td>
      <td className="text-xs text-base-content/70">Active</td>
      <td>
        {canRemove ? (
          <PortalMenu
            ariaLabel={`${member.user.email} 的操作`}
            menuClassName="w-52"
          >
            {(close) => (
              <li>
                <button
                  className="text-error"
                  disabled={isRemoving}
                  onClick={() => {
                    close();
                    if (
                      window.confirm(
                        `将 ${member.user.email} 移出此组织？对方会立即失去访问权限。`,
                      )
                    ) {
                      onRemove();
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                  移除成员
                </button>
              </li>
            )}
          </PortalMenu>
        ) : null}
      </td>
    </tr>
  );
}

export function InvitationRow({
  invitation,
  canManageTeam,
  isResending,
  isCanceling,
  onResend,
  onCancel,
}: {
  invitation: Invitation;
  canManageTeam: boolean;
  isResending: boolean;
  isCanceling: boolean;
  onResend: () => void;
  onCancel: () => void;
}) {
  return (
    <tr className="hover">
      <td className="max-w-[280px]">
        <p className="truncate font-medium" data-ph-mask>
          {invitation.email}
        </p>
      </td>
      <td>
        <span className="badge badge-ghost badge-sm">
          {formatRole(invitation.role ?? "member")}
        </span>
      </td>
      <td className="text-xs text-base-content/70">
        已邀请 &middot; {new Date(invitation.expiresAt).toLocaleDateString()} 过期
      </td>
      <td>
        {canManageTeam ? (
          <PortalMenu
            ariaLabel={`发给 ${invitation.email} 的邀请操作`}
            menuClassName="w-52"
          >
            {(close) => (
              <>
                <li>
                  <button
                    disabled={isResending}
                    onClick={() => {
                      close();
                      onResend();
                    }}
                  >
                    <Send className="size-3.5" />
                    重新发送邀请
                  </button>
                </li>
                <li>
                  <button
                    className="text-error"
                    disabled={isCanceling}
                    onClick={() => {
                      close();
                      onCancel();
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    取消邀请
                  </button>
                </li>
              </>
            )}
          </PortalMenu>
        ) : null}
      </td>
    </tr>
  );
}
