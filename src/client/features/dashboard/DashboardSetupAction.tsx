import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAgentSetupPrompt } from "@/client/features/ai-mcp/agentSetupPrompt";
import { CopyButton } from "@/client/features/ai-mcp/SetupControls";
import { SearchConsoleConnectionCard } from "@/client/features/gsc/SearchConsoleConnectionCard";
import { CreateProjectModal } from "@/client/features/projects/CreateProjectModal";
import { ProjectMarketFields } from "@/client/features/projects/ProjectMarketFields";
import type { ProjectSummary } from "@/client/features/projects/types";
import { InviteTeammateModal } from "@/client/features/team/InviteTeammateModal";
import { organizationContextQueryOptions } from "@/client/features/team/organizationQueries";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { captureClientEvent } from "@/client/lib/posthog";
import { hasOrgPermission } from "@/lib/org-permissions";
import { getProjects, setProjectWebsite } from "@/serverFunctions/projects";
import { markDashboardCompetitorClicked } from "@/serverFunctions/dashboard";
import type { DashboardSetupStep } from "@/types/schemas/dashboard";
import { parseResearchTarget } from "@/shared/researchScope";

const projectPrompt = `Use OpenSEO to set up a separate project for each website below. List my existing projects first and reuse matches so you don’t create duplicates. Set the country and language for each site, and ask me about anything missing.

Replace this list with my websites:
- Project name — website — country — language`;

export function DashboardSetupAction({
  step,
  projectId,
  onComplete,
}: {
  step: DashboardSetupStep;
  projectId: string;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const org = useQuery(organizationContextQueryOptions());
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
    enabled: step === "domain",
  });
  const project = projects.data?.find((item) => item.id === projectId);
  const competitor = useMutation({
    mutationFn: () => markDashboardCompetitorClicked({ data: { projectId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboardActivation", projectId],
      });
      onComplete();
      void navigate({ to: "/p/$projectId/domain", params: { projectId } });
    },
    onError: (error) => toast.error(getStandardErrorMessage(error)),
  });
  if (step === "domain")
    return project ? (
      <WebsiteForm project={project} onComplete={onComplete} />
    ) : projects.isError ? (
      <p role="alert" className="text-sm text-error">
        {getStandardErrorMessage(projects.error)}
      </p>
    ) : (
      <div className="skeleton h-36" aria-busy />
    );
  if (step === "mcp")
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm leading-relaxed text-base-content/65">
          把这段提示词粘贴到你的 AI 智能体，即可自动完成 OpenSEO 配置。
        </p>
        <div className="flex flex-col gap-4 rounded-lg border border-base-300 bg-base-200/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">OpenSEO 插件</p>
            <p className="mt-1 text-xs text-base-content/60">
              MCP 连接 + SEO 技能
            </p>
          </div>
          <div className="shrink-0 [&>button]:h-10 [&>button]:w-full [&>button]:gap-2 [&>button]:text-sm">
            <CopyButton
              primary
              value={getAgentSetupPrompt(
                typeof window === "undefined"
                  ? "https://app.openseo.so"
                  : window.location.origin,
              )}
              label="复制配置提示词"
              successMessage="已复制配置提示词"
              onCopy={() =>
                captureClientEvent("onboarding:setup_prompt_copy", {
                  source: "dashboard",
                })
              }
            />
          </div>
        </div>
        <a
          href="https://openseo.so/docs/mcp"
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-base-content/60 underline decoration-base-content/25 underline-offset-4 hover:text-base-content"
        >
          手动配置说明
        </a>
      </div>
    );
  if (step === "competitor")
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-base-content/65">
          查看竞争对手的域名，了解他们排名的主题以及指向他们的网站。
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={competitor.isPending}
          onClick={() => competitor.mutate()}
        >
          打开域名查询
        </button>
      </div>
    );

  const canManage =
    org.data &&
    hasOrgPermission(
      org.data.role,
      step === "project"
        ? { project: ["create"] }
        : step === "team"
          ? { invitation: ["create"] }
          : { integration: ["manage"] },
    );
  if (!canManage)
    return (
      <p className="text-sm text-base-content/65">
        {org.isPending
          ? "正在检查工作区权限…"
          : org.isError
            ? getStandardErrorMessage(org.error)
            : "请让工作区所有者或管理员协助完成此步骤。"}
      </p>
    );
  if (step === "gsc")
    return (
      <SearchConsoleConnectionCard
        projectId={projectId}
        returnTo={
          typeof window === "undefined"
            ? undefined
            : `${window.location.href.split("#")[0]}#connect-gsc`
        }
      />
    );
  if (step === "project")
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-base-content/65">
          每个网站的研究、排名和连接都放在独立项目中。随时可在侧边栏的项目切换器中选择「新建项目」。
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setShowModal(true)}
        >
          再创建一个项目
        </button>
        <details className="rounded-lg border border-base-300 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            有一批网站要配置？可以让智能体帮你完成。
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-sm text-base-content/65">
              <Link to="/ai" className="link">
                连接智能体
              </Link>
              ，然后把网站列表填进这段提示词并粘贴过去。
            </p>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-base-content/65">
              {projectPrompt}
            </pre>
            <CopyButton
              value={projectPrompt}
              label="复制项目提示词"
              successMessage="已复制项目提示词"
            />
          </div>
        </details>
        {showModal && (
          <CreateProjectModal onClose={() => setShowModal(false)} />
        )}
      </div>
    );
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-base-content/65">
        邀请同事加入工作区，一起共享项目、研究和结果。
      </p>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => setShowModal(true)}
      >
        邀请同事
      </button>
      {showModal && (
        <InviteTeammateModal
          onClose={() => setShowModal(false)}
          onInvited={() => {
            void queryClient.invalidateQueries({
              queryKey: ["organization-team"],
            });
            void queryClient.invalidateQueries({
              queryKey: ["dashboardActivation"],
            });
          }}
        />
      )}
    </div>
  );
}

function WebsiteForm({
  project,
  onComplete,
}: {
  project: ProjectSummary;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (value: {
      domain: string;
      locationCode: number;
      languageCode: string;
    }) => setProjectWebsite({ data: { projectId: project.id, ...value } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({
          queryKey: ["dashboardActivation", project.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboardOverview", project.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectAccess", project.id],
        }),
      ]);
      toast.success("网站已保存");
      onComplete();
    },
    onError: (error) =>
      toast.error(
        getStandardErrorMessage(
          error,
          "无法保存网站，请重试。",
        ),
      ),
  });
  const form = useForm({
    defaultValues: {
      domain: project.domain ?? "",
      market: {
        locationCode: project.locationCode,
        languageCode: project.languageCode,
      },
    },
    onSubmit: ({ value }) =>
      save.mutate({ domain: value.domain.trim(), ...value.market }),
  });
  return (
    <form
      className="max-w-lg space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <p className="text-sm leading-relaxed text-base-content/65">
        为此项目添加网站，并选择客户搜索时所在的国家/地区。之后可随时在项目设置中修改。
      </p>
      <form.Field
        name="domain"
        validators={{
          onChange: ({ value }) => {
            const parsed = parseResearchTarget(value);
            return parsed.ok ? undefined : parsed.message;
          },
        }}
      >
        {(field) => (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">网站</span>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="example.com"
              className="input input-bordered w-full"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors.length > 0 && (
              <span className="text-xs text-error">
                {field.state.meta.errors.join(", ")}
              </span>
            )}
          </label>
        )}
      </form.Field>
      <form.Field name="market">
        {(field) => (
          <ProjectMarketFields
            value={field.state.value}
            onChange={field.handleChange}
          />
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!canSubmit || isSubmitting || save.isPending}
          >
            {save.isPending ? "保存中…" : "保存网站"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
