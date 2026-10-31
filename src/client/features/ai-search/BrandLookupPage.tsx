import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BarChart3, Quote, Sparkles, TrendingUp } from "lucide-react";
import { lookupBrand } from "@/serverFunctions/ai-search";
import { useHostedPlanGate } from "@/client/features/billing/HostedPlanGate";
import { ResearchPageShell } from "@/client/features/ai-search/ResearchPageShell";
import { PromptTrackingWithoutUpgradeButton } from "@/client/features/ai-visibility/shared";
import { BrandLookupResults } from "@/client/features/ai-search/components/BrandLookupResults";
import { BrandLookupSearchCard } from "@/client/features/ai-search/components/BrandLookupSearchCard";
import { RecentSearches } from "@/client/components/RecentSearches";
import { BackLink } from "@/client/components/PageHeader";
import { Badge } from "@/client/components/ui/badge";
import { useBrandLookupSearchHistory } from "@/client/hooks/useBrandLookupSearchHistory";
import {
  BRAND_LOOKUP_MAX_INPUT_LENGTH,
  parseCompetitorList,
} from "@/types/schemas/ai-search";
import { detectTarget } from "@/shared/targetDetection";
import {
  parseResearchTarget,
  RESEARCH_SCOPE_LABELS,
  toScopeSearchParam,
  type ResearchScope,
} from "@/shared/researchScope";

type Props = {
  projectId: string;
  initialQuery: string;
  initialCompetitors: string[];
  initialScope: ResearchScope | undefined;
  onSearchChange: (
    nextQuery: string,
    nextCompetitors: string[],
    nextScope: ResearchScope | undefined,
  ) => void;
};

const KEYWORD_SCOPE_REASON = "范围仅适用于域名查询";

const BRAND_LOOKUP_BULLETS = [
  {
    icon: TrendingUp,
    title: "追踪 AI 可见性",
    body: "查看 ChatGPT 和 Google AI 摘要中引用您品牌的预估次数，并观察月度趋势。",
  },
  {
    icon: Quote,
    title: "查看相关提示词",
    body: "查看大模型提及您品牌或域名的用户问题样本。",
  },
  {
    icon: BarChart3,
    title: "了解竞争格局",
    body: "找出大模型与您同时引用的页面，了解 AI 回答中的注意力竞争者。",
  },
];

export function BrandLookupPage({
  projectId,
  initialQuery,
  initialCompetitors,
  initialScope,
  onSearchChange,
}: Props) {
  const planStatus = useHostedPlanGate();
  const [query, setQuery] = useState(initialQuery);
  // The user's explicit scope pick, or undefined to follow the input's default.
  const [scopeChoice, setScopeChoice] = useState<ResearchScope | undefined>(
    initialScope,
  );
  // Raw comma-separated competitor text; parsed into a deduped array on submit.
  const [competitorsInput, setCompetitorsInput] = useState(
    initialCompetitors.join(", "),
  );
  // Field-tagged so the error styling lands on the input that caused it.
  const [validationError, setValidationError] = useState<{
    field: "query" | "competitors";
    message: string;
  } | null>(null);

  const trimmedInitialQuery = initialQuery.trim();
  const hasActiveQuery = trimmedInitialQuery.length > 0;
  // The URL `c` param is the source of truth for the active lookup; the local
  // `competitorsInput` text only drives the input until the next submit. A
  // stable string key, since `initialCompetitors` is a fresh array each render.
  const competitorKey = initialCompetitors.join(",");

  // Scope only applies to domain/URL inputs. The pick always stays selectable
  // — an invalid one (Subfolder without a path) errors on submit instead of
  // the select greying out or changing under the user.
  const scopeTarget = useMemo(() => {
    if (detectTarget(query).type !== "domain") return null;
    const parsed = parseResearchTarget(query);
    return parsed.ok ? parsed.target : null;
  }, [query]);

  const selectedScope = scopeChoice ?? scopeTarget?.scope ?? "domain";
  // Only grey the control once the input is clearly a brand keyword — an
  // empty box shouldn't look disabled before the user has typed anything.
  const scopeDisabledReason =
    query.trim() !== "" && !scopeTarget ? KEYWORD_SCOPE_REASON : undefined;

  const lookupQuery = useQuery({
    queryKey: [
      "brand-lookup",
      projectId,
      trimmedInitialQuery,
      competitorKey,
      initialScope ?? "",
    ],
    queryFn: () =>
      lookupBrand({
        data: {
          projectId,
          query: trimmedInitialQuery,
          competitors: initialCompetitors,
          scope: initialScope,
          locationCode: 2840,
          languageCode: "en",
        },
      }),
    // Client-side gate is a UX optimization only; the paywall is enforced
    // server-side (lookupBrand → assertPaidPlan) before any DataForSEO spend,
    // so a stale free-plan window here just yields a rejected request, not cost.
    enabled: hasActiveQuery && planStatus === "paid",
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const {
    history,
    isLoaded: historyLoaded,
    addSearch,
    removeHistoryItem,
  } = useBrandLookupSearchHistory(projectId);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setValidationError({
        field: "query",
        message: "输入品牌名称或域名",
      });
      return;
    }
    if (trimmed.length > BRAND_LOOKUP_MAX_INPUT_LENGTH) {
      setValidationError({
        field: "query",
        message: `请控制在 ${BRAND_LOOKUP_MAX_INPUT_LENGTH} 个字符以内`,
      });
      return;
    }
    const competitors = parseCompetitorList(competitorsInput);
    // Mirror the server's input schema (per-item max) and its competitor
    // resolution (a competitor that resolves to the target is dropped) so the
    // user gets an inline message instead of a generic server error or a
    // silently missing Share of Voice section.
    const tooLong = competitors.find(
      (competitor) => competitor.length > BRAND_LOOKUP_MAX_INPUT_LENGTH,
    );
    if (tooLong) {
      setValidationError({
        field: "competitors",
        message: `每个竞争对手请控制在 ${BRAND_LOOKUP_MAX_INPUT_LENGTH} 个字符以内`,
      });
      return;
    }
    const targetValue = detectTarget(trimmed).value.toLowerCase();
    const matchesTarget = competitors.find(
      (competitor) =>
        detectTarget(competitor).value.toLowerCase() === targetValue,
    );
    if (matchesTarget) {
      setValidationError({
        field: "competitors",
        message: `「${matchesTarget}」就是你正在查询的品牌，请从竞争对手中移除`,
      });
      return;
    }
    if (
      scopeTarget &&
      selectedScope === "subfolder" &&
      scopeTarget.path === ""
    ) {
      setValidationError({
        field: "query",
        message: "使用「目录」范围时请带上路径（例如 example.com/blog）",
      });
      return;
    }
    setValidationError(null);
    // Keyword lookups never carry a scope; domain lookups omit it when it
    // matches the query's implied default.
    const explicitScope = scopeTarget
      ? toScopeSearchParam(trimmed, selectedScope)
      : undefined;
    onSearchChange(trimmed, competitors, explicitScope);
  };

  // The project is part of both keys, so switching projects resets the form
  // and records the search in the new project's history.
  const historyKey = `${projectId}::${trimmedInitialQuery}::${competitorKey}::${initialScope ?? ""}`;

  return (
    <ResearchPageShell
      title="品牌查询"
      description="查看 AI 搜索如何引用任意品牌名或域名。"
      gate={{
        feature: "品牌查询",
        description:
          "查看 ChatGPT 和 Google AI 摘要对品牌或域名的引用情况，包括提及总量、相关提示词样本，以及同时被引用的页面。",
        features: BRAND_LOOKUP_BULLETS,
        alternative: (
          <PromptTrackingWithoutUpgradeButton projectId={projectId} />
        ),
      }}
      form={
        <BrandLookupSearchCard
          query={query}
          onQueryChange={(next) => {
            setQuery(next);
            if (validationError) setValidationError(null);
          }}
          scope={selectedScope}
          onScopeChange={setScopeChoice}
          scopeDisabledReason={scopeDisabledReason}
          competitors={competitorsInput}
          onCompetitorsChange={(next) => {
            setCompetitorsInput(next);
            if (validationError) setValidationError(null);
          }}
          onSubmit={handleSubmit}
          isLoading={hasActiveQuery && lookupQuery.isPending}
          validationError={validationError}
        />
      }
      query={lookupQuery}
      hasActiveQuery={hasActiveQuery}
      errorFallback="无法加载品牌查询"
      // The form resets whenever the URL `q`/`c`/`scope` changes, including
      // browser back and history links. `competitorKey` is a stable string,
      // unlike the fresh-each-render `initialCompetitors` array.
      urlKey={`${initialQuery}::${historyKey}`}
      onUrlChange={() => {
        setQuery(initialQuery);
        setCompetitorsInput(competitorKey.split(",").join(", "));
        setScopeChoice(initialScope);
        setValidationError(null);
      }}
      historyKey={historyKey}
      onSuccess={() =>
        addSearch({
          query: trimmedInitialQuery,
          competitors: competitorKey ? competitorKey.split(",") : [],
          scope: initialScope,
        })
      }
      backLink={
        <BackLink
          from="/p/$projectId/brand-lookup"
          to="/p/$projectId/brand-lookup"
          params={{ projectId }}
          search={{ q: undefined, c: undefined, scope: undefined }}
          replace
        >
          最近搜索
        </BackLink>
      }
      renderResults={(result) => (
        <BrandLookupResults result={result} projectId={projectId} />
      )}
      history={
        <RecentSearches
          items={history}
          loaded={historyLoaded}
          onRemove={removeHistoryItem}
          emptyIcon={Sparkles}
          emptyTitle="搜索品牌名称或域名，查看 AI 的引用情况"
          getTitle={(item) => (
            <>
              {item.query}
              {/* Only non-default scopes are stored, so this badge always
                  adds information the query string doesn't carry. */}
              {item.scope ? (
                <Badge variant="secondary" className="ml-2">
                  {RESEARCH_SCOPE_LABELS[item.scope]}
                </Badge>
              ) : null}
            </>
          )}
          getSubtitle={(item) =>
            item.competitors.length > 0
              ? `对比 ${item.competitors.join(", ")}`
              : null
          }
          renderLink={(item, props) => (
            <Link
              from="/p/$projectId/brand-lookup"
              to="/p/$projectId/brand-lookup"
              params={{ projectId }}
              search={{
                q: item.query,
                c:
                  item.competitors.length > 0
                    ? item.competitors.join(",")
                    : undefined,
                scope: item.scope,
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
