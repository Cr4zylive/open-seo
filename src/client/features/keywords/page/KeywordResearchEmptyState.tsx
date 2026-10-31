import { Link } from "@tanstack/react-router";
import { Globe, Search } from "lucide-react";
import { EmptyState } from "@/client/components/EmptyState";
import { RecentSearches } from "@/client/components/RecentSearches";
import { LOCATIONS } from "@/client/features/keywords/utils";
import type { KeywordResearchControllerState } from "./types";

type Props = {
  controller: KeywordResearchControllerState;
  projectId: string;
};

export function KeywordResearchEmptyState({ controller, projectId }: Props) {
  // The page renders loading and error states before this component.
  if (controller.hasSearched) {
    return <NoResultsState controller={controller} />;
  }

  return <SearchHistoryState controller={controller} projectId={projectId} />;
}

function NoResultsState({
  controller,
}: {
  controller: KeywordResearchControllerState;
}) {
  const { lastSearchKeyword, lastSearchLocationCode } = controller;

  return (
    <div className="mx-auto w-full max-w-2xl pt-1">
      <EmptyState
        variant="card"
        icon={Globe}
        title="此查询还没有足够的关键词数据"
        description={
          <>
            未能找到
            <span className="font-medium text-foreground">
              {` 「${lastSearchKeyword}」 `}
            </span>
            在
            <span className="font-medium text-foreground">
              {` ${LOCATIONS[lastSearchLocationCode] || "此地区"}`}
            </span>
            的关键词机会。
          </>
        }
      />
    </div>
  );
}

function SearchHistoryState({
  controller,
  projectId,
}: {
  controller: KeywordResearchControllerState;
  projectId: string;
}) {
  return (
    <div className="pt-1">
      <RecentSearches
        items={controller.history}
        loaded={controller.historyLoaded}
        onRemove={controller.removeHistoryItem}
        emptyIcon={Search}
        emptyTitle="输入关键词开始研究"
        emptyDescription="搜索任意关键词，查看搜索量、难度、CPC 和相关关键词灵感。"
        getTitle={(item) => item.keyword}
        getSubtitle={(item) => item.locationName}
        renderLink={(item, props) => (
          <Link
            from="/p/$projectId/keywords"
            to="/p/$projectId/keywords"
            params={{ projectId }}
            search={{
              q: item.keyword,
              loc: item.locationCode,
              locName: item.localLocationName,
              grp: controller.preferredGroupKeywords ? true : undefined,
            }}
            replace
            {...props}
          />
        )}
      />
    </div>
  );
}
