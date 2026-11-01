import { createFileRoute } from "@tanstack/react-router";
import { Link2, ListPlus, MessagesSquare } from "lucide-react";
import { z } from "zod";
import { PromptResearchPage } from "@/client/features/ai-visibility/PromptResearchPage";
import { PromptTrackingWithoutUpgradeButton } from "@/client/features/ai-visibility/shared";
import { PaidPlanGate } from "@/client/features/billing/PaidPlanGate";

export const Route = createFileRoute(
  "/_app/p/$projectId/ai-visibility/research",
)({
  validateSearch: z.object({ q: z.string().trim().max(100).optional() }),
  component: AiResearchRoute,
});

const PROMPT_RESEARCH_FEATURES = [
  {
    icon: MessagesSquare,
    title: "市场相关问题",
    body: "查看人们围绕关键词提出的问题（按常见程度排序），以及 ChatGPT 对每个问题的回答。",
  },
  {
    icon: Link2,
    title: "谁被引用",
    body: "查看 ChatGPT 回答时引用了哪些网站，以及其中是否包含你的站点。",
  },
  {
    icon: ListPlus,
    title: "追踪重要问题",
    body: "选出值得关注的问题，一步加入提示词追踪。",
  },
];

function AiResearchRoute() {
  const { projectId } = Route.useParams();
  const { q } = Route.useSearch();
  return (
    <PaidPlanGate
      feature="提示词研究"
      description="找出人们关于你所在市场的提问，查看 ChatGPT 如何回答，以及答案引用了哪些网站。"
      features={PROMPT_RESEARCH_FEATURES}
      alternative={<PromptTrackingWithoutUpgradeButton projectId={projectId} />}
    >
      <PromptResearchPage key={projectId} projectId={projectId} keyword={q} />
    </PaidPlanGate>
  );
}
