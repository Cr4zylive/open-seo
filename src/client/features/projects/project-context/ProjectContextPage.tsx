import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { getProjectContext } from "@/serverFunctions/projectContext";
import {
  PROJECT_CONTEXT_SECTION_KEYS,
  PROSE_MAX_CHARS,
  type ProjectContextSectionKey,
} from "@/types/schemas/projectContext";
import { CompetitorsSection } from "./CompetitorsSection";
import { KeyPagesSection } from "./KeyPagesSection";
import {
  ConfirmDeleteButton,
  EmptyState,
  FormActions,
  listClass,
  Provenance,
  RowActions,
  SectionHeader,
  projectContextQueryKey,
  useContextUpdate,
  type ProjectContextData,
} from "./shared";

const SECTION_LABELS: Record<ProjectContextSectionKey, string> = {
  business_overview: "业务概览",
  current_goal: "当前目标",
  positioning: "定位",
  writing_preferences: "写作偏好",
};

const SECTION_HINTS: Record<ProjectContextSectionKey, string> = {
  business_overview: "卖什么、卖给谁、卖到哪里。",
  current_goal: "眼下要推进的目标，以及截止时间。",
  positioning: "用户为什么选你而不是其他选择。",
  writing_preferences: "语气、要避免的词、不宜触及的话题。",
};

const SECTION_PLACEHOLDERS: Record<ProjectContextSectionKey, string> = {
  business_overview:
    "例如：面向美国和加拿大独立餐厅的预订软件。买家是店主，不是市场人员。",
  current_goal:
    "例如：第四季度将自然注册量翻倍。当前重点是对比页。",
  positioning:
    "例如：唯一能在一天下午完成上线的预订工具。比老牌产品更便宜，比自己拼装更简单。",
  writing_preferences:
    "例如：直白、不夸张。不要说「无缝」或「颠覆性」。不要写竞品定价。",
};

export function ProjectContextPage({ projectId }: { projectId: string }) {
  const contextQuery = useQuery({
    queryKey: projectContextQueryKey(projectId),
    queryFn: () => getProjectContext({ data: { projectId } }),
    // This page exists to inspect what agents just wrote; the app-wide
    // 5-minute staleTime would show pre-SAM-turn memory as current.
    staleTime: 0,
  });

  if (contextQuery.isPending) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (contextQuery.isError) {
    return (
      <div className="alert alert-error">
        <span className="text-sm">
          {getStandardErrorMessage(
            contextQuery.error,
            "无法加载项目上下文",
          )}
        </span>
      </div>
    );
  }

  const context = contextQuery.data;

  return (
    // key remounts the whole page when the project switches under it, so no
    // draft, open form, or edit state can carry over to another project.
    <div key={projectId} className="space-y-8">
      <p className="text-sm text-base-content/70">
        SAM、Claude Code 以及任何已连接的 MCP 客户端对这个项目的了解。它们在动手前会先读取这些内容，并写回学到的信息，所以看起来不对的地方请直接改正。
      </p>

      <ProseSections
        projectId={projectId}
        sections={context.sections}
        missingSections={context.missingSections}
      />

      <CompetitorsSection
        projectId={projectId}
        competitors={context.competitors}
      />

      <KeyPagesSection projectId={projectId} keyPages={context.keyPages} />

      <CustomSections
        projectId={projectId}
        customSections={context.customSections}
      />

      <ResearchLog projectId={projectId} researchLog={context.researchLog} />
    </div>
  );
}

function ProseSections({
  projectId,
  sections,
  missingSections,
}: {
  projectId: string;
  sections: ProjectContextData["sections"];
  missingSections: ProjectContextData["missingSections"];
}) {
  const update = useContextUpdate(projectId);
  const stored = new Map(sections.map((section) => [section.key, section]));
  // Only the fields the user actually touched are pinned locally; the rest
  // render straight from the query, so a write from SAM shows up on refetch.
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  const draftOf = (key: ProjectContextSectionKey) =>
    drafts[key] ?? stored.get(key)?.content ?? "";

  // Content is trimmed server-side, so compare trimmed values — otherwise a
  // stray newline leaves the form permanently "unsaved".
  const changed = PROJECT_CONTEXT_SECTION_KEYS.filter(
    (key) => draftOf(key).trim() !== (stored.get(key)?.content ?? ""),
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (update.isPending || changed.length === 0) return;
    update.mutate(
      changed.map((key) => ({ section: key, content: draftOf(key).trim() })),
      // Unpin every draft the save made redundant — one that now matches the
      // server — so those sections render from the query again (a pinned
      // draft would silently overwrite a later agent write on the next
      // save). Anything typed while the request was in flight still differs
      // and stays pinned instead of snapping back.
      {
        onSuccess: (context) => {
          const saved = new Map<string, string>(
            context.sections.map((section) => [section.key, section.content]),
          );
          setDrafts((current) =>
            Object.fromEntries(
              Object.entries(current).filter(
                ([key, value]) => value.trim() !== (saved.get(key) ?? ""),
              ),
            ),
          );
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {missingSections.length === PROJECT_CONTEXT_SECTION_KEYS.length ? (
        <EmptyState>
          还没有任何记录。先填你知道的内容，或让 SAM 根据网站起草，再核对它写对了哪些。
        </EmptyState>
      ) : null}

      {PROJECT_CONTEXT_SECTION_KEYS.map((key) => {
        const section = stored.get(key);
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <label
                htmlFor={`context-${key}`}
                className="text-sm font-medium text-base-content"
              >
                {SECTION_LABELS[key]}
              </label>
              {section ? (
                <Provenance by={section.updatedBy} at={section.updatedAt} />
              ) : (
                <span className="text-xs text-base-content/40">空</span>
              )}
            </div>
            <p className="text-xs text-base-content/50">{SECTION_HINTS[key]}</p>
            <textarea
              id={`context-${key}`}
              value={draftOf(key)}
              onChange={(event) => {
                const value = event.target.value;
                setDrafts((current) => {
                  // A draft that matches the store is no draft at all — drop
                  // it so an edit typed and then undone doesn't pin the
                  // section against later agent writes.
                  if (value === (stored.get(key)?.content ?? "")) {
                    const { [key]: _dropped, ...rest } = current;
                    return rest;
                  }
                  return { ...current, [key]: value };
                });
              }}
              rows={4}
              maxLength={PROSE_MAX_CHARS}
              placeholder={SECTION_PLACEHOLDERS[key]}
              className="textarea textarea-bordered w-full text-sm"
            />
          </div>
        );
      })}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={update.isPending || changed.length === 0}
        >
          保存更改
        </button>
      </div>
    </form>
  );
}

function CustomSections({
  projectId,
  customSections,
}: {
  projectId: string;
  customSections: ProjectContextData["customSections"];
}) {
  const update = useContextUpdate(projectId);
  const [editingSlug, setEditingSlug] = React.useState<string | null>(null);

  return (
    <section className="space-y-3">
      <SectionHeader
        title="自定义分区"
        hint="智能体记下的、放不进以上分区的内容。"
      />

      {customSections.length === 0 ? (
        <EmptyState>
          这里还没有内容。智能体学到重要信息却无处归类时，会新增一个分区。
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {customSections.map((custom) =>
            editingSlug === custom.slug ? (
              <CustomSectionForm
                key={custom.slug}
                custom={custom}
                pending={update.isPending}
                onCancel={() => setEditingSlug(null)}
                onSave={(title, content) =>
                  update.mutate(
                    [{ customSection: custom.slug, title, content }],
                    { onSuccess: () => setEditingSlug(null) },
                  )
                }
              />
            ) : (
              <div
                key={custom.slug}
                className="space-y-2 rounded-lg border border-base-300 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">
                      {custom.title ?? custom.slug}
                    </h3>
                    <Provenance by={custom.updatedBy} at={custom.updatedAt} />
                  </div>
                  <RowActions>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      aria-label={`编辑 ${custom.title ?? custom.slug}`}
                      onClick={() => setEditingSlug(custom.slug)}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <ConfirmDeleteButton
                      label={`删除 ${custom.title ?? custom.slug}`}
                      pending={update.isPending}
                      onConfirm={() =>
                        update.mutate([{ deleteCustomSection: custom.slug }])
                      }
                    />
                  </RowActions>
                </div>
                <p className="whitespace-pre-wrap text-sm text-base-content/70">
                  {custom.content}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function CustomSectionForm({
  custom,
  pending,
  onCancel,
  onSave,
}: {
  custom: ProjectContextData["customSections"][number];
  pending: boolean;
  onCancel: () => void;
  onSave: (title: string, content: string) => void;
}) {
  const [title, setTitle] = React.useState(custom.title ?? "");
  const [content, setContent] = React.useState(custom.content);

  return (
    <form
      className="space-y-2 rounded-lg border border-base-300 bg-base-200/40 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending || !content.trim()) return;
        onSave(title.trim() || custom.slug, content);
      }}
    >
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={custom.slug}
        maxLength={120}
        className="input input-bordered input-sm w-full"
        aria-label="分区标题"
      />
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={5}
        maxLength={PROSE_MAX_CHARS}
        className="textarea textarea-bordered w-full text-sm"
        aria-label="分区内容"
      />
      <FormActions
        pending={pending}
        disabled={!content.trim()}
        onCancel={onCancel}
      />
    </form>
  );
}

function ResearchLog({
  projectId,
  researchLog,
}: {
  projectId: string;
  researchLog: ProjectContextData["researchLog"];
}) {
  const update = useContextUpdate(projectId);

  return (
    <section className="space-y-3">
      <SectionHeader
        title="研究日志"
        hint="已经查过什么，避免重复购买同一份数据。"
      />

      {researchLog.length === 0 ? (
        <EmptyState>
          还没有日志。智能体在执行付费研究时会记录在这里。
        </EmptyState>
      ) : (
        <ul className={listClass}>
          {researchLog.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-3 p-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm text-base-content/80">{entry.summary}</p>
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-base-content/40">
                  <span>{entry.entryDate}</span>
                  <Provenance by={entry.createdBy} />
                </div>
              </div>
              <RowActions>
                <ConfirmDeleteButton
                  label={`删除 ${entry.entryDate} 的日志`}
                  pending={update.isPending}
                  onConfirm={() =>
                    update.mutate([{ removeResearchLog: [entry.id] }])
                  }
                />
              </RowActions>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
