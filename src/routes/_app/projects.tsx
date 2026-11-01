import * as React from "react";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  getArchivedProjects,
  restoreProject,
} from "@/serverFunctions/projects";
import { PageHeader, SectionHeader } from "@/client/components/PageHeader";
import { QueryState } from "@/client/components/QueryState";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { getLastProjectId } from "@/client/lib/active-project";
import { CreateProjectModal } from "@/client/features/projects/CreateProjectModal";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const [creating, setCreating] = React.useState(false);
  // Read after mount to keep SSR/first render stable.
  const [currentProjectId, setCurrentProjectId] = React.useState<string | null>(
    null,
  );
  React.useEffect(() => {
    setCurrentProjectId(getLastProjectId());
  }, []);
  const projectsQuery = useQuery(projectsQueryOptions());

  return (
    <div className="h-full overflow-auto px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="项目"
          description="每个项目有各自的 Search Console、排名跟踪和审计。"
          actions={
            <Button onClick={() => setCreating(true)}>
              <Plus data-icon="inline-start" />
              新建项目
            </Button>
          }
        />

        <QueryState
          query={projectsQuery}
          errorFallback="无法加载项目"
        >
          {(data) => (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {data.map((project) => (
                <li key={project.id}>
                  <Link
                    to="/p/$projectId/settings"
                    params={{ projectId: project.id }}
                    className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {project.name}
                        </span>
                        {project.id === currentProjectId ? (
                          <Badge variant="secondary" size="sm">
                            当前
                          </Badge>
                        ) : null}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {project.domain ?? "尚未设置域名"}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </QueryState>

        <ArchivedProjects />
      </div>

      {creating ? (
        <CreateProjectModal onClose={() => setCreating(false)} />
      ) : null}
    </div>
  );
}

function ArchivedProjects() {
  const queryClient = useQueryClient();
  const archivedQuery = useQuery({
    queryKey: ["projects", "archived"],
    queryFn: () => getArchivedProjects(),
  });
  const archived = archivedQuery.data ?? [];

  const restoreMutation = useMutation({
    mutationFn: (projectId: string) =>
      restoreProject({ data: { archivedProjectId: projectId } }),
    onSuccess: async () => {
      // Prefix match invalidates both the active and archived lists.
      await queryClient.invalidateQueries({
        queryKey: projectsQueryOptions().queryKey,
      });
      toast.success("项目已恢复");
    },
  });

  if (archived.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader title="已归档" />
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {archived.map((project) => (
          <li
            key={project.id}
            className="flex items-center justify-between gap-3 p-3"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-muted-foreground">
                {project.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {project.domain ?? "尚未设置域名"}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => restoreMutation.mutate(project.id)}
              disabled={restoreMutation.isPending}
            >
              恢复
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
