import { useId } from "react";
import { Link, Link2, Unlink } from "lucide-react";
import { SegmentedToggle } from "@/client/components/SegmentedToggle";
import { DataTableFilterGroup } from "@/client/components/table/DataTableToolbar";
import { Checkbox } from "@/client/components/ui/checkbox";
import { Label } from "@/client/components/ui/label";
import { DomainFilterPanel } from "@/client/features/domain/components/DomainFilterPanel";
import type { BacklinksTab } from "@/types/schemas/backlinks";
import {
  BACKLINKS_FILTER_FIELDS,
  REFERRING_DOMAINS_FILTER_FIELDS,
  TOP_PAGES_FILTER_FIELDS,
  countFilterConditions,
  type BacklinksTabFilterValues,
} from "./backlinksFilterTypes";
import type { BacklinksFiltersState } from "./useBacklinksFilters";

/**
 * Filters are applied explicitly (not per keystroke) because every change
 * triggers a billed DataForSEO request. Each include/exclude term and each
 * set field costs one DataForSEO filter condition, capped per request —
 * DomainFilterPanel surfaces the count and gates Apply.
 */
export function BacklinksFilterPanel({
  activeTab,
  filters,
  onApplied,
  maxConditions,
}: {
  activeTab: BacklinksTab;
  filters: BacklinksFiltersState;
  onApplied: () => void;
  /** Scope filters can consume part of the DataForSEO condition budget. */
  maxConditions?: number;
}) {
  if (activeTab === "backlinks") {
    const state = filters.backlinks;
    return (
      <DomainFilterPanel
        key="backlinks"
        appliedFilters={state.values}
        fields={BACKLINKS_FILTER_FIELDS}
        activeFilterCount={state.activeFilterCount}
        countConditions={countFilterConditions}
        maxConditions={maxConditions}
        textFields={[
          {
            key: "include",
            label: "来源网址包含",
            placeholder: "example.com、博客",
          },
          {
            key: "exclude",
            label: "来源网址排除",
            placeholder: "垃圾内容、论坛",
          },
        ]}
        rangeFields={[
          {
            title: "域名权威度",
            minKey: "minDomainRank",
            maxKey: "maxDomainRank",
          },
          {
            title: "链接权威度",
            minKey: "minLinkAuthority",
            maxKey: "maxLinkAuthority",
          },
          {
            title: "垃圾链接分数",
            minKey: "minSpamScore",
            maxKey: "maxSpamScore",
            step: "0.1",
          },
        ]}
        onApply={(values) => {
          state.apply(values);
          onApplied();
        }}
        onClear={() => {
          state.reset();
          onApplied();
        }}
        renderExtra={(draft, setValue) => (
          <BacklinksToggleControls draft={draft} setValue={setValue} />
        )}
      />
    );
  }

  if (activeTab === "domains") {
    const state = filters.domains;
    return (
      <DomainFilterPanel
        key="domains"
        appliedFilters={state.values}
        fields={REFERRING_DOMAINS_FILTER_FIELDS}
        activeFilterCount={state.activeFilterCount}
        countConditions={countFilterConditions}
        maxConditions={maxConditions}
        textFields={[
          {
            key: "include",
            label: "域名包含",
            placeholder: "example.com、博客",
          },
          {
            key: "exclude",
            label: "域名排除",
            placeholder: "垃圾内容、论坛",
          },
        ]}
        rangeFields={[
          {
            title: "反向链接",
            minKey: "minBacklinks",
            maxKey: "maxBacklinks",
          },
          { title: "排名", minKey: "minRank", maxKey: "maxRank" },
          {
            title: "垃圾链接分数",
            minKey: "minSpamScore",
            maxKey: "maxSpamScore",
            step: "0.1",
          },
        ]}
        onApply={(values) => {
          state.apply(values);
          onApplied();
        }}
        onClear={() => {
          state.reset();
          onApplied();
        }}
      />
    );
  }

  const state = filters.pages;
  return (
    <DomainFilterPanel
      key="pages"
      appliedFilters={state.values}
      fields={TOP_PAGES_FILTER_FIELDS}
      activeFilterCount={state.activeFilterCount}
      countConditions={countFilterConditions}
      maxConditions={maxConditions}
      textFields={[
        {
          key: "include",
          label: "页面网址包含",
          placeholder: "/blog, /products",
        },
        {
          key: "exclude",
          label: "页面网址排除",
          placeholder: "/tag, /author",
        },
      ]}
      rangeFields={[
        { title: "反向链接", minKey: "minBacklinks", maxKey: "maxBacklinks" },
        {
          title: "引用域名",
          minKey: "minReferringDomains",
          maxKey: "maxReferringDomains",
        },
        { title: "排名", minKey: "minRank", maxKey: "maxRank" },
      ]}
      onApply={(values) => {
        state.apply(values);
        onApplied();
      }}
      onClear={() => {
        state.reset();
        onApplied();
      }}
    />
  );
}

const LINK_TYPE_ITEMS = [
  { value: "all", icon: <Link2 />, label: "全部" },
  { value: "dofollow", icon: <Link />, label: "Dofollow" },
  { value: "nofollow", icon: <Unlink />, label: "Nofollow" },
];

function BacklinksToggleControls({
  draft,
  setValue,
}: {
  draft: BacklinksTabFilterValues;
  setValue: (key: keyof BacklinksTabFilterValues, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <DataTableFilterGroup label="链接类型">
        <SegmentedToggle
          showLabels
          items={LINK_TYPE_ITEMS}
          value={draft.linkType || "all"}
          onChange={(value) =>
            setValue("linkType", value === "all" ? "" : value)
          }
        />
      </DataTableFilterGroup>

      <DataTableFilterGroup label="可见性">
        <div className="flex h-7 items-center gap-4">
          <VisibilityCheckbox
            label="隐藏已丢失"
            checked={draft.hideLost === "true"}
            onCheckedChange={(checked) =>
              setValue("hideLost", checked ? "true" : "")
            }
          />
          <VisibilityCheckbox
            label="隐藏失效"
            checked={draft.hideBroken === "true"}
            onCheckedChange={(checked) =>
              setValue("hideBroken", checked ? "true" : "")
            }
          />
        </div>
      </DataTableFilterGroup>
    </div>
  );
}

function VisibilityCheckbox({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="text-xs font-normal">
        {label}
      </Label>
    </div>
  );
}
