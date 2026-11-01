import { revalidateLogic } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useAppForm } from "@/client/components/form/useAppForm";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { captureClientEvent } from "@/client/lib/posthog";
import { saveReportTemplate } from "@/serverFunctions/reportTemplates";
import type { ReportTemplate } from "@/types/schemas/report-templates";

// One form for create and edit. Shape only, as at every other boundary: the
// caps come back from the service with their copy and show in a toast.
const formSchema = z.object({
  name: z.string().trim().min(1, "请给模板起个名字。"),
  description: z
    .string()
    .trim()
    .min(1, "请用一句话说明何时使用此模板。"),
  instructions: z
    .string()
    .trim()
    .min(1, "请说明报告给谁看、包含哪些部分。"),
});

const INSTRUCTIONS_PLACEHOLDER = `读者：客户的市场负责人，不是技术人员。
章节顺序：现状 / 本月做了什么 / 哪些指标有变化 / 下一步预期。
语气：平实、有把握。每个 SEO 术语都要解释。不要用感叹号。
落款：Acme SEO
强调色：#1C4ED8`;

export function ReportTemplateForm({
  projectId,
  template,
  onClose,
  onSaved,
}: {
  projectId: string;
  /** The template being edited, or undefined when creating one. */
  template?: ReportTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const saveMutation = useMutation({
    // A refusal (duplicate name, the cap) comes back as `{ ok: false }` rather
    // than an error, because thrown errors reach the client stripped to their
    // code. Rethrowing it here lets the mutation cache toast its message.
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const result = await saveReportTemplate({
        data: { projectId, templateId: template?.id, ...values },
      });
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      captureClientEvent("report_template:saved", {
        project_id: projectId,
        is_update: !result.created,
        source: "app",
      });
      toast.success(result.created ? "模板已创建" : "模板已保存");
      onSaved();
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: template?.name ?? "",
      description: template?.description ?? "",
      instructions: template?.instructions ?? "",
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: formSchema },
    onSubmit: ({ value }) => saveMutation.mutateAsync(value),
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saveMutation.isPending) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-2xl">
        <form.AppForm>
          <form.Form className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {template ? "编辑模板" : "新建模板"}
              </DialogTitle>
            </DialogHeader>

            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label="名称"
                  placeholder="月度客户沟通"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="description">
              {(field) => (
                <field.TextField
                  label="说明"
                  description="一句话说明何时使用。智能体会据此判断该用哪个模板。"
                  placeholder="发给包月客户的月度更新。"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="instructions">
              {(field) => (
                <field.TextareaField
                  label="撰写说明"
                  description="整个项目的品牌语气在「上下文 › 写作偏好」里。"
                  className="h-56 font-mono leading-relaxed md:text-xs"
                  placeholder={INSTRUCTIONS_PLACEHOLDER}
                  required
                />
              )}
            </form.AppField>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={saveMutation.isPending}
              >
                取消
              </Button>
              <form.SubmitButton>
                {template ? "保存更改" : "创建模板"}
              </form.SubmitButton>
            </DialogFooter>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
