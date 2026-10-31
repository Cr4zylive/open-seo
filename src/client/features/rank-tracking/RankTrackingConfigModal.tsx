import { useId, useState } from "react";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { useQuery } from "@tanstack/react-query";
import { revalidateLogic, useStore } from "@tanstack/react-form";
import { Info } from "lucide-react";
import { useAppForm } from "@/client/components/form/useAppForm";
import { CountryCombobox } from "@/client/components/CountryCombobox";
import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { Field, FieldLabel } from "@/client/components/ui/field";
import type { RankTrackingConfig } from "@/types/schemas/rank-tracking";
import { domainField, normalizeDomain } from "@/types/schemas/domain";
import { pagesToDepth, estimateRankCheckCredits } from "@/shared/rank-tracking";
import { getLanguageCode } from "@/client/features/keywords/locations";
import {
  SERP_LANGUAGE_OPTIONS,
  getIsoCountryCode,
} from "@/shared/keyword-locations";
import type { ProjectMarket } from "@/client/features/projects/types";
import { QueryError } from "@/client/components/QueryState";
import { Spinner } from "@/client/components/Spinner";
import { getFieldError } from "@/client/lib/forms";
import { SearchTargetingField } from "./SearchTargetingField";
import { KeywordSuggestionStep } from "./KeywordSuggestionStep";
import {
  useSaveConfigMutations,
  type SaveConfigInput,
} from "./useSaveConfigMutations";
import { ScheduleField } from "./ScheduleField";
import {
  localScheduleTimeFrom,
  randomScheduleDate,
  withBrowserTimeZone,
  type LocalScheduleTime,
} from "./scheduleTime";

type Props = {
  projectId: string;
  existingConfig?: RankTrackingConfig | null;
  onClose: () => void;
  onSaved: (createdConfigId?: string) => void;
  onConfigCreated?: () => void;
};

type ConfigFormValues = Omit<SaveConfigInput, "scheduleTime"> & {
  scheduleTime: LocalScheduleTime;
};

const LANGUAGE_ITEMS = SERP_LANGUAGE_OPTIONS.map((language) => ({
  value: language.code,
  label: language.label,
}));

const DEVICE_ITEMS: { value: SaveConfigInput["devices"]; label: string }[] = [
  { value: "both", label: "桌面端和移动端" },
  { value: "desktop", label: "仅桌面端" },
  { value: "mobile", label: "仅移动端" },
];

const DEPTH_ITEMS = Array.from({ length: 10 }, (_, i) => i + 1).map(
  (pages) => ({
    value: pagesToDepth(pages),
    label: `${pages} 页（前 ${pages * 10} 条结果）`,
  }),
);

function validateConfig(values: ConfigFormValues) {
  const fields: Partial<Record<keyof ConfigFormValues, string>> = {};
  if (!values.domain.trim()) {
    fields.domain = "请输入域名";
  } else if (!domainField.safeParse(values.domain).success) {
    fields.domain = "请输入有效域名，例如 example.com";
  }
  if (values.targetingMode === "local" && !values.locationName) {
    fields.locationName = "请选择用于本地定向的城市或地区";
  }
  return Object.keys(fields).length > 0 ? { fields } : undefined;
}

export function RankTrackingConfigModal({
  projectId,
  existingConfig,
  onClose,
  onSaved,
  onConfigCreated,
}: Props) {
  // A new domain starts from the project's market, so it waits for projects.
  const projectsQuery = useQuery({
    ...projectsQueryOptions(),
    enabled: !existingConfig,
  });
  const initialMarket =
    existingConfig ??
    projectsQuery.data?.find((project) => project.id === projectId);

  if (!initialMarket) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">添加域名</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-40 items-center justify-center">
            {projectsQuery.isPending ? (
              <Spinner />
            ) : (
              <QueryError
                error={projectsQuery.error}
                fallback="无法加载项目。"
                onRetry={() => void projectsQuery.refetch()}
                isRetrying={projectsQuery.isFetching}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <RankTrackingConfigModalContent
      projectId={projectId}
      existingConfig={existingConfig}
      initialMarket={initialMarket}
      onClose={onClose}
      onSaved={onSaved}
      onConfigCreated={onConfigCreated}
    />
  );
}

function RankTrackingConfigModalContent({
  projectId,
  existingConfig,
  initialMarket,
  onClose,
  onSaved,
  onConfigCreated,
}: Props & { initialMarket: ProjectMarket }) {
  const countryId = useId();
  const isEdit = !!existingConfig;
  const [createdConfigId, setCreatedConfigId] = useState<string>();
  // An untouched edit leaves the stored run time alone; anything that changes
  // the schedule sends the time on screen so it is the one that gets saved.
  const [scheduleTimeEdited, setScheduleTimeEdited] = useState(false);

  const { createMutation, updateMutation } = useSaveConfigMutations({
    projectId,
    existingConfig,
    onCreated: (configId) => {
      setCreatedConfigId(configId);
      onConfigCreated?.();
    },
    onUpdated: () => onSaved(),
  });

  // Built once: the schedule default is random, and new default values would
  // reset the form on every render.
  const [defaultValues] = useState<ConfigFormValues>(() => ({
    domain: existingConfig?.domain ?? "",
    locationCode: existingConfig?.locationCode ?? initialMarket.locationCode,
    languageCode: existingConfig?.languageCode ?? initialMarket.languageCode,
    targetingMode: existingConfig?.locationName ? "local" : "national",
    locationName: existingConfig?.locationName ?? undefined,
    devices: existingConfig?.devices ?? "mobile",
    schedule: existingConfig?.scheduleInterval ?? "weekly",
    // Shown and edited in the browser's timezone; the server converts it to UTC.
    scheduleTime: localScheduleTimeFrom(
      existingConfig?.nextCheckAt
        ? new Date(existingConfig.nextCheckAt)
        : randomScheduleDate(),
    ),
    serpDepth: existingConfig?.serpDepth ?? 40,
  }));

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: ({ value }) => validateConfig(value) },
    onSubmit: async ({ value, formApi }) => {
      const domain = domainField.parse(value.domain);
      formApi.setFieldValue("domain", domain);
      const sendScheduleTime =
        value.schedule !== "manual" &&
        (!existingConfig ||
          scheduleTimeEdited ||
          value.schedule !== existingConfig.scheduleInterval);
      const input: SaveConfigInput = {
        ...value,
        domain,
        scheduleTime: sendScheduleTime
          ? withBrowserTimeZone(value.scheduleTime)
          : undefined,
      };
      await (isEdit
        ? updateMutation.mutateAsync(input)
        : createMutation.mutateAsync(input));
    },
  });
  const values = useStore(form.store, (state) => state.values);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const closeKeywordStep = () => onSaved(createdConfigId);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (open || isSubmitting) return;
        if (createdConfigId) closeKeywordStep();
        else onClose();
      }}
    >
      <DialogContent
        showCloseButton={!!createdConfigId}
        className={createdConfigId ? "sm:max-w-3xl" : "sm:max-w-lg"}
      >
        {createdConfigId ? (
          <KeywordSuggestionStep
            configId={createdConfigId}
            projectId={projectId}
            domain={values.domain}
            locationCode={values.locationCode}
            onDone={onSaved}
            onClose={closeKeywordStep}
          />
        ) : (
          <form.AppForm>
            <form.Form className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>
                  {isEdit ? "编辑域名配置" : "添加域名"}
                </DialogTitle>
              </DialogHeader>

              <form.AppField
                name="domain"
                listeners={{
                  onBlur: ({ value }) => {
                    try {
                      form.setFieldValue("domain", normalizeDomain(value), {
                        dontValidate: true,
                      });
                    } catch {
                      // Keep invalid partial input editable; submit shows the error.
                    }
                  },
                }}
              >
                {(field) => (
                  <field.TextField
                    label="目标域名"
                    placeholder="example.com"
                  />
                )}
              </form.AppField>

              <Field>
                <FieldLabel htmlFor={countryId}>国家或地区</FieldLabel>
                <CountryCombobox
                  id={countryId}
                  value={values.locationCode}
                  onChange={(locationCode) => {
                    form.setFieldValue("locationCode", locationCode);
                    form.setFieldValue(
                      "languageCode",
                      getLanguageCode(locationCode),
                    );
                    // A picked city belongs to the previous country.
                    form.setFieldValue("locationName", undefined);
                  }}
                />
              </Field>

              <form.Field name="locationName">
                {(field) => (
                  <SearchTargetingField
                    mode={values.targetingMode}
                    onModeChange={(mode) =>
                      form.setFieldValue("targetingMode", mode)
                    }
                    locationName={field.state.value}
                    onLocationNameChange={field.handleChange}
                    countryCode={getIsoCountryCode(values.locationCode)}
                    error={getFieldError(field.state.meta.errors) ?? undefined}
                  />
                )}
              </form.Field>

              <form.AppField name="languageCode">
                {(field) => (
                  <field.SelectField
                    label="语言"
                    items={LANGUAGE_ITEMS}
                    description="默认使用该国家或地区的语言。任意语言都可以在任意国家追踪——选择客户实际搜索用的语言。"
                  />
                )}
              </form.AppField>

              <div className="flex flex-col gap-1.5">
                <form.AppField name="devices">
                  {(field) => (
                    <field.SelectField
                      label="设备"
                      items={DEVICE_ITEMS}
                      description="大多数 Google 搜索来自移动端，但请按你的客户选择。"
                    />
                  )}
                </form.AppField>
                {values.devices === "both" && (
                  <p className="flex items-start gap-1.5 text-xs text-info">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    同时追踪两种设备时，每次关键词检查消耗双倍额度
                  </p>
                )}
              </div>

              <ScheduleField
                schedule={values.schedule}
                onScheduleChange={(schedule) =>
                  form.setFieldValue("schedule", schedule)
                }
                scheduleTime={values.scheduleTime}
                onScheduleTimeChange={(time) => {
                  form.setFieldValue("scheduleTime", time);
                  setScheduleTimeEdited(true);
                }}
              />

              <form.AppField name="serpDepth">
                {(field) => (
                  <field.SelectField
                    label="搜索深度"
                    items={DEPTH_ITEMS}
                    description="10 页的费用约为 1 页的 8 倍"
                  />
                )}
              </form.AppField>

              <CostEstimate
                devices={values.devices}
                serpDepth={values.serpDepth}
                schedule={values.schedule}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <form.SubmitButton>
                  {isEdit ? "保存更改" : "添加域名"}
                </form.SubmitButton>
              </DialogFooter>
            </form.Form>
          </form.AppForm>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CostEstimate({
  devices,
  serpDepth,
  schedule,
}: Pick<ConfigFormValues, "devices" | "serpDepth" | "schedule">) {
  // Scheduled checks run through the cheaper task queue; manual configs only
  // ever pay the live price.
  const { costUsd: costPerKeyword } = estimateRankCheckCredits(
    ["plain keyword"],
    devices,
    serpDepth,
    schedule === "manual" ? "live" : "queued",
  );
  const checksPerMonth =
    schedule === "daily" ? 30 : schedule === "weekly" ? 4 : 1;
  return (
    <div className="space-y-0.5 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
      <div>
        <span className="font-mono font-semibold text-foreground">
          最高 ${costPerKeyword.toFixed(4)}
        </span>{" "}
        / 关键词 / 次检查
      </div>
      {schedule !== "manual" && (
        <div>
          50 个关键词每月最高约{" "}
          <span className="font-mono font-semibold text-foreground">
            ${(costPerKeyword * 50 * checksPerMonth).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
