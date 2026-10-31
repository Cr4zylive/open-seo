import { Crown, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { RowActionsMenu } from "@/client/components/RowActionsMenu";
import { Badge } from "@/client/components/ui/badge";
import { DropdownMenuItem } from "@/client/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/client/components/ui/table";
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

export type Member = {
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
  onTransferOwnership,
}: {
  member: Member;
  isSelf: boolean;
  canManageTeam: boolean;
  isOwner: boolean;
  isRemoving: boolean;
  onRemove: () => void;
  onTransferOwnership: () => void;
}) {
  const memberIsOwner = hasOrgPermission(member.role, {
    billing: ["manage"],
  });
  // Owners are protected server-side (only an owner can touch an owner; the
  // last owner can't be removed) — don't render controls that would just 403.
  const canRemove = canManageTeam && !isSelf && (!memberIsOwner || isOwner);
  // Owners can always remove, so this only ever adds to the remove menu.
  const canTransferOwnership = isOwner && !isSelf && !memberIsOwner;
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  return (
    <TableRow>
      <TableCell className="max-w-[280px]">
        <p className="truncate font-medium" data-ph-mask>
          {member.user.name || member.user.email}
          {isSelf ? (
            <span className="font-normal text-muted-foreground">（你）</span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground" data-ph-mask>
          {member.user.email}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{formatRole(member.role)}</Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">已加入</TableCell>
      <TableCell>
        {canRemove ? (
          <RowActionsMenu label={`${member.user.email}的操作`}>
            {canTransferOwnership ? (
              <DropdownMenuItem onClick={onTransferOwnership}>
                <Crown />
                转让所有权
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              disabled={isRemoving}
              onClick={() => setIsConfirmingRemove(true)}
            >
              <Trash2 />
              移除成员
            </DropdownMenuItem>
          </RowActionsMenu>
        ) : null}
        {isConfirmingRemove ? (
          <ConfirmDialog
            title={`将 ${member.user.email} 移出此组织？`}
            confirmLabel="移除成员"
            destructive
            onClose={() => setIsConfirmingRemove(false)}
            onConfirm={() => {
              setIsConfirmingRemove(false);
              onRemove();
            }}
          >
            他们会立即失去访问权限。
          </ConfirmDialog>
        ) : null}
      </TableCell>
    </TableRow>
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
    <TableRow>
      <TableCell className="max-w-[280px]">
        <p className="truncate font-medium" data-ph-mask>
          {invitation.email}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {formatRole(invitation.role ?? "member")}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        已邀请 · 到期{" "}
        {new Date(invitation.expiresAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {canManageTeam ? (
          <RowActionsMenu
            label={`发给 ${invitation.email} 的邀请的操作`}
          >
            <DropdownMenuItem disabled={isResending} onClick={onResend}>
              <Send />
              重新发送邀请
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={isCanceling}
              onClick={onCancel}
            >
              <Trash2 />
              取消邀请
            </DropdownMenuItem>
          </RowActionsMenu>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
