import type { getLocalScan } from "@/serverFunctions/local-seo";
import { EmptyState } from "@/client/components/EmptyState";
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { LocalPointStatus } from "@/shared/local-seo";
import type { LocalGridDisplayPoint } from "./LocalRankGrid";

type PointResult = Awaited<ReturnType<typeof getLocalScan>>["results"][number];

export function LocalPointResults({
  point,
  results,
  cid,
  placeId,
  gridSize,
  spacingKm,
}: {
  point: LocalGridDisplayPoint;
  results: PointResult[];
  cid: string | null;
  placeId: string | null;
  gridSize: number;
  spacingKm: number;
}) {
  return (
    <Card className="h-full min-h-0 min-w-0 gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="shrink-0 items-center gap-2 px-4 py-3">
        <CardTitle className="text-sm">结果</CardTitle>
        <CardAction className="row-span-1 self-center text-xs text-muted-foreground">
          {searchedFrom(point, gridSize, spacingKm)}
        </CardAction>
      </CardHeader>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
        {point.status !== LocalPointStatus.Completed ? (
          <EmptyState
            variant="plain"
            title={
              point.status === LocalPointStatus.Pending
                ? "搜索待处理"
                : "搜索失败"
            }
            description={
              point.status === LocalPointStatus.Pending
                ? "结果到达后，已保存的扫描会更新。"
                : "此采样点没有排名结果。其他采样点仍可用。"
            }
          />
        ) : results.length === 0 ? (
          <EmptyState
            variant="plain"
            title="没有返回商家"
            description="Google Maps 在此坐标没有返回商家。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>商家</TableHead>
                <TableHead>评价</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow
                  key={result.id}
                  data-state={
                    (cid != null && result.cid === cid) ||
                    (placeId != null && result.placeId === placeId)
                      ? "selected"
                      : undefined
                  }
                >
                  <TableCell className="font-mono">{result.rank}</TableCell>
                  <TableCell>
                    <p className="font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.address}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p>{result.rating == null ? "—" : `${result.rating} ★`}</p>
                    <p className="text-muted-foreground">
                      {result.reviews?.toLocaleString() ?? "—"}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}

/** Where a point's search ran, e.g. "Searched 2 km north, 2 km west of your listing". */
function searchedFrom(
  point: LocalGridDisplayPoint,
  gridSize: number,
  spacingKm: number,
) {
  const center = (gridSize - 1) / 2;
  const north = (center - point.row) * spacingKm;
  const east = (point.col - center) * spacingKm;
  const parts = [
    north && `${Math.abs(north)} 公里${north > 0 ? "北" : "南"}`,
    east && `${Math.abs(east)} 公里${east > 0 ? "东" : "西"}`,
  ].filter(Boolean);
  return parts.length
    ? `搜索位置：商家${parts.join("、")}方向`
    : "从商家位置搜索";
}
