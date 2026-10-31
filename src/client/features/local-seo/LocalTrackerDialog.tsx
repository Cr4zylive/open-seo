import { lazy, Suspense, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { revalidateLogic } from "@tanstack/react-form";
import { useAppForm } from "@/client/components/form/useAppForm";
import { FormDialog } from "@/client/components/FormDialog";
import { Button } from "@/client/components/ui/button";
import { Skeleton } from "@/client/components/ui/skeleton";
import { QueryError } from "@/client/components/QueryState";
import {
  createLocalTracker,
  lookupLocalBusiness,
} from "@/serverFunctions/local-seo";
import { SerpLocationCombobox } from "@/client/components/SerpLocationCombobox";
import { usePrewarmSerpLocations } from "@/client/components/usePrewarmSerpLocations";
import { Field, FieldError, FieldLabel } from "@/client/components/ui/field";
import { useProjectMarket } from "@/client/features/projects/useProjectMarket";
import { getIsoCountryCode } from "@/shared/keyword-locations";
import { cleanKeywords, LocalKeywordFields } from "./LocalKeywordFields";
import { LocalListingChoices, type Listing } from "./LocalListingChoices";

const ListingMap = lazy(() => import("./LocalListingMap"));

export function LocalTrackerDialog({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [listing, setListing] = useState<Listing | null>(null);
  return listing ? (
    <TrackerSettings
      projectId={projectId}
      listing={listing}
      onClose={onClose}
      onCreated={onCreated}
    />
  ) : (
    <ListingLookup
      projectId={projectId}
      onClose={onClose}
      onSelect={setListing}
    />
  );
}

function ListingLookup({
  projectId,
  onClose,
  onSelect,
}: {
  projectId: string;
  onClose: () => void;
  onSelect: (listing: Listing) => void;
}) {
  const market = useProjectMarket(projectId);
  const countryCode = market ? getIsoCountryCode(market.locationCode) : "us";
  usePrewarmSerpLocations(countryCode, Boolean(market));
  const [selected, setSelected] = useState(0);
  const lookup = useMutation({
    mutationFn: (data: { query: string; locationName: string }) =>
      lookupLocalBusiness({ data: { projectId, ...data } }),
    // A single match needs no picking, so setup opens straight away.
    onSuccess: (found) => {
      setSelected(0);
      if (found.length === 1) onSelect(found[0]);
    },
  });
  const form = useAppForm({
    defaultValues: { query: "", locationName: "" },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: z.object({
        query: z.string().trim().min(2, "请输入商家名称。").max(200),
        locationName: z.string().min(1, "请选择商家所在城市。"),
      }),
    },
    onSubmit: async ({ value }) => {
      await lookup.mutateAsync(value);
    },
  });
  const listings = lookup.data && lookup.data.length > 1 ? lookup.data : null;
  return (
    <FormDialog
      title="添加商家"
      onClose={onClose}
      wide={Boolean(listings)}
      actions={
        listings ? (
          <>
            <Button variant="outline" onClick={() => lookup.reset()}>
              重新搜索
            </Button>
            <Button onClick={() => onSelect(listings[selected])}>
              使用此商家
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              form="local-business-lookup"
              pending={lookup.isPending}
            >
              查找商家
            </Button>
          </>
        )
      }
    >
      {listings ? (
        <div className="grid gap-4 md:grid-cols-2">
          <LocalListingChoices
            listings={listings}
            selected={selected}
            onSelectedChange={setSelected}
          />
          <div className="min-h-80 overflow-hidden rounded-lg border border-border">
            <Suspense fallback={<Skeleton className="h-full rounded-none" />}>
              <ListingMap
                projectId={projectId}
                listings={listings}
                selected={selected}
                onSelectedChange={setSelected}
              />
            </Suspense>
          </div>
        </div>
      ) : (
        <form.AppForm>
          <form.Form id="local-business-lookup" className="space-y-4">
            <form.AppField name="query">
              {(field) => (
                <field.TextField
                  label="商家名称"
                  placeholder="例如 张记披萨"
                />
              )}
            </form.AppField>
            <form.Field name="locationName">
              {(field) => {
                const error = field.state.meta.errors[0]?.message;
                return (
                  <Field data-invalid={Boolean(error) || undefined}>
                    <FieldLabel htmlFor="local-business-city">城市</FieldLabel>
                    <SerpLocationCombobox
                      id="local-business-city"
                      value={field.state.value || undefined}
                      onChange={(value) => field.handleChange(value ?? "")}
                      countryCode={countryCode}
                      invalid={Boolean(error)}
                    />
                    {error ? <FieldError>{error}</FieldError> : null}
                  </Field>
                );
              }}
            </form.Field>
          </form.Form>
        </form.AppForm>
      )}
      {lookup.isPending && (
        <p className="text-sm text-muted-foreground">
          正在搜索 Google Maps，通常需要几秒钟。
        </p>
      )}
      {lookup.isError && (
        <QueryError
          title="无法查找此商家"
          cause={lookup.error}
          fallback="请稍后重试。"
        />
      )}
      {lookup.isSuccess && lookup.data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          没有找到 Google Maps 商家。请确认名称与商家信息一致，且城市正确。
        </p>
      )}
    </FormDialog>
  );
}

// Grid size and spacing as the area a customer would recognize. The width is
// (gridSize - 1) × spacing, and each point is one paid search per keyword.
const AREAS = {
  neighborhood: {
    label: "街区 · 宽 2 公里 · 9 个采样点",
    gridSize: 3,
    spacingKm: 1,
  },
  town: { label: "城镇 · 宽 4 公里 · 9 个采样点", gridSize: 3, spacingKm: 2 },
  city: { label: "城市 · 宽 8 公里 · 25 个采样点", gridSize: 5, spacingKm: 2 },
  metro: {
    label: "都市区 · 宽 20 公里 · 25 个采样点",
    gridSize: 5,
    spacingKm: 5,
  },
} as const;
type Area = keyof typeof AREAS;

function TrackerSettings({
  projectId,
  listing,
  onClose,
  onCreated,
}: {
  projectId: string;
  listing: Listing;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { business, suggestedKeywords } = listing;
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (input: Parameters<typeof createLocalTracker>[0]["data"]) =>
      createLocalTracker({ data: input }),
    onSuccess: (tracker) => {
      void queryClient.invalidateQueries({ queryKey: ["localSeo", projectId] });
      onCreated(tracker.id);
    },
  });
  const form = useAppForm({
    defaultValues: {
      keywords: suggestedKeywords.length ? suggestedKeywords : [""],
      area: "town" as Area,
    },
    onSubmit: async ({ value }) => {
      const area = AREAS[value.area];
      await create.mutateAsync({
        projectId,
        business,
        keywords: cleanKeywords(value.keywords),
        gridSize: area.gridSize,
        spacingKm: area.spacingKm,
      });
    },
  });
  return (
    <FormDialog
      title="设置本地追踪"
      onClose={onClose}
      actions={
        <>
          <Button
            variant="outline"
            disabled={create.isPending}
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="local-tracker-settings"
            pending={create.isPending}
          >
            保存商家
          </Button>
        </>
      }
    >
      <div>
        <p className="text-sm font-medium">{business.title}</p>
        <p className="text-sm text-muted-foreground">{business.address}</p>
      </div>
      <form.AppForm>
        <form.Form id="local-tracker-settings" className="space-y-4">
          <form.Field name="keywords">
            {(field) => (
              <LocalKeywordFields
                value={field.state.value}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <form.AppField name="area">
            {(field) => (
              <field.SelectField
                label="检查范围"
                description="我们会以你的商家为中心，在此范围内的采样点搜索 Google Maps。"
                items={Object.entries(AREAS).map(([value, { label }]) => ({
                  value,
                  label,
                }))}
              />
            )}
          </form.AppField>
        </form.Form>
      </form.AppForm>
      {create.isError && (
        <QueryError
          error={create.error}
          fallback="无法保存此商家。"
        />
      )}
    </FormDialog>
  );
}
