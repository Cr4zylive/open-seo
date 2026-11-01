import { useQuery } from "@tanstack/react-query";
import { QueryError } from "@/client/components/QueryState";
import { DataTableTabs } from "@/client/components/table/DataTableToolbar";
import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/client/components/table/SortableHeader";
import { DashboardDataTable } from "./DashboardDataTable";
import { useState, type ComponentProps } from "react";
import { TabsTrigger } from "@/client/components/ui/tabs";
import { getDashboardBacklinks } from "@/serverFunctions/dashboard";
import { Freshness, ExternalPage } from "./siteTabParts";
const KINDS = ["new", "lost", "all"] as const;
type Kind = (typeof KINDS)[number];

const DESCRIPTIONS: Record<Kind, string> = {
  new: "过去一周发现的指向你网站的链接。链接本身可能早于发现日期。",
  lost: "之前发现、现在已经不在的链接。「最近检查」是我们上次检查的时间，不是链接消失的时间。",
  all: "最近发现、目前仍指向你网站的链接。",
};

export function DashboardBacklinks({
  projectId,
  domain,
}: {
  projectId: string;
  domain: string;
}) {
  const [kind, setKind] = useState<Kind>("new");
  const query = useQuery({
    queryKey: ["dashboardBacklinks", projectId, domain, kind],
    queryFn: () => getDashboardBacklinks({ data: { projectId, kind } }),
    staleTime: 86400_000,
    retry: false,
  });
  return (
    <DashboardBacklinkTable
      rows={query.data?.value ?? []}
      kind={kind}
      isLoading={query.isPending}
      error={
        query.isError ? (
          <QueryError
            error={query.error}
            fallback="无法加载反向链接"
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : null
      }
      tabs={
        <DataTableTabs
          value={kind}
          onValueChange={(value) => {
            const next = KINDS.find((item) => item === value);
            if (next) setKind(next);
          }}
          description={
            <>
              {DESCRIPTIONS[kind]}
              {query.data ? <Freshness {...query.data} /> : null}
            </>
          }
        >
          <TabsTrigger value="new">本周新增</TabsTrigger>
          <TabsTrigger value="lost">已失效链接</TabsTrigger>
          <TabsTrigger value="all">有效链接</TabsTrigger>
        </DataTableTabs>
      }
    />
  );
}

type Backlink = Awaited<
  ReturnType<typeof getDashboardBacklinks>
>["value"][number];
function DashboardBacklinkTable({
  rows,
  kind,
  ...tableProps
}: {
  rows: Backlink[];
  kind: Kind;
} & Pick<
  ComponentProps<typeof DashboardDataTable>,
  "tabs" | "isLoading" | "error"
>) {
  const columns: ColumnDef<Backlink>[] = [
    {
      id: "urlFrom",
      accessorFn: (row) => `${row.domainFrom ?? ""} ${row.urlFrom ?? ""}`,
      header: ({ column }) => (
        <SortableHeader column={column} label="来源页面" />
      ),
      cell: ({ row }) => (
        <ExternalPage
          url={row.original.urlFrom}
          label={row.original.domainFrom}
        />
      ),
      filterFn: "includesString",
    },
    {
      accessorKey: "anchor",
      header: "锚文本",
      cell: ({ row }) => (
        <span
          className="block max-w-48 truncate"
          title={row.original.anchor ?? undefined}
        >
          {row.original.anchor || "—"}
        </span>
      ),
      filterFn: "includesString",
    },
    {
      accessorKey: "urlTo",
      header: "目标页面",
      cell: ({ row }) => <ExternalPage url={row.original.urlTo} />,
      filterFn: "includesString",
    },
    {
      id: "follow",
      accessorFn: (row) => (row.isDofollow ? "Follow" : "Nofollow"),
      header: "链接类型",
      filterFn: "equalsString",
    },
    {
      accessorKey: "domainFromRank",
      header: ({ column }) => (
        <SortableHeader column={column} label="域名权重" />
      ),
      filterFn: "inNumberRange",
      cell: ({ getValue }) => getValue() ?? "—",
    },
    {
      accessorKey: "spamScore",
      header: ({ column }) => (
        <SortableHeader column={column} label="垃圾评分" />
      ),
      filterFn: "inNumberRange",
      cell: ({ getValue }) => getValue() ?? "—",
    },
    {
      id: "date",
      accessorFn: (row) =>
        (kind === "lost" ? row.lastSeen : row.firstSeen)?.slice(0, 10) ?? "—",
      header: ({ column }) => (
        <SortableHeader
          column={column}
          label={kind === "lost" ? "最近检查" : "首次发现"}
        />
      ),
    },
  ];
  return (
    <DashboardDataTable
      {...tableProps}
      resetKey={kind}
      rows={rows}
      empty={{
        title:
          kind === "new"
            ? "本周没有新增反向链接"
            : kind === "lost"
              ? "没有找到失效反向链接"
              : "还没有有效反向链接",
      }}
      columns={columns}
      filters={[
        { id: "urlFrom", label: "来源页面", kind: "text" },
        { id: "anchor", label: "锚文本", kind: "text" },
        { id: "urlTo", label: "目标页面", kind: "text" },
        { id: "follow", label: "链接类型", kind: "follow" },
        { id: "domainFromRank", label: "域名权重", kind: "number" },
        { id: "spamScore", label: "垃圾评分", kind: "number" },
      ]}
    />
  );
}
