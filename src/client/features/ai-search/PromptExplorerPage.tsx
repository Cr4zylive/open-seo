import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { identity, sortBy } from "remeda";
import { Columns3, MessageSquare, SearchCheck, Sparkles } from "lucide-react";
import { useHostedPlanGate } from "@/client/features/billing/HostedPlanGate";
import { ResearchPageShell } from "@/client/features/ai-search/ResearchPageShell";
import { PromptTrackingWithoutUpgradeButton } from "@/client/features/ai-visibility/shared";
import { PromptExplorerForm } from "@/client/features/ai-search/components/PromptExplorerForm";
import { PromptExplorerLoadingState } from "@/client/features/ai-search/components/PromptExplorerLoadingState";
import { PromptExplorerResults } from "@/client/features/ai-search/components/PromptExplorerResults";
import {
  PROMPT_EXPLORER_STALE_TIME_MS,
  buildPromptExplorerQueryKey,
  promptExplorerQueryFn,
  type PromptExplorerSearch,
} from "@/client/features/ai-search/promptExplorerQuery";
import { SearchTabStrip } from "@/client/features/search-tabs/SearchTabStrip";
import type {
  PromptSearchTabInput,
  SearchTabInput,
} from "@/client/features/search-tabs/types";
import { useSearchTabNavigation } from "@/client/features/search-tabs/useSearchTabNavigation";
import { RecentSearches } from "@/client/components/RecentSearches";
import { BackLink } from "@/client/components/PageHeader";
import { formatModelLabel } from "@/shared/prompt-explorer-labels";
import { usePromptExplorerSearchHistory } from "@/client/hooks/usePromptExplorerSearchHistory";
import {
  BRAND_LOOKUP_MAX_INPUT_LENGTH,
  PROMPT_EXPLORER_MAX_PROMPT_LENGTH,
} from "@/types/schemas/ai-search";

type PromptExplorerFormValues = PromptExplorerSearch;

type Props = {
  projectId: string;
  urlState: PromptExplorerFormValues;
  onSubmit: (values: PromptExplorerFormValues) => void;
  /** Clears the active search, back to recent searches. */
  onClear: () => void;
};

const PROMPT_EXPLORER_BULLETS = [
  {
    icon: Columns3,
    title: "并排对比四个模型",
    body: "用同一个提示词同时运行 ChatGPT、Claude、Gemini 和 Perplexity，并在一个视图中比较回答。",
  },
  {
    icon: SearchCheck,
    title: "查看模型引用来源",
    body: "每个回答都会列出引用来源，方便核查各模型的信息出处。",
  },
  {
    icon: Sparkles,
    title: "检查品牌提及",
    body: "突出显示品牌，立即查看它是否出现在回答正文或引用来源中。",
  },
];

// The strip truncates labels to its width; the tooltip shows the full prompt.
function promptTabLabel(input: SearchTabInput) {
  if (input.type !== "prompt") return "";
  return input.models.length > 1
    ? `${input.prompt} · ${input.models.length} 个模型`
    : input.prompt;
}

export function PromptExplorerPage({
  projectId,
  urlState,
  onSubmit,
  onClear,
}: Props) {
  const planStatus = useHostedPlanGate();
  const [form, setForm] = useState<PromptExplorerFormValues>(urlState);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    history,
    isLoaded: historyLoaded,
    addSearch,
    removeHistoryItem,
  } = usePromptExplorerSearchHistory(projectId);

  const trimmedPrompt = urlState.prompt.trim();
  const hasActivePrompt = trimmedPrompt.length > 0;

  const urlInput = useMemo<PromptSearchTabInput | null>(() => {
    const prompt = urlState.prompt.trim();
    if (!prompt) return null;
    return {
      type: "prompt",
      ...urlState,
      prompt,
      highlightBrand: urlState.highlightBrand.trim(),
    };
  }, [urlState]);

  const searchTabs = useSearchTabNavigation({
    storageKey: `prompt-explorer:${projectId}`,
    urlInput,
    getLabel: promptTabLabel,
    navigateToInput: useCallback(
      (input: SearchTabInput | null) => {
        if (input?.type !== "prompt") {
          onClear();
          return;
        }
        const { type: _type, ...search } = input;
        onSubmit(search);
      },
      [onClear, onSubmit],
    ),
  });

  const exploreQuery = useQuery({
    queryKey: buildPromptExplorerQueryKey(projectId, urlState),
    queryFn: () => promptExplorerQueryFn(projectId, urlState),
    // Client-side gate is a UX optimization only; the paywall is enforced
    // in the shared service before any DataForSEO spend,
    // so a stale free-plan window here just yields a rejected request, not cost.
    enabled: hasActivePrompt && planStatus === "paid",
    staleTime: PROMPT_EXPLORER_STALE_TIME_MS,
    gcTime: PROMPT_EXPLORER_STALE_TIME_MS,
    retry: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = form.prompt.trim();
    if (trimmed.length === 0) {
      setValidationError("输入提示词");
      return;
    }
    if (trimmed.length > PROMPT_EXPLORER_MAX_PROMPT_LENGTH) {
      setValidationError(
        `提示词请控制在 ${PROMPT_EXPLORER_MAX_PROMPT_LENGTH} 个字符以内`,
      );
      return;
    }
    if (form.highlightBrand.trim().length > BRAND_LOOKUP_MAX_INPUT_LENGTH) {
      setValidationError(
        `品牌请控制在 ${BRAND_LOOKUP_MAX_INPUT_LENGTH} 个字符以内`,
      );
      return;
    }
    if (form.models.length === 0) {
      setValidationError("请至少选择一个模型");
      return;
    }
    setValidationError(null);
    onSubmit({
      ...form,
      prompt: trimmed,
      highlightBrand: form.highlightBrand.trim(),
    });
  };

  const updateForm = <K extends keyof PromptExplorerFormValues>(
    key: K,
    value: PromptExplorerFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (validationError) setValidationError(null);
  };

  // The project is part of both keys, so switching projects resets the form
  // and records the search in the new project's history.
  const historyKey = [
    projectId,
    trimmedPrompt,
    urlState.highlightBrand.trim(),
    sortBy(urlState.models, identity()).join(","),
    urlState.webSearch,
    urlState.webSearchCountryCode,
  ].join("|");

  return (
    <ResearchPageShell
      contained
      title="提示词探索"
      description="用同一条提示词并排询问 ChatGPT、Claude、Gemini 和 Perplexity。"
      gate={{
        feature: "提示词探索",
        description:
          "用同一条提示词同时询问 ChatGPT、Claude、Gemini 和 Perplexity，并比较它们的回答，包括各模型引用的来源。",
        features: PROMPT_EXPLORER_BULLETS,
        alternative: (
          <PromptTrackingWithoutUpgradeButton projectId={projectId} />
        ),
      }}
      form={
        <PromptExplorerForm
          form={form}
          onPromptChange={(value) => updateForm("prompt", value)}
          onHighlightBrandChange={(value) =>
            updateForm("highlightBrand", value)
          }
          onModelsChange={(value) => updateForm("models", value)}
          onWebSearchChange={(value) => updateForm("webSearch", value)}
          onCountryChange={(value) => updateForm("webSearchCountryCode", value)}
          onSubmit={handleSubmit}
          validationError={validationError}
        />
      }
      tabs={
        hasActivePrompt ? (
          <SearchTabStrip
            projectId={projectId}
            activeTabId={searchTabs.activeTabId}
            tabs={searchTabs.tabs}
            onSelect={searchTabs.selectTab}
            onClose={searchTabs.closeTab}
            onViewed={searchTabs.markTabViewed}
          />
        ) : null
      }
      loadingState={<PromptExplorerLoadingState models={urlState.models} />}
      query={exploreQuery}
      hasActiveQuery={hasActivePrompt}
      errorFallback="无法加载提示词结果"
      // Covers browser back/forward and history links. The route builds a
      // fresh `urlState` object on every render, so compare by value.
      urlKey={`${projectId}:${JSON.stringify(urlState)}`}
      onUrlChange={() => {
        setForm(urlState);
        setValidationError(null);
      }}
      historyKey={historyKey}
      onSuccess={() =>
        addSearch({
          prompt: trimmedPrompt,
          highlightBrand: urlState.highlightBrand.trim(),
          models: urlState.models,
          webSearch: urlState.webSearch,
          webSearchCountryCode: urlState.webSearchCountryCode,
        })
      }
      backLink={
        <BackLink
          from="/p/$projectId/prompt-explorer"
          to="/p/$projectId/prompt-explorer"
          params={{ projectId }}
          search={{}}
          replace
        >
          最近搜索
        </BackLink>
      }
      renderResults={(result) => <PromptExplorerResults result={result} />}
      history={
        <RecentSearches
          items={history}
          loaded={historyLoaded}
          onRemove={removeHistoryItem}
          emptyIcon={MessageSquare}
          emptyTitle="输入提示词以比较模型回答"
          getTitle={(item) => item.prompt}
          getSubtitle={(item) => item.models.map(formatModelLabel).join(", ")}
          renderLink={(item, props) => (
            <Link
              from="/p/$projectId/prompt-explorer"
              to="/p/$projectId/prompt-explorer"
              params={{ projectId }}
              search={{
                q: item.prompt,
                models: item.models,
                web: item.webSearch ? undefined : false,
                cc: item.webSearchCountryCode,
                hb: item.highlightBrand || undefined,
              }}
              replace
              {...props}
            />
          )}
        />
      }
    />
  );
}
