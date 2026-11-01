import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { ExportMenu } from "@/client/components/ExportMenu";
import { PageHeader } from "@/client/components/PageHeader";
import { Button } from "@/client/components/ui/button";

export function SavedKeywordsHeader({
  totalCount,
  exporting,
  metricsRefreshing,
  onExportCsv,
  onExportSheets,
  onRefreshMetrics,
}: {
  totalCount: number;
  exporting: "csv" | "sheets" | null;
  metricsRefreshing: boolean;
  onExportCsv: () => void;
  onExportSheets: () => void;
  onRefreshMetrics: () => void;
}) {
  const [confirmingRefresh, setConfirmingRefresh] = useState(false);
  const disabled = totalCount === 0 || exporting != null;

  return (
    <>
      <PageHeader
        title="已保存关键词"
        description="从研究中保存关键词灵感，用标签整理，准备行动时再回来查看。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              title="获取最新搜索量、难度和 CPC"
              disabled={disabled || metricsRefreshing}
              onClick={() => setConfirmingRefresh(true)}
            >
              <RefreshCw
                data-icon="inline-start"
                className={metricsRefreshing ? "animate-spin" : ""}
              />
              {metricsRefreshing ? "更新中…" : "更新关键词数据"}
            </Button>

            <ExportMenu
              actions={["sheets", "csv"]}
              busy={exporting != null}
              disabled={disabled}
              onExport={(action) =>
                action === "sheets" ? onExportSheets() : onExportCsv()
              }
            />
          </>
        }
      />

      {confirmingRefresh ? (
        <ConfirmDialog
          title="更新关键词数据？"
          confirmLabel="更新数据"
          onConfirm={() => {
            setConfirmingRefresh(false);
            onRefreshMetrics();
          }}
          onClose={() => setConfirmingRefresh(false)}
        >
          将为此项目中每个已保存关键词获取新的搜索量、难度和 CPC。每个关键词都会消耗额度。
        </ConfirmDialog>
      ) : null}
    </>
  );
}
