import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAgentSetupPrompt } from "@/client/features/ai-mcp/agentSetupPrompt";
import {
  AgentSetupPanel,
  AGENT_SETUP_DESCRIPTION,
} from "@/client/features/ai-mcp/AgentSetupPanel";
import { CopyButton } from "@/client/components/CopyButton";
import { CreateProjectModal } from "@/client/features/projects/CreateProjectModal";
import { InviteTeammateModal } from "@/client/features/team/InviteTeammateModal";
import { PermissionHint } from "@/client/components/PermissionHint";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/client/components/ui/collapsible";
import { organizationContextQueryOptions } from "@/client/features/team/organizationQueries";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { captureClientEvent } from "@/client/lib/posthog";
import { hasOrgPermission } from "@/lib/org-permissions";
import type { DashboardSetupStep } from "@/types/schemas/dashboard";
import { parseResearchTarget } from "@/shared/researchScope";

const projectPrompt = `Use OpenSEO to set up a separate project for each website below. List my existing projects first and reuse matches so you don’t create duplicates. Set the country and language for each site, and ask me about anything missing.

Replace this list with my websites:
- Project name — website — country — language`;

export function DashboardSetupAction({
  step,
  projectId,
  domain,
  onComplete,
}: {
  step: DashboardSetupStep;
  projectId: string;
  domain: string | null;
  onComplete: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const org = useQuery(organizationContextQueryOptions());
  // Research steps open the page with the user's input already applied, so
  // the research runs on arrival and completes the step.
  if (step === "competitor")
    return (
      <StepInputForm
        description="查看竞争对手的域名，了解他们排名的主题以及链接到他们的网站。"
        label="竞争对手网站"
        placeholder="competitor.com"
        submitLabel="分析竞争对手"
        validate={validateDomain}
        onSubmit={(value) => {
          onComplete();
          void navigate({
            to: "/p/$projectId/domain",
            params: { projectId },
            search: { domain: parseDomain(value) },
          });
        }}
      />
    );
  if (step === "keywords")
    return (
      <StepInputForm
        description="从一个描述你产品的关键词出发，获取带搜索量和难度的相关搜索。"
        label="种子关键词"
        placeholder="例如 跑鞋"
        submitLabel="获取关键词灵感"
        validate={(value) =>
          value.trim() ? undefined : "请输入一个起始关键词"
        }
        onSubmit={(value) => {
          onComplete();
          void navigate({
            to: "/p/$projectId/keywords",
            params: { projectId },
            search: { q: value.trim() },
          });
        }}
      />
    );
  if (step === "audit")
    return (
      <StepInputForm
        description="抓取你的网站，查找失效链接、缺失标签以及搜索引擎无法收录的页面。开始前可以调整抓取规模。"
        label="网站网址"
        placeholder="https://example.com"
        defaultValue={domain ? `https://${domain}` : ""}
        submitLabel="设置审计"
        validate={validateDomain}
        onSubmit={(value) => {
          onComplete();
          void navigate({
            to: "/p/$projectId/audit",
            params: { projectId },
            search: { url: value.trim() },
          });
        }}
      />
    );
  if (step === "mcp")
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {AGENT_SETUP_DESCRIPTION}
        </p>
        <AgentSetupPanel
          prompt={getAgentSetupPrompt(
            typeof window === "undefined"
              ? "https://app.openseo.so"
              : window.location.origin,
          )}
          onCopy={() =>
            captureClientEvent("onboarding:setup_prompt_copy", {
              source: "dashboard",
            })
          }
        />
      </div>
    );

  const canManage =
    org.data &&
    hasOrgPermission(
      org.data.role,
      step === "project" ? { project: ["create"] } : { invitation: ["create"] },
    );
  if (!canManage)
    return org.isPending ? (
      <p className="text-sm text-muted-foreground">
        正在检查工作区权限…
      </p>
    ) : org.isError ? (
      <p className="text-sm text-muted-foreground">
        {getStandardErrorMessage(org.error)}
      </p>
    ) : (
      <PermissionHint action="协助完成此步骤" />
    );
  if (step === "project")
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          把每个网站的研究、排名和连接放在各自的项目里。随时用侧栏的项目切换器
          → 新建项目。
        </p>
        <Button onClick={() => setShowModal(true)}>
          再创建一个项目
        </Button>
        <Collapsible className="rounded-lg border border-border p-4">
          <CollapsibleTrigger className="cursor-pointer text-sm font-medium">
            有一批网站？让智能体帮你建好。
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              <Link
                to="/ai"
                className="text-primary underline-offset-4 hover:underline"
              >
                连接智能体
              </Link>
              ，然后把提示词和网站列表一起粘贴进去。
            </p>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted-foreground">
              {projectPrompt}
            </pre>
            <CopyButton
              value={projectPrompt}
              label="复制项目提示词"
              successMessage="已复制项目提示词"
            />
          </CollapsibleContent>
        </Collapsible>
        {showModal && (
          <CreateProjectModal onClose={() => setShowModal(false)} />
        )}
      </div>
    );
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        邀请同事加入工作区，一起共享项目、研究和结果。
      </p>
      <Button onClick={() => setShowModal(true)}>邀请同事</Button>
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

function validateDomain(value: string) {
  const parsed = parseResearchTarget(value);
  return parsed.ok ? undefined : parsed.message;
}

function parseDomain(value: string) {
  const parsed = parseResearchTarget(value);
  return parsed.ok ? parsed.target.hostname : value.trim();
}

function StepInputForm({
  description,
  label,
  placeholder,
  defaultValue = "",
  submitLabel,
  validate,
  onSubmit,
}: {
  description: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  submitLabel: string;
  validate: (value: string) => string | undefined;
  onSubmit: (value: string) => void;
}) {
  const form = useForm({
    defaultValues: { value: defaultValue },
    onSubmit: ({ value }) => onSubmit(value.value),
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
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <form.Field
        name="value"
        validators={{
          // Stay quiet while the user is still typing; validate on submit, and
          // keep validating live after the first attempt.
          onChange: ({ value, fieldApi }) =>
            fieldApi.form.state.submissionAttempts > 0
              ? validate(value)
              : undefined,
        }}
      >
        {(field) => (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{label}</span>
            <Input
              type="text"
              maxLength={255}
              placeholder={placeholder}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
              className="h-12 px-4 md:text-base"
            />
            {field.state.meta.errors.length > 0 && (
              <span className="text-xs text-destructive">
                {field.state.meta.errors.join(", ")}
              </span>
            )}
          </label>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Button type="submit" size="lg" disabled={!canSubmit}>
            {submitLabel}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
