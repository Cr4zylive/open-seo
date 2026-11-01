import { useMutation } from "@tanstack/react-query";
import { revalidateLogic } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAppForm } from "@/client/components/form/useAppForm";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { getErrorCode } from "@/client/lib/error-messages";
import { captureClientEvent } from "@/client/lib/posthog";
import { isHostedClientAuthMode, usesBetterAuthClient } from "@/lib/auth-mode";
import { sendTeamInvitation } from "@/serverFunctions/organization";

const inviteSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址。"),
});

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

// Without an email transport (the standalone Docker edition) the server hands
// back the invitation link for the inviter to pass on; with one, it was sent.
export function announceInvitation(
  result: { invitationId: string; inviteUrl?: string },
  sentMessage: string,
) {
  if (!result.inviteUrl) {
    toast.success(sentMessage);
    return;
  }
  const inviteUrl = result.inviteUrl;
  void (
    navigator.clipboard?.writeText(inviteUrl) ?? Promise.reject(new Error())
  ).then(
    () => toast.success("邀请链接已复制"),
    () =>
      toast.success("邀请链接", {
        description: inviteUrl,
        duration: 20000,
      }),
  );
}

export function InviteTeammateModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  // Server function (not authClient.inviteMember): it enforces the daily send
  // limits and fails visibly when the invite email doesn't send.
  const inviteMutation = useMutation({
    mutationFn: (inviteeEmail: string) =>
      sendTeamInvitation({ data: { email: inviteeEmail } }),
    onSuccess: (result) => {
      captureClientEvent("team:invitation_send");
      announceInvitation(result, "邀请已发送");
      onInvited();
      onClose();
    },
    onError: (error: Error) => {
      if (getErrorCode(error) === "CONFLICT") {
        form.setErrorMap({
          onSubmit: { fields: { email: "此人已经是成员。" } },
        });
      } else {
        toast.error(inviteErrorMessage(error));
      }
      // An email-send failure still creates the pending row — show it.
      onInvited();
    },
  });

  const sharesLink = usesBetterAuthClient() && !isHostedClientAuthMode();

  const form = useAppForm({
    defaultValues: { email: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: inviteSchema },
    onSubmit: ({ value }) => inviteMutation.mutateAsync(value.email.trim()),
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !inviteMutation.isPending) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <form.AppForm>
          <form.Form className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>邀请同事</DialogTitle>
              <DialogDescription>
                {sharesLink
                  ? "他们将以管理员身份加入，可访问每个项目。把邀请链接发给他们，对方用它创建账户。链接 7 天后过期。"
                  : "他们将以管理员身份加入，可访问每个项目（账单除外）。邀请链接 7 天后过期。"}
              </DialogDescription>
            </DialogHeader>
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label="邮箱"
                  type="email"
                  placeholder="teammate@company.com"
                  required
                  autoFocus
                />
              )}
            </form.AppField>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={inviteMutation.isPending}
              >
                取消
              </Button>
              <form.SubmitButton>发送邀请</form.SubmitButton>
            </DialogFooter>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
