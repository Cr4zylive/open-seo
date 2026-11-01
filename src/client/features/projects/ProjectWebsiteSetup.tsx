import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/client/components/ui/card";
import { WebsiteResearchProgress } from "./WebsiteResearchProgress";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { Field, FieldLabel } from "@/client/components/ui/field";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { InsufficientCreditsError } from "@/client/features/billing/InsufficientCreditsError";
import { getErrorCode } from "@/client/lib/error-messages";
import { isEveryAppClientAuthMode } from "@/lib/auth-mode";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { projectContextQueryKey } from "@/client/features/projects/project-context/shared";
import { getProjectContext } from "@/serverFunctions/projectContext";
import { WebsiteSetupReview } from "@/client/features/projects/WebsiteSetupReview";
import {
  researchProjectWebsite,
  saveProjectWebsiteSetup,
} from "@/serverFunctions/projectWebsite";
import type {
  WebsiteResearch,
  SaveProjectWebsiteSetup,
} from "@/types/schemas/projectWebsite";

export function ProjectWebsiteSetup({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [website, setWebsite] = useState("");
  const [research, setResearch] = useState<WebsiteResearch | null>(null);
  // Saved context decides which research steps run.
  const context = useQuery({
    queryKey: projectContextQueryKey(projectId),
    queryFn: () => getProjectContext({ data: { projectId } }),
  });
  const researchMutation = useMutation({
    mutationFn: () => researchProjectWebsite({ data: { projectId, website } }),
    onSuccess: setResearch,
  });
  const saveMutation = useMutation({
    mutationFn: (accepted: Omit<SaveProjectWebsiteSetup, "projectId">) =>
      saveProjectWebsiteSetup({ data: { ...accepted, projectId } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: projectsQueryOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectAccess", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projectContext", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["aiVisibility", projectId],
        }),
      ]);
      toast.success("项目上下文已保存");
    },
  });
  if (research)
    return (
      <WebsiteSetupReview
        projectId={projectId}
        research={research}
        saving={saveMutation.isPending}
        error={saveMutation.isError}
        onSave={(accepted) => saveMutation.mutate(accepted)}
        onBack={() => {
          setResearch(null);
          saveMutation.reset();
        }}
      />
    );
  if (researchMutation.isPending)
    return (
      <WebsiteResearchProgress
        missingOverview={
          !context.data?.sections.some(
            (section) => section.key === "business_overview",
          )
        }
        missingCompetitors={!context.data?.competitors.length}
      />
    );
  return (
    <Card className="w-full max-w-2xl py-6 md:py-8">
      <CardContent className="px-6 md:px-8">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            researchMutation.mutate();
          }}
        >
          <div>
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
              <Sparkles className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              设置 AI 可见性
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              我们会研究你的品牌，并找出最相关的主题进行监测。
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="project-website">网站网址</FieldLabel>
            <Input
              id="project-website"
              inputMode="url"
              autoComplete="url"
              placeholder="输入你的网站网址"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              required
            />
          </Field>
          {getErrorCode(researchMutation.error) === "INSUFFICIENT_CREDITS" ? (
            <InsufficientCreditsError title="无法研究该网站" />
          ) : (
            researchMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  无法研究该网站。请检查网址和提供商设置后重试。
                </AlertDescription>
              </Alert>
            )
          )}
          <div className="space-y-3">
            <Button
              type="submit"
              size="lg"
              disabled={!website.trim()}
              className="w-full"
            >
              开始研究
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isEveryAppClientAuthMode()
                ? "研究和首次运行提示词会使用你 Every App 网关上的 DataForSEO 和 OpenRouter 密钥。"
                : "研究和首次运行提示词会消耗少量用量积分。"}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
