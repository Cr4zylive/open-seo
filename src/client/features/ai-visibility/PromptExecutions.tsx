import { Button } from "@/client/components/ui/button";
import { Badge } from "@/client/components/ui/badge";
import {
  aiNoAnswerLabel,
  aiObservationStatusLabel,
  type AiObservationRow,
  type AiRun,
} from "@/shared/ai-visibility";
import { EngineLabel } from "./EngineLabel";
import { aiDate, AiMatchBadge } from "./shared";

export interface PromptExecution {
  observation: AiObservationRow;
  run: Pick<AiRun, "id" | "createdAt" | "trigger">;
}

export function PromptExecutions({
  executions,
  selectedId,
  onSelect,
}: {
  executions: PromptExecution[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <section
      aria-label="执行记录"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h2 className="text-sm font-medium">执行记录</h2>
        <span className="text-xs text-muted-foreground">
          此时间范围内 {executions.length} 条
        </span>
      </div>
      <div
        className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_140px] gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground sm:grid"
        aria-hidden="true"
      >
        <span>日期</span>
        <span>引擎</span>
        <span>品牌提及</span>
        <span>自有引用</span>
      </div>
      <ul
        className="max-h-64 overflow-y-auto sm:max-h-44"
        aria-label="选择一条执行记录"
      >
        {executions.map(({ observation, run }) => {
          const own = observation.brands.find((brand) => brand.own);
          const answered = observation.answerStatus === "answered";
          const status =
            observation.status !== "completed"
              ? aiObservationStatusLabel(observation.status)
              : observation.answerStatus === "no_answer"
                ? aiNoAnswerLabel(observation.engine)
                : "回答不可用";
          return (
            <li
              key={observation.id}
              className="border-b border-border last:border-0"
            >
              <Button
                variant="ghost"
                aria-pressed={selectedId === observation.id}
                onClick={() => onSelect(observation.id)}
                className="grid h-auto w-full grid-cols-2 justify-items-start gap-x-3 gap-y-2 rounded-none px-4 py-2.5 text-left font-normal aria-pressed:bg-primary/10 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_140px]"
              >
                <span className="whitespace-normal text-xs text-muted-foreground">
                  {aiDate(observation.collectedAt ?? run.createdAt)}
                  {run.trigger !== "manual" && (
                    <span className="ml-2 hidden text-[0.625rem] lg:inline">
                      {run.trigger === "baseline" ? "基线" : "排期"}
                    </span>
                  )}
                </span>
                <span className="text-xs">
                  <EngineLabel engine={observation.engine} />
                </span>
                {answered ? (
                  <>
                    <AiMatchBadge value={own?.mentioned ?? false} />
                    <AiMatchBadge
                      value={own?.cited ?? false}
                      positive="Cited"
                    />
                  </>
                ) : (
                  <Badge
                    variant={
                      observation.status === "failed"
                        ? "destructive"
                        : "secondary"
                    }
                    className="col-span-2"
                  >
                    {status}
                  </Badge>
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
