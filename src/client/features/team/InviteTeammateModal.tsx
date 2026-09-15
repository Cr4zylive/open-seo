import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getErrorCode } from "@/client/lib/error-messages";
import { captureClientEvent } from "@/client/lib/posthog";
import { sendTeamInvitation } from "@/serverFunctions/organization";

export function inviteErrorMessage(error: Error) {
  const code = getErrorCode(error);
  if (code === "RATE_LIMITED") {
    return "今日邀请次数已达上限，请明天再试。";
  }
  if (code === "UPSTREAM_UNAVAILABLE") {
    return "邀请已保存，但邮件未能发出。请稍后再点「重新发送」。";
  }
  return "无法发送该邀请。";
}

export function InviteTeammateModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");

  // Server function (not authClient.inviteMember): it enforces the daily send
  // limits and fails visibly when the invite email doesn't send.
  const inviteMutation = useMutation({
    mutationFn: (inviteeEmail: string) =>
      sendTeamInvitation({ data: { email: inviteeEmail } }),
    onSuccess: () => {
      captureClientEvent("team:invitation_send");
      toast.success("邀请已发送");
      onInvited();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(inviteErrorMessage(error));
      // An email-send failure still creates the pending row — show it.
      onInvited();
    },
  });

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = email.trim();
            if (trimmed) inviteMutation.mutate(trimmed);
          }}
        >
          <h3 className="text-lg font-bold">邀请同事</h3>
          <p className="mt-2 text-sm text-base-content/60">
            对方将以管理员身份加入，除账单外可访问每个项目。邀请链接 7 天后过期。
          </p>
          <label className="form-control mt-4 w-full">
            <span className="label-text pb-1 text-xs text-base-content/60">
              邮箱
            </span>
            <input
              type="email"
              className="input input-sm input-bordered w-full"
              placeholder="teammate@company.com"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              autoFocus
            />
          </label>
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={inviteMutation.isPending || !email.trim()}
            >
              {inviteMutation.isPending ? "发送中…" : "发送邀请"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
