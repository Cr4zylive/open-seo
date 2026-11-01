import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { getDomainKeywordSuggestions } from "@/serverFunctions/domain";
import { addTrackingKeywords } from "@/serverFunctions/rank-tracking";
import { isLabsLocationCode } from "@/client/features/keywords/locations";
import { Spinner } from "@/client/components/Spinner";
import {
  DataTable,
  makeSelectionColumn,
  useDataTable,
} from "@/client/components/table/DataTable";
import { Button } from "@/client/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { SortableHeader } from "@/client/components/table/SortableHeader";
import { RANK_TRACKING_HEADER_CLASS } from "./RankTrackingColumns";
import {
  applyShiftRangeSelection,
  type SelectionAnchor,
} from "@/client/components/table/tableSelection";

type SuggestedKeyword = {
  keyword: string;
  position: number | null;
  searchVolume: number | null;
  traffic: number | null;
};

const PRE_SELECT_COUNT = 20;

const baseColumns: ColumnDef<SuggestedKeyword>[] = [
  {
    id: "keyword",
    accessorKey: "keyword",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        label="关键词"
        title="此域名获得排名的搜索词"
        className={RANK_TRACKING_HEADER_CLASS}
      />
    ),
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
    sortingFn: "alphanumeric",
  },
  {
    id: "position",
    accessorKey: "position",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        label="排名"
        title="当前 Google 排名"
        className={RANK_TRACKING_HEADER_CLASS}
      />
    ),
    cell: ({ getValue }) => {
      const pos = getValue<number | null>();
      return pos != null ? (
        pos
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.position ?? 999;
      const b = rowB.original.position ?? 999;
      return a - b;
    },
  },
  {
    id: "searchVolume",
    accessorKey: "searchVolume",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        label="搜索量"
        title="月搜索量"
        className={RANK_TRACKING_HEADER_CLASS}
      />
    ),
    cell: ({ getValue }) => {
      const vol = getValue<number | null>();
      return vol != null ? (
        vol.toLocaleString()
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.searchVolume ?? 0;
      const b = rowB.original.searchVolume ?? 0;
      return a - b;
    },
  },
  {
    id: "traffic",
    accessorKey: "traffic",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        label="流量"
        title="预估每月自然搜索流量"
        className={RANK_TRACKING_HEADER_CLASS}
      />
    ),
    cell: ({ getValue }) => {
      const traffic = getValue<number | null>();
      return traffic != null ? (
        Math.round(traffic).toLocaleString()
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.traffic ?? 0;
      const b = rowB.original.traffic ?? 0;
      return a - b;
    },
  },
];

type Props = {
  configId: string;
  projectId: string;
  domain: string;
  locationCode: number;
  onDone: (configId: string) => void;
  onClose: () => void;
};

export function KeywordSuggestionStep({
  configId,
  projectId,
  domain,
  locationCode,
  onDone,
  onClose,
}: Props) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "traffic", desc: true },
  ]);
  const selectAnchorRef = useRef<SelectionAnchor | null>(null);

  const columns = useMemo<ColumnDef<SuggestedKeyword>[]>(
    () => [
      makeSelectionColumn<SuggestedKeyword>(selectAnchorRef),
      ...baseColumns,
    ],
    [],
  );

  // Ranked-keyword suggestions are Labs-backed; countries served from Google
  // Ads keyword data (e.g. Iceland) have no ranking data to suggest from.
  // The tracker's language is deliberately not sent — rank tracking can pair
  // any SERP language with any country, and the server resolves a Labs-served
  // language for this country (resolveLabsMarket in serverFunctions/domain.ts).
  const labsSupported = isLabsLocationCode(locationCode);
  const suggestionsQuery = useQuery({
    queryKey: ["domainKeywordSuggestions", projectId, domain, locationCode],
    queryFn: () =>
      getDomainKeywordSuggestions({
        data: { projectId, domain, locationCode },
      }),
    enabled: labsSupported,
  });

  const data = suggestionsQuery.data ?? [];

  // Pre-select top 20 by traffic once data loads.
  useEffect(() => {
    const items = suggestionsQuery.data;
    if (items && items.length > 0 && !hasInitialized) {
      const indexed = items.map((item, i) => ({
        index: i,
        traffic: item.traffic ?? 0,
      }));
      indexed.sort((a, b) => b.traffic - a.traffic);
      const initial: RowSelectionState = {};
      for (let i = 0; i < Math.min(PRE_SELECT_COUNT, indexed.length); i++) {
        initial[indexed[i].index] = true;
      }
      setRowSelection(initial);
      setHasInitialized(true);
    }
  }, [suggestionsQuery.data, hasInitialized]);

  const table = useDataTable({
    data,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    withSorting: true,
    enableRowSelection: true,
  });

  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k],
  ).length;

  const addMutation = useMutation({
    mutationFn: (keywords: string[]) =>
      addTrackingKeywords({ data: { projectId, configId, keywords } }),
    onSuccess: (result) => {
      toast.success(`已添加 ${result.added} 个关键词进行追踪`);
      onDone(configId);
    },
  });

  const handleAdd = () => {
    const selectedKeywords = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.keyword);
    if (selectedKeywords.length > 0) {
      addMutation.mutate(selectedKeywords);
    }
  };

  if (!labsSupported) {
    return (
      <>
        <StepHeader
          title="手动添加关键词"
          description="此国家或地区暂不支持排名关键词建议。请继续并手动添加要追踪的关键词。"
        />
        <DialogFooter>
          <Button onClick={onClose}>继续</Button>
        </DialogFooter>
      </>
    );
  }

  if (suggestionsQuery.isLoading) {
    return (
      <>
        <StepHeader title="正在查找排名靠前的关键词…" />
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner label="通常只需几秒钟" />
        </div>
      </>
    );
  }

  if (suggestionsQuery.isError) {
    return (
      <>
        <StepHeader
          title="无法获取关键词"
          description="可以跳过此步，稍后手动添加关键词。"
        />
        <DialogFooter>
          <Button onClick={onClose}>跳过</Button>
        </DialogFooter>
      </>
    );
  }

  if (data.length === 0) {
    return (
      <>
        <StepHeader
          title="未找到排名数据"
          description={`未找到 ${domain} 当前有排名的关键词。可以手动添加。`}
        />
        <DialogFooter>
          <Button onClick={onClose}>跳过</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <StepHeader
        title="选择要追踪的关键词"
        description={`找到 ${data.length} 个 ${domain} 有排名的关键词。`}
      />

      <DataTable
        table={table}
        empty={{ title: "暂无关键词" }}
        scrollClassName="max-h-[400px]"
        onRowClick={(row, event) => {
          if (applyShiftRangeSelection(event, row, table, selectAnchorRef)) {
            return;
          }
          row.toggleSelected();
        }}
      />

      <DialogFooter className="items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          已选 {selectedCount} / {data.length}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            跳过
          </Button>
          <Button
            onClick={handleAdd}
            pending={addMutation.isPending}
            disabled={selectedCount === 0}
          >
            保存关键词
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function StepHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      {description ? (
        <DialogDescription>{description}</DialogDescription>
      ) : null}
    </DialogHeader>
  );
}
