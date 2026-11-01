import {
  Bot,
  ClipboardCheck,
  FolderPlus,
  Globe,
  Lightbulb,
  Users,
} from "lucide-react";
import type { DashboardActivation } from "@/server/features/dashboard/services/DashboardService";
import type { DashboardSetupStep } from "@/types/schemas/dashboard";

export const setupSteps: {
  id: DashboardSetupStep;
  label: string;
  detail: string;
  icon: typeof Globe;
  skipLabel: string;
}[] = [
  {
    id: "competitor",
    label: "研究竞争对手",
    detail: "找出值得学习的主题和链接。",
    icon: Globe,
    skipLabel: "暂时跳过",
  },
  {
    id: "keywords",
    label: "获取关键词灵感",
    detail: "从一个关键词出发，看看人们还在搜什么。",
    icon: Lightbulb,
    skipLabel: "暂时跳过",
  },
  {
    id: "audit",
    label: "审计你的网站",
    detail: "抓取失效链接、缺失标签和可索引性问题。",
    icon: ClipboardCheck,
    skipLabel: "暂时跳过",
  },
  {
    id: "mcp",
    label: "连接 AI 智能体",
    detail: "在 Claude 或你常用的智能体里使用 OpenSEO。",
    icon: Bot,
    skipLabel: "暂时跳过",
  },
  {
    id: "team",
    label: "邀请同事",
    detail: "一起协作，或暂时自己用。",
    icon: Users,
    skipLabel: "暂时跳过",
  },
  {
    id: "project",
    label: "要管理多个网站？",
    detail:
      "再创建一个项目，或让 AI 智能体帮你配置一批站点。",
    icon: FolderPlus,
    skipLabel: "我只需要一个项目",
  },
];

export function getStepStatus(
  activation: DashboardActivation,
  step: DashboardSetupStep,
): "done" | "skipped" | "todo" {
  const completed: Record<DashboardSetupStep, boolean> = {
    competitor: activation.competitorResearchedAt !== null,
    keywords: activation.keywordsResearchedAt !== null,
    audit: activation.hasAudit,
    mcp:
      activation.mcp.authorizedAt !== null ||
      activation.mcp.firstToolCallAt !== null,
    team: activation.hasTeammate,
    project: activation.hasMultipleProjects,
  };
  if (completed[step]) return "done";
  if (!activation.dismissedSteps.includes(step)) return "todo";
  return completeWhenSkipped.has(step) ? "done" : "skipped";
}

// Skipping these marks them complete, so they never wait in "saved for later".
const completeWhenSkipped = new Set<DashboardSetupStep>(["team", "project"]);
