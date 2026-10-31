import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { revalidateLogic } from "@tanstack/react-form";
import { useAppForm } from "@/client/components/form/useAppForm";
import { InlineConfirm } from "@/client/components/InlineConfirm";
import { SectionHeader } from "@/client/components/PageHeader";
import { QueryError, QueryState } from "@/client/components/QueryState";
import { ProjectMarketFields } from "@/client/features/projects/ProjectMarketFields";
import {
  clearLastProjectId,
  getLastProjectId,
} from "@/client/lib/active-project";
import { toastInitialAudit } from "@/client/features/projects/initialAuditToast";
import { archiveProject, updateProject } from "@/serverFunctions/projects";
import { isEveryAppClientAuthMode } from "@/lib/auth-mode";
import type { ProjectSummary } from "./types";

export function ProjectGeneralSettings({ projectId }: { projectId: string }) {
  const projectsQuery = useQuery(projectsQueryOptions());

  return (
    <QueryState
      query={projectsQuery}
      errorFallback="项目加载失败"
    >
      {(projects) => {
        const project = projects.find((entry) => entry.id === projectId);
        if (!project) {
          return <QueryError fallback="未找到该项目。" />;
        }
        return (
          <div className="space-y-8">
            {/* key resets the form's local state when switching between projects */}
            <GeneralSection key={project.id} project={project} />
            <DangerSection project={project} canArchive={projects.length > 1} />
          </div>
        );
      }}
    </QueryState>
  );
}

const generalSchema = z.object({
  name: z.string().trim().min(1, "请输入项目名称。"),
  domain: z.string(),
  market: z.object({ locationCode: z.number(), languageCode: z.string() }),
});

function GeneralSection({ project }: { project: ProjectSummary }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof generalSchema>) =>
      updateProject({
        data: {
          projectId: project.id,
          name: values.name.trim(),
          domain: values.domain.trim() || undefined,
          ...values.market,
        },
      }),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: projectsQueryOptions().queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: ["dashboardActivation", project.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["dashboardOverview", project.id],
      });
      toast.success("项目已更新");
      toastInitialAudit(saved.initialAudit);
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: project.name,
      domain: project.domain ?? "",
      market: {
        locationCode: project.locationCode,
        languageCode: project.languageCode,
      },
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: generalSchema },
    onSubmit: async ({ value, formApi }) => {
      await updateMutation.mutateAsync(value);
      // The saved values are the new baseline, so Save disables again. An edit
      // made while the save ran replaces the values object, and then the form
      // keeps that edit and Save stays on.
      if (formApi.state.values === value) formApi.reset(value);
    },
  });

  return (
    <section className="space-y-3">
      <SectionHeader title="常规" />
      <form.AppForm>
        <form.Form className="flex flex-col gap-4">
          <form.AppField name="name">
            {(field) => (
              <field.TextField label="名称" maxLength={120} required />
            )}
          </form.AppField>

          <p className="text-sm text-muted-foreground">
            {isEveryAppClientAuthMode()
              ? "添加网站后会启动 50 页站点审计。"
              : "添加网站后会启动 50 页扫描并渲染 JavaScript。渲染会消耗积分。"}
          </p>
          <form.AppField name="domain">
            {(field) => (
              <field.TextField
                label={
                  <>
                    域名{" "}
                    <span className="font-normal text-muted-foreground">
                      （可选）
                    </span>
                  </>
                }
                placeholder="example.com"
                maxLength={255}
              />
            )}
          </form.AppField>

          <div className="flex flex-col gap-1.5">
            <form.Field name="market">
              {(field) => (
                <ProjectMarketFields
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
            <span className="text-xs text-muted-foreground">
              关键词、SERP 和域名数据会使用该国家/地区和语言，除非某次调用另行指定。
            </span>
          </div>

          <div className="flex justify-end">
            <form.Subscribe selector={(state) => state.isDefaultValue}>
              {(isDefaultValue) => (
                <form.SubmitButton disabled={isDefaultValue}>
                  保存更改
                </form.SubmitButton>
              )}
            </form.Subscribe>
          </div>
        </form.Form>
      </form.AppForm>
    </section>
  );
}

function DangerSection({
  project,
  canArchive,
}: {
  project: ProjectSummary;
  canArchive: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const archiveMutation = useMutation({
    mutationFn: () => archiveProject({ data: { projectId: project.id } }),
    onSuccess: async () => {
      if (getLastProjectId() === project.id) clearLastProjectId();
      await queryClient.invalidateQueries({
        queryKey: projectsQueryOptions().queryKey,
      });
      toast.success("项目已归档");
      // Re-resolve to a remaining project via the landing redirect.
      void navigate({ to: "/" });
    },
  });

  return (
    <section className="space-y-3 border-t border-border pt-8">
      <SectionHeader title="归档项目" />
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {canArchive
            ? "归档会从工作区移除该项目，并停止其定时排名追踪。之后可在项目页恢复。"
            : "仅有一个项目时无法归档。"}
        </p>
        <div className="flex shrink-0 gap-2">
          <InlineConfirm
            label={`归档 ${project.name}`}
            triggerLabel="归档项目"
            confirmLabel="确认归档项目"
            pending={archiveMutation.isPending}
            disabled={!canArchive}
            onConfirm={() => archiveMutation.mutate()}
          />
        </div>
      </div>
    </section>
  );
}
