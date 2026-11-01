import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import {
  WebsiteCompetitorRow,
  type WebsiteCompetitor,
} from "./WebsiteCompetitorRow";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { Card, CardContent } from "@/client/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/client/components/ui/table";
import type {
  SaveProjectWebsiteSetup,
  WebsiteResearch,
} from "@/types/schemas/projectWebsite";

export function WebsiteSetupReview({
  projectId,
  research,
  saving,
  error,
  onSave,
  onBack,
}: {
  projectId: string;
  research: WebsiteResearch;
  saving: boolean;
  error: boolean;
  onSave: (accepted: Omit<SaveProjectWebsiteSetup, "projectId">) => void;
  /** Omit when there is no earlier step to return to. */
  onBack?: () => void;
}) {
  const [competitors, setCompetitors] = useState<WebsiteCompetitor[]>(
    research.competitors.map(({ name, domain, notes }) => ({
      id: crypto.randomUUID(),
      name,
      domain,
      notes,
    })),
  );
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Card className="w-full max-w-3xl py-6 md:py-8">
      <CardContent className="px-6 md:px-8">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave({
              name: research.name,
              domain: research.domain,
              overview: research.overview,
              suggestedTopics: research.suggestedTopics,
              suggestedKeywords: research.suggestedKeywords,
              competitors: competitors.map(({ name, domain, notes }) => ({
                name,
                domain,
                notes,
              })),
            });
          }}
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {research.preserveCompetitors
                ? "完成项目设置"
                : "编辑竞争对手"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              你可以随时编辑{" "}
              <Link
                to="/p/$projectId/context"
                params={{ projectId }}
                className="text-foreground underline underline-offset-4"
              >
                项目上下文
              </Link>
              。
            </p>
          </div>
          <fieldset disabled={saving} className="min-w-0 space-y-5">
            {research.preserveCompetitors ? (
              <p className="text-sm text-muted-foreground">
                将使用已保存在项目上下文中的竞争对手。
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>网站</TableHead>
                      <TableHead>
                        <span className="sr-only">操作</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((competitor, index) => (
                      <WebsiteCompetitorRow
                        key={competitor.id}
                        competitor={competitor}
                        index={index}
                        editing={editing === competitor.id}
                        onChange={(changed) =>
                          setCompetitors(
                            competitors.map((row) =>
                              row.id === changed.id ? changed : row,
                            ),
                          )
                        }
                        onEdit={() =>
                          setEditing(
                            editing === competitor.id ? null : competitor.id,
                          )
                        }
                        onRemove={() =>
                          setCompetitors(
                            competitors.filter(
                              (row) => row.id !== competitor.id,
                            ),
                          )
                        }
                      />
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={competitors.length >= 100}
                          onClick={() => {
                            const id = crypto.randomUUID();
                            setCompetitors([
                              ...competitors,
                              { id, name: "", domain: "", notes: "" },
                            ]);
                            setEditing(id);
                          }}
                        >
                          <Plus className="size-4" /> 添加竞争对手
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  无法保存项目。请检查竞争对手名称和网站后重试。
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-between gap-3">
              {onBack ? (
                <Button type="button" variant="outline" onClick={onBack}>
                  返回
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="submit"
                disabled={competitors.some(
                  (row) => !row.name.trim() || !row.domain.trim(),
                )}
              >
                {saving && <LoaderCircle className="size-4 animate-spin" />}{" "}
                继续
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
