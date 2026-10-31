import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { everyAppAccountQueryOptions } from "@/client/features/every-app/everyAppAccountQueries";
import { z } from "zod";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/client/components/ui/tabs";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { PageHeader } from "@/client/components/PageHeader";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { getClientAuthMode } from "@/lib/auth-mode";
import { captureClientEvent } from "@/client/lib/posthog";
import {
  agentUpdatePrompt,
  getAgentSetupPrompt,
} from "@/client/features/ai-mcp/agentSetupPrompt";
import { CopyButton } from "@/client/components/CopyButton";
import { AgentList } from "@/client/features/ai-mcp/AgentList";

const DOCS_URL = "https://openseo.so/docs/agent-setup";

const COACH_DOCS_URL = "https://openseo.so/docs/skills/seo-coach";
const LINK_CLASS =
  "text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground";
const MUTED_LINK_CLASS =
  "inline-flex items-center gap-1 text-sm text-muted-foreground underline decoration-foreground/25 underline-offset-4 hover:text-foreground";
const SKILLS = [
  ["seo-coach", "说明你现在的位置，并选出下一步。"],
  [
    "seo-project-setup",
    "把目标、竞争对手和关键页面存为共享上下文。",
  ],
  [
    "seo-audit",
    "一页纸网站审计，围绕本周要做的一件事。",
  ],
  [
    "ai-visibility-audit",
    "找出最可能让你出现在 AI 回答里的几处改动。",
  ],
  [
    "ai-prompt-research",
    "找出人们在 ChatGPT 里怎么问你的市场，以及谁被引用。",
  ],
  ["keyword-research", "从几个种子主题找出关键词机会。"],
  ["keyword-clustering", "按意图聚类关键词，并映射到页面。"],
  ["competitive-landscape", "画出谁在你的市场里赢，以及为什么。"],
  [
    "competitor-analysis",
    "研究一个竞争对手的关键词、内容和反向链接。",
  ],
  ["link-prospecting", "找外链机会并起草外联邮件。"],
  ["local-seo", "审计 Google 商家资料和地图可见度。"],
  ["seo-report", "把以上任何一项存为报告页上的报告。"],
];

const aiSearchSchema = z.object({
  // Active tab. Omitted for the default "setup" tab.
  tab: z.enum(["skills"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_app/ai")({
  validateSearch: aiSearchSchema,
  component: AiPage,
});

const everyApp = getClientAuthMode() === "everyapp";

function AiPage() {
  const { tab = "setup" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const origin = window.location.origin;
  const mcpUrl = `${origin}/mcp`;
  const prompt = getAgentSetupPrompt(origin);

  return (
    <div className="h-full overflow-auto px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="智能体设置"
          description="用 OpenSEO 最有效的方式，是通过你已经在用的 AI 智能体。设置一次，然后随便问。"
        />

        <Tabs
          value={tab}
          onValueChange={(value) =>
            void navigate({
              search: { tab: value === "skills" ? "skills" : undefined },
              replace: true,
            })
          }
          className="mt-8"
        >
          <TabsList variant="line">
            <TabsTrigger value="setup">设置智能体</TabsTrigger>
            <TabsTrigger value="skills">技能</TabsTrigger>
          </TabsList>
          <TabsContent value="setup">
            {everyApp ? (
              <EveryAppAgentSetup />
            ) : (
              <>
                <div className="mt-6 space-y-5">
                  <Card size="lg">
                    <CardHeader>
                      <CardTitle>
                        <h2>设置智能体</h2>
                      </CardTitle>
                      <CardDescription>
                        把配置提示词粘贴到智能体里，即可连接 OpenSEO
                        并安装 SEO 技能。如有需要手动完成的步骤，它会引导你。
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AgentList />
                      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                        <CopyButton
                          variant="default"
                          size="lg"
                          value={prompt}
                          label="复制配置提示词"
                          successMessage="已复制配置提示词"
                          onCopy={() =>
                            captureClientEvent("mcp:setup_prompt_copy")
                          }
                        />
                        <a
                          href={`${DOCS_URL}#set-up-your-agent`}
                          target="_blank"
                          rel="noreferrer"
                          className={MUTED_LINK_CLASS}
                        >
                          设置说明
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      </div>
                    </CardContent>
                    <CardFooter className="text-muted-foreground">
                      <p>
                        连接后，让智能体使用{" "}
                        <a
                          href={COACH_DOCS_URL}
                          target="_blank"
                          rel="noreferrer"
                          className={LINK_CLASS}
                        >
                          SEO Coach
                        </a>{" "}
                        帮你决定下一步做什么。
                      </p>
                    </CardFooter>
                  </Card>

                  <Card size="lg">
                    <CardHeader>
                      <CardTitle>
                        <h2>更新技能</h2>
                      </CardTitle>
                      <CardDescription>
                        已经连上了？把更新提示词粘贴到智能体里，即可拿到最新
                        OpenSEO 技能，并保留连接设置和个人修改。
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-3">
                      <CopyButton
                        variant="default"
                        size="lg"
                        value={agentUpdatePrompt}
                        label="复制更新提示词"
                        successMessage="已复制更新提示词"
                        onCopy={() =>
                          captureClientEvent("mcp:update_prompt_copy")
                        }
                      />
                      <a
                        href={`${DOCS_URL}#update-your-skills`}
                        target="_blank"
                        rel="noreferrer"
                        className={MUTED_LINK_CLASS}
                      >
                        更新说明
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                </div>

                {getClientAuthMode() === "cloudflare_access" ? (
                  <Alert variant="warning" className="mt-8">
                    <ShieldAlert />
                    <AlertDescription>
                      此实例位于 Cloudflare Access 之后。在 Access
                      应用上启用 Managed OAuth 之前，MCP 客户端无法连接。{" "}
                      <a
                        href="https://openseo.so/docs/self-hosting/cloudflare#connect-the-mcp-server-through-cloudflare-access"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium"
                      >
                        设置指南
                      </a>
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                  <span>
                    此实例的 MCP 服务器网址：{" "}
                    <code className="font-mono text-foreground/80">
                      {mcpUrl}
                    </code>
                  </span>
                  <CopyButton
                    value={mcpUrl}
                    successMessage="MCP 网址已复制"
                    onCopy={() => captureClientEvent("mcp:setup_url_copy")}
                  />
                </div>
              </>
            )}
          </TabsContent>
          <TabsContent value="skills">
            <section className="mt-6">
              <p className="text-sm text-muted-foreground">
                {everyApp
                  ? "用 npx skills add every-app/open-seo 安装。"
                  : "配置提示词会安装这些技能。"}{" "}
                需要完整报告而不是快速回答时，按名称运行其中一个。
              </p>
              <ul className="mt-5 space-y-3 text-sm sm:space-y-2">
                {SKILLS.map(([name, blurb]) => (
                  <li
                    key={name}
                    className="flex flex-col gap-0.5 sm:flex-row sm:gap-3"
                  >
                    <a
                      href={`https://openseo.so/docs/skills/${name}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`shrink-0 font-mono text-[13px] sm:w-48 ${LINK_CLASS}`}
                    >
                      /{name}
                    </a>
                    <span className="text-muted-foreground">{blurb}</span>
                  </li>
                ))}
              </ul>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const EVERY_APP_SKILLS_COMMAND = "npx skills add every-app/open-seo";

/**
 * Behind Every App the agent connects to the gateway's MCP address, which
 * covers every app on it; OpenSEO serves no MCP of its own here. The skills
 * install on their own.
 */
function EveryAppAgentSetup() {
  const gatewayUrl = useQuery(everyAppAccountQueryOptions()).data?.gatewayUrl;
  return (
    <div className="mt-6 space-y-5">
      <Card size="lg">
        <CardHeader>
          <CardTitle>
            <h2>把智能体连到 Every App</h2>
          </CardTitle>
          <CardDescription>
            Every App 给智能体一个地址，覆盖 OpenSEO
            和其他应用。连接一次即可。
          </CardDescription>
        </CardHeader>
        {gatewayUrl ? (
          <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <code className="font-mono text-sm">{gatewayUrl}/mcp</code>
            <CopyButton
              value={`${gatewayUrl}/mcp`}
              successMessage="MCP 网址已复制"
            />
          </CardContent>
        ) : null}
      </Card>

      <Card size="lg">
        <CardHeader>
          <CardTitle>
            <h2>安装 SEO 技能</h2>
          </CardTitle>
          <CardDescription>
            在终端运行此命令，把 OpenSEO 的技能加到智能体。它们通过
            Every App 连接使用 OpenSEO。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <code className="font-mono text-sm">{EVERY_APP_SKILLS_COMMAND}</code>
          <CopyButton
            value={EVERY_APP_SKILLS_COMMAND}
            successMessage="命令已复制"
          />
        </CardContent>
        <CardFooter className="text-muted-foreground">
          <p>
            连接后，让智能体使用{" "}
            <a
              href={COACH_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className={LINK_CLASS}
            >
              SEO Coach
            </a>{" "}
            帮你决定下一步做什么。
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
