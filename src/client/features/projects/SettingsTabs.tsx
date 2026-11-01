import { NavTab, NavTabs } from "@/client/components/NavTabs";

const tabs = [
  { to: "/p/$projectId/settings" as const, label: "常规", exact: true },
  { to: "/p/$projectId/settings/integrations" as const, label: "集成" },
];

export function SettingsTabs({ projectId }: { projectId: string }) {
  return (
    <NavTabs label="项目设置分区">
      {tabs.map((tab) => (
        <NavTab
          key={tab.to}
          to={tab.to}
          params={{ projectId }}
          activeOptions={{ exact: tab.exact ?? false }}
        >
          {tab.label}
        </NavTab>
      ))}
    </NavTabs>
  );
}
