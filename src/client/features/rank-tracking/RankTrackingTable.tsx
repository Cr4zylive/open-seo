import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileDown, Plus, Sheet, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { Button } from "@/client/components/ui/button";
import { DataTable, useDataTable } from "@/client/components/table/DataTable";
import {
  TableBulkActionBar,
  TableBulkActionButton,
  TableBulkExportMenu,
} from "@/client/components/table/TableBulkActionBar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { removeTrackingKeywords } from "@/serverFunctions/rank-tracking";
import type { RankTrackingRow } from "@/types/schemas/rank-tracking";
import {
  PINNED_COLUMN_ID,
  useRankTrackingColumns,
} from "./RankTrackingColumns";
import { useSetKeywordPinned } from "./useSetKeywordPinned";
import { exportRankTracking } from "./RankTrackingTableParts";
import {
  KeywordTrendModal,
  type KeywordTrendTarget,
} from "./KeywordTrendModal";
import type { SelectionAnchor } from "@/client/components/table/tableSelection";

export function RankTrackingTable({
  totalCount,
  rows,
  showDesktop,
  showMobile,
  sorting,
  onSortingChange,
  domain,
  configId,
  projectId,
  locationCode,
  languageCode,
  locationName,
  serpDepth,
  onAddKeywords,
  onClearFilters,
}: {
  totalCount: number;
  rows: RankTrackingRow[];
  showDesktop: boolean;
  showMobile: boolean;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  domain: string;
  configId: string;
  projectId: string;
  locationCode: number;
  languageCode: string;
  locationName?: string | null;
  serpDepth: number;
  onAddKeywords: () => void;
  onClearFilters: () => void;
}) {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [trendTarget, setTrendTarget] = useState<KeywordTrendTarget | null>(
    null,
  );
  const selectAnchorRef = useRef<SelectionAnchor | null>(null);

  const handleKeywordClick = useCallback(
    (row: RankTrackingRow) =>
      setTrendTarget({
        trackingKeywordId: row.trackingKeywordId,
        keyword: row.keyword,
      }),
    [],
  );

  const setKeywordPinned = useSetKeywordPinned(projectId, configId);
  const columns = useRankTrackingColumns({
    showDesktop,
    showMobile,
    domain,
    selectAnchorRef,
    onKeywordClick: handleKeywordClick,
    onSetPinned: setKeywordPinned,
    locationName,
  });

  // The pinned column sorts first and stays out of the sorting the page owns.
  // Keep sorting stable across the table's own state updates, which otherwise
  // recompute sorted rows and queue another pagination reset on every render.
  const tableSorting = useMemo(
    () => [{ id: PINNED_COLUMN_ID, desc: false }, ...sorting],
    [sorting],
  );
  const table = useDataTable({
    data: rows,
    columns,
    state: {
      sorting: tableSorting,
      columnVisibility: { [PINNED_COLUMN_ID]: false },
    },
    onSortingChange: (updater) =>
      onSortingChange(
        (typeof updater === "function"
          ? updater(tableSorting)
          : updater
        ).filter((sort) => sort.id !== PINNED_COLUMN_ID),
      ),
    // The URL has no value for "unsorted", so a column stays sorted.
    enableSortingRemoval: false,
    withSorting: true,
    getRowId: (row) => row.trackingKeywordId,
    enableRowSelection: true,
  });

  // Only includes rows that are in the current data (respects parent filtering)
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedRankRows = selectedRows.map((row) => row.original);

  const exportSelection = (format: "csv" | "sheets") =>
    exportRankTracking({
      format,
      rows: selectedRankRows,
      showDesktop,
      showMobile,
      domain,
      locationName,
      scope: "selection",
    });

  const removeMutation = useMutation({
    mutationFn: (keywordIds: string[]) =>
      removeTrackingKeywords({ data: { projectId, configId, keywordIds } }),
    onSuccess: (result) => {
      table.resetRowSelection();
      setShowConfirm(false);
      void queryClient.invalidateQueries({
        queryKey: ["rankTrackingResults", projectId, configId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["rankTrackingCostEstimate", projectId, configId],
      });
      toast.success(
        `${result.removed} keyword${result.removed !== 1 ? "s" : ""} removed`,
      );
    },
  });

  return (
    <>
      <TableBulkActionBar
        selectedCount={selectedCount}
        onClear={() => table.resetRowSelection()}
        actions={
          <div className="flex items-center px-1.5">
            <TableBulkActionButton
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setShowConfirm(true)}
              variant="danger"
            >
              Remove
            </TableBulkActionButton>
            <TableBulkExportMenu
              actions={[
                {
                  label: "导出到 Google 表格",
                  icon: <Sheet className="size-4" />,
                  onClick: () => exportSelection("sheets"),
                },
                {
                  label: "导出 CSV",
                  icon: <FileDown className="size-4" />,
                  onClick: () => exportSelection("csv"),
                },
              ]}
            />
          </div>
        }
      />

      {showConfirm && (
        <ConfirmDialog
          title="移除关键词？"
          confirmLabel={`移除 ${selectedCount} 个关键词`}
          destructive
          pending={removeMutation.isPending}
          onConfirm={() => removeMutation.mutate(selectedRows.map((r) => r.id))}
          onClose={() => setShowConfirm(false)}
        >
          将停止追踪这 {selectedCount}{" "}
          个关键词。历史排名会保留，但不会出现在表格中。
        </ConfirmDialog>
      )}

      {trendTarget && (
        <KeywordTrendModal
          target={trendTarget}
          projectId={projectId}
          configId={configId}
          domain={domain}
          locationCode={locationCode}
          languageCode={languageCode}
          locationName={locationName ?? undefined}
          serpDepth={serpDepth}
          onClose={() => setTrendTarget(null)}
        />
      )}

      <DataTable
        table={table}
        isFiltered={totalCount > 0}
        onClearFilters={onClearFilters}
        empty={{
          title: "还没有关键词",
          description: "添加要为此域名追踪的关键词。",
          action: (
            <Button size="sm" onClick={onAddKeywords}>
              <Plus data-icon="inline-start" />
              添加关键词
            </Button>
          ),
        }}
        footer={
          rows.length > 0 ? (
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {rows.length} / {totalCount} 个关键词
            </p>
          ) : null
        }
      />
    </>
  );
}
