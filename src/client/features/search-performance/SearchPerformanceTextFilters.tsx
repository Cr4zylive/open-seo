import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { z } from "zod";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";
import type { searchPerformanceInputSchema } from "@/types/schemas/search-performance";

const MATCH_ITEMS = [
  { value: "contains", label: "包含" },
  { value: "equals", label: "完全匹配" },
];

export type TextFilters = Pick<
  z.infer<typeof searchPerformanceInputSchema>,
  "pageFilter" | "queryFilter"
>;

export function SearchPerformanceTextFilters({
  value,
  activeFilterCount,
  onApply,
  onReset,
}: {
  value: TextFilters;
  activeFilterCount: number;
  onApply: (filters: TextFilters) => void;
  onReset: () => void;
}) {
  const [page, setPage] = useState(value.pageFilter?.expression ?? "");
  const [query, setQuery] = useState(value.queryFilter?.expression ?? "");
  const [pageOperator, setPageOperator] = useState<"contains" | "equals">(
    value.pageFilter?.operator ?? "contains",
  );
  const [queryOperator, setQueryOperator] = useState<"contains" | "equals">(
    value.queryFilter?.operator ?? "contains",
  );
  const dirtyCount =
    Number(
      page.trim() !== (value.pageFilter?.expression ?? "") ||
        pageOperator !== (value.pageFilter?.operator ?? "contains"),
    ) +
    Number(
      query.trim() !== (value.queryFilter?.expression ?? "") ||
        queryOperator !== (value.queryFilter?.operator ?? "contains"),
    );
  const cancel = () => {
    setPage(value.pageFilter?.expression ?? "");
    setQuery(value.queryFilter?.expression ?? "");
    setPageOperator(value.pageFilter?.operator ?? "contains");
    setQueryOperator(value.queryFilter?.operator ?? "contains");
  };
  return (
    <form
      id="search-performance-filters"
      className="space-y-3 border-b border-border bg-muted/20 px-4 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        setPage(page.trim());
        setQuery(query.trim());
        if (!page.trim()) setPageOperator("contains");
        if (!query.trim()) setQueryOperator("contains");
        onApply({
          pageFilter: page.trim()
            ? { operator: pageOperator, expression: page.trim() }
            : undefined,
          queryFilter: query.trim()
            ? { operator: queryOperator, expression: query.trim() }
            : undefined,
        });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">细化表格结果</p>
          {activeFilterCount > 0 ? (
            <Badge size="sm">{activeFilterCount} 项生效</Badge>
          ) : null}
          {dirtyCount > 0 ? (
            <Badge variant="warning" size="sm">
              {dirtyCount} 项未应用
            </Badge>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={activeFilterCount === 0 && dirtyCount === 0}
          onClick={() => {
            setPage("");
            setQuery("");
            setPageOperator("contains");
            setQueryOperator("contains");
            onReset();
          }}
        >
          <RotateCcw data-icon="inline-start" />
          全部清除
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            页面网址
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              items={MATCH_ITEMS}
              value={pageOperator}
              onValueChange={(operator) =>
                setPageOperator(operator === "equals" ? "equals" : "contains")
              }
            >
              <SelectTrigger
                size="sm"
                className="w-full sm:w-44 sm:shrink-0"
                aria-label="页面匹配方式"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATCH_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="h-7 w-full min-w-0 sm:flex-1"
              aria-label="页面网址筛选"
              value={page}
              maxLength={4096}
              onChange={(event) => setPage(event.target.value)}
              placeholder="网址或目录"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            查询
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              items={MATCH_ITEMS}
              value={queryOperator}
              onValueChange={(operator) =>
                setQueryOperator(operator === "equals" ? "equals" : "contains")
              }
            >
              <SelectTrigger
                size="sm"
                className="w-full sm:w-44 sm:shrink-0"
                aria-label="查询匹配方式"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATCH_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="h-7 w-full min-w-0 sm:flex-1"
              aria-label="查询筛选"
              value={query}
              maxLength={4096}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索词"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        所有筛选条件都需匹配。「包含」不区分大小写，可匹配任意位置的文本（包括目录）。「完全匹配」会比较完整网址或查询，并区分大小写。
      </p>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancel}
          disabled={dirtyCount === 0}
        >
          取消
        </Button>
        <Button size="sm" type="submit" disabled={dirtyCount === 0}>
          应用筛选
          {dirtyCount > 0 ? (
            <Badge variant="secondary" size="sm" className="ml-1">
              {dirtyCount}
            </Badge>
          ) : null}
        </Button>
      </div>
    </form>
  );
}
