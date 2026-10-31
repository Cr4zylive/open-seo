import { ShieldAlert } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/client/components/ui/alert";
import type { AuditResultsData } from "@/client/features/audit/results/types";

/** Report notices about JavaScript: app shells, and pages a render missed. */
export function RenderingWarnings({ data }: { data: AuditResultsData }) {
  const rendered = data.audit.config.renderJavaScript;
  const hasShells = data.issues.some(
    (issue) => issue.issueType === "javascript-rendering-suspected",
  );
  const unreadCount = data.pages.filter(
    (page) => page.fetchClass === "error",
  ).length;

  return (
    <>
      {hasShells && (
        <Alert variant="warning">
          <ShieldAlert />
          <AlertTitle>
            部分页面可能需要 JavaScript 才能显示内容。
          </AlertTitle>
          <AlertDescription>
            {rendered
              ? "渲染后它们仍在加载，因此无法检查。"
              : "请开启「渲染 JavaScript」后重新审计，以便检查这些页面。"}
          </AlertDescription>
        </Alert>
      )}

      {rendered && unreadCount > 0 && (
        <Alert variant="warning">
          <ShieldAlert />
          <AlertTitle>
            有 {unreadCount} 个页面无法读取。
          </AlertTitle>
          <AlertDescription>
            可打开「页面」标签，将抓取结果筛选为「失败」查看。
          </AlertDescription>
        </Alert>
      )}

      {rendered && (
        <p className="text-sm text-muted-foreground">
          本次审计已启用 JavaScript 渲染。
        </p>
      )}
    </>
  );
}
