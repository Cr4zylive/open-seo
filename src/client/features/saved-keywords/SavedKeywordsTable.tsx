import {
  createColumnHelper,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, type ReactNode } from "react";
import {
  DataTable,
  makeSelectionColumn,
  useDataTable,
  useSelectionAnchor,
} from "@/client/components/table/DataTable";
import { SortableHeader } from "@/client/components/table/SortableHeader";
import { ScoreBadge } from "@/client/components/table/ScoreBadge";
import { IntentBadge } from "@/client/features/keywords/components";
import type { KeywordIntent, SavedKeywordRow } from "@/types/keywords";
import { TagChip } from "./TagChip";
import {
  formatSavedKeywordDate,
  formatSavedKeywordNumber,
} from "./savedKeywordsUtils";

const columnHelper = createColumnHelper<SavedKeywordRow>();

export function SavedKeywordsTable({
  rows,
  rowSelection,
  sorting,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  onRowSelectionChange,
  onSortingChange,
  toolbar,
  footer,
}: {
  rows: SavedKeywordRow[];
  rowSelection: RowSelectionState;
  sorting: SortingState;
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onSortingChange: OnChangeFn<SortingState>;
  toolbar: ReactNode;
  footer: ReactNode;
}) {
  const selectAnchorRef = useSelectionAnchor();
  const columns = useMemo<ColumnDef<SavedKeywordRow>[]>(
    () => [
      makeSelectionColumn<SavedKeywordRow>(selectAnchorRef),
      columnHelper.accessor("keyword", {
        header: ({ column }) => (
          <SortableHeader column={column} label="关键词" />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("searchVolume", {
        header: ({ column }) => (
          <SortableHeader column={column} label="搜索量" />
        ),
        cell: ({ getValue }) => formatSavedKeywordNumber(getValue()),
      }),
      columnHelper.accessor("cpc", {
        header: ({ column }) => <SortableHeader column={column} label="CPC" />,
        cell: ({ getValue }) => {
          const value = getValue();
          return value == null ? "-" : `$${value.toFixed(2)}`;
        },
      }),
      columnHelper.accessor("competition", {
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="竞争度"
            helpText="Google Ads 付费搜索竞争度（0 到 1），数值越高表示参与竞价的广告主越多。"
          />
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return value == null ? "-" : value.toFixed(2);
        },
      }),
      columnHelper.accessor("keywordDifficulty", {
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="难度"
            helpText="自然搜索排名难度（0 到 100），数值越高表示进入 Google 前 10 名越难。"
          />
        ),
        cell: ({ getValue }) => <ScoreBadge value={getValue()} />,
      }),
      columnHelper.accessor("intent", {
        header: () => "意图",
        cell: ({ getValue }) => (
          <IntentBadge intent={normalizeIntent(getValue())} />
        ),
        enableSorting: false,
      }),
      columnHelper.display({
        id: "tags",
        header: () => "标签",
        cell: ({ row }) => <TagList tags={row.original.tags} />,
        enableSorting: false,
        meta: { cellClassName: "min-w-40 max-w-64" },
      }),
      columnHelper.accessor("fetchedAt", {
        header: ({ column }) => (
          <SortableHeader column={column} label="上次获取" />
        ),
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatSavedKeywordDate(getValue())}
          </span>
        ),
      }),
    ],
    [selectAnchorRef],
  );
  const table = useDataTable({
    data: rows,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange,
    onSortingChange,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    manualSorting: true,
    // The server sorts by one column, so there is always exactly one sort:
    // a click flips its direction and shift+click does not add a second.
    enableSortingRemoval: false,
    enableMultiSort: false,
  });

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFiltered={hasActiveFilters}
      onClearFilters={onClearFilters}
      empty={{
        title: "还没有已保存关键词",
        description: "前往关键词研究页面查找并保存关键词。",
      }}
      toolbar={toolbar}
      footer={footer}
    />
  );
}

function normalizeIntent(value: string | null): KeywordIntent {
  switch (value) {
    case "informational":
    case "commercial":
    case "transactional":
    case "navigational":
    case "unknown":
      return value;
    default:
      return "unknown";
  }
}

function TagList({ tags }: { tags: SavedKeywordRow["tags"] }) {
  if (tags.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <TagChip key={tag.id} tag={tag} size="xs" />
      ))}
    </div>
  );
}
