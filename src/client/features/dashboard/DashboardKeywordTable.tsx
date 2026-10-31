import { ExternalPage } from "./siteTabParts";
import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/client/components/table/SortableHeader";
import type { ComponentProps } from "react";
import { DashboardDataTable } from "./DashboardDataTable";

type Keyword = {
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  position: number;
};
const columns: ColumnDef<Keyword>[] = [
  {
    accessorKey: "query",
    header: ({ column }) => <SortableHeader column={column} label="关键词" />,
    filterFn: "includesString",
  },
  ...(["impressions", "clicks", "position"] as const).map(
    (id) =>
      ({
        accessorKey: id,
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={
              id === "position"
                ? "平均排名"
                : id === "clicks"
                  ? "点击次数"
                  : "展示次数"
            }
            align="right"
          />
        ),
        cell: ({ getValue }) =>
          id === "position"
            ? Number(getValue()).toFixed(1)
            : Number(getValue()).toLocaleString(),
        filterFn: "inNumberRange",
        meta: {
          headerClassName: "text-right",
          cellClassName: "text-right tabular-nums",
        },
      }) satisfies ColumnDef<Keyword>,
  ),
];
export function DashboardKeywordTable({
  rows,
  showPages = false,
  sortBy = "impressions",
  ...tableProps
}: {
  rows: Keyword[];
  showPages?: boolean;
  sortBy?: "impressions" | "clicks";
} & Pick<
  ComponentProps<typeof DashboardDataTable>,
  "tabs" | "resetKey" | "isLoading" | "error" | "empty"
>) {
  const pageColumn: ColumnDef<Keyword> = {
    accessorKey: "page",
    header: "页面",
    filterFn: "includesString",
    cell: ({ row }) => <ExternalPage url={row.original.page ?? null} />,
  };
  return (
    <DashboardDataTable
      {...tableProps}
      rows={rows}
      columns={
        showPages ? [columns[0], pageColumn, ...columns.slice(1)] : columns
      }
      initialSorting={[{ id: sortBy, desc: true }]}
      filters={[
        { id: "query", label: "关键词", kind: "text" },
        ...(showPages
          ? [{ id: "page", label: "页面", kind: "text" as const }]
          : []),
        { id: "impressions", label: "展示次数", kind: "number" },
        { id: "clicks", label: "点击次数", kind: "number" },
        { id: "position", label: "平均排名", kind: "number" },
      ]}
    />
  );
}
