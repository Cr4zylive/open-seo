import { Bot, FolderPlus, Globe, Search, Users } from "lucide-react";
import type { DashboardActivation } from "@/server/features/dashboard/services/DashboardService";
import type { DashboardSetupStep } from "@/types/schemas/dashboard";

export const setupSteps: {
  id: DashboardSetupStep;
  label: string;
  detail: string;
  icon: typeof Globe;
}[] = [
  {
    id: "domain",
    label: "添加网站",
    detail: "设置此项目的网站和国家/地区。",
    icon: Globe,
  },
  {
    id: "project",
    label: "要管理多个网站？",
    detail:
      "再创建一个项目，或让 AI 智能体帮你配置一批站点。",
    icon: FolderPlus,
  },
  {
    id: "competitor",
    label: "研究竞争对手",
    detail: "找出值得学习的主题和链接。",
    icon: Search,
  },
  {
    id: "mcp",
    label: "连接 AI 智能体",
    detail: "在 Claude 或你常用的智能体里使用 OpenSEO。",
    icon: Bot,
  },
  {
    id: "gsc",
    label: "连接 Search Console",
    detail: "把真实点击和查询词拉进来。",
    icon: Search,
  },
  {
    id: "team",
    label: "邀请同事",
    detail: "一起协作，或暂时自己用。",
    icon: Users,
  },
];

export function getStepStatus(
  activation: DashboardActivation,
  step: DashboardSetupStep,
): "done" | "skipped" | "todo" {
  const completed: Record<DashboardSetupStep, boolean> = {
    domain: activation.domain !== null,
    project: activation.hasMultipleProjects,
    competitor: activation.competitorClickedAt !== null,
    mcp:
      activation.mcp.authorizedAt !== null ||
      activation.mcp.firstToolCallAt !== null,
    gsc: activation.gsc.connected,
    team: activation.hasTeammate,
  };
  if (completed[step]) return "done";
  // Preserve previous MCP dismissals without treating them as authorization.
  if (
    activation.dismissedSteps.includes(step) ||
    (step === "mcp" && activation.mcp.cardDismissedAt !== null)
  )
    return "skipped";
  return "todo";
}
