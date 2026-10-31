import {
  Bookmark,
  Bot,
  Brain,
  ChartLine,
  ClipboardCheck,
  FileText,
  Globe,
  LayoutDashboard,
  Link2,
  MapPin,
  MessageSquare,
  Search,
  TrendingUp,
} from "lucide-react";
import { linkOptions } from "@tanstack/react-router";
import { GoogleGlyphMuted } from "@/client/features/gsc/GoogleGlyph";

const projectNavItems = [
  {
    to: "/p/$projectId" as const,
    label: "仪表盘",
    icon: LayoutDashboard,
    // Without exact matching, the index path is a prefix of every project
    // route and the Dashboard item would render active everywhere.
    activeOptions: { exact: true, includeSearch: false },
  },
  {
    to: "/p/$projectId/keywords" as const,
    label: "关键词研究",
    icon: Search,
  },
  {
    to: "/p/$projectId/saved" as const,
    label: "已保存关键词",
    icon: Bookmark,
  },
  {
    to: "/p/$projectId/rank-tracking" as const,
    label: "排名追踪",
    icon: TrendingUp,
  },
  {
    to: "/p/$projectId/local-seo" as const,
    label: "本地 SEO",
    icon: MapPin,
  },
  {
    to: "/p/$projectId/search-performance" as const,
    label: "GSC 洞察",
    icon: GoogleGlyphMuted,
  },
  {
    to: "/p/$projectId/domain" as const,
    label: "域名概览",
    icon: Globe,
  },
  {
    to: "/p/$projectId/backlinks" as const,
    label: "反向链接",
    icon: Link2,
  },
  {
    to: "/p/$projectId/audit" as const,
    label: "站点审计",
    icon: ClipboardCheck,
  },
  {
    to: "/p/$projectId/ai-visibility" as const,
    label: "提示词追踪",
    icon: ChartLine,
    activeOptions: { exact: true, includeSearch: false },
  },
  {
    to: "/p/$projectId/ai-visibility/research" as const,
    label: "提示词研究",
    icon: Search,
  },
  {
    to: "/p/$projectId/prompt-explorer" as const,
    label: "提示词探索",
    icon: MessageSquare,
  },
  {
    to: "/p/$projectId/reports" as const,
    label: "报告",
    icon: FileText,
  },
  {
    to: "/p/$projectId/context" as const,
    label: "项目上下文",
    icon: Brain,
  },
] as const;

// Project-independent. Rendered inside the project "AI 工具" group when a project
// is selected, and on its own (connectNavGroup) when none is.
const aiNavItem = linkOptions({
  to: "/ai" as const,
  label: "智能体设置",
  icon: Bot,
});

// Shown only when no project is selected; with a project, Agent setup lives in
// the "AI 工具" group below.
export const connectNavGroup = {
  label: "AI 工具",
  items: [aiNavItem],
};

function getProjectNavItems(projectId: string) {
  return linkOptions(
    projectNavItems.map((item) => ({
      ...item,
      params: { projectId },
      search: {},
    })),
  );
}

// Grouped by scope: "我的网站" is the project's own domain (tracked data),
// "Research" is point-at-anything lookup tools.
export function getProjectNavGroups(projectId: string) {
  const all = getProjectNavItems(projectId);
  const byPath = (path: (typeof projectNavItems)[number]["to"]) =>
    all.find((i) => i.to === path)!;

  return [
    {
      label: "概览",
      items: [byPath("/p/$projectId")],
    },
    {
      label: "研究",
      items: [
        byPath("/p/$projectId/keywords"),
        byPath("/p/$projectId/domain"),
        byPath("/p/$projectId/backlinks"),
      ],
    },
    {
      label: "AI 可见度",
      items: [
        byPath("/p/$projectId/ai-visibility/research"),
        byPath("/p/$projectId/prompt-explorer"),
        byPath("/p/$projectId/ai-visibility"),
      ],
    },
    {
      label: "我的网站",
      items: [
        byPath("/p/$projectId/search-performance"),
        byPath("/p/$projectId/rank-tracking"),
        byPath("/p/$projectId/local-seo"),
        byPath("/p/$projectId/saved"),
        byPath("/p/$projectId/audit"),
      ],
    },
    {
      label: "AI 工具",
      items: [
        byPath("/p/$projectId/reports"),
        byPath("/p/$projectId/context"),
        aiNavItem,
      ],
    },
  ];
}

export const dataforseoHelpLinkOptions = linkOptions({
  to: "/help/dataforseo-api-key",
});
