import { useId, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { FormDialog } from "@/client/components/FormDialog";
import { Button } from "@/client/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/client/components/ui/field";
import { Switch } from "@/client/components/ui/switch";
import {
  RESULT_LIMITS,
  type KeywordMode,
} from "@/client/features/keywords/keywordResearchTypes";
import { isLabsLocationCode } from "@/client/features/keywords/locations";
import type { KeywordResearchControllerState } from "./types";

type Props = {
  controller: KeywordResearchControllerState;
};

const RESULT_ITEMS = RESULT_LIMITS.map((limit) => ({
  value: limit,
  label: `${limit} 条结果`,
}));

const MODE_ITEMS: { value: KeywordMode; label: string }[] = [
  { value: "auto", label: "自动" },
  { value: "suggestions", label: "短语匹配" },
  { value: "ideas", label: "分类灵感" },
  { value: "related", label: "相关搜索" },
];

const GOOGLE_ADS_ONLY_NOTE =
  "使用 Google Ads 数据的国家或地区不支持此选项。";

/** The search settings most people leave at their defaults. */
export function KeywordSearchOptions({ controller }: Props) {
  const {
    controlsForm,
    preferredGroupKeywords: groupKeywords,
    setPreferredGroupKeywords: setGroupKeywords,
  } = controller;
  const [open, setOpen] = useState(false);

  return (
    <controlsForm.Subscribe selector={(state) => state.values}>
      {(values) => {
        // Google-Ads-only countries ignore source, clickstream, and grouping.
        const labs = isLabsLocationCode(values.locationCode);
        const local = Boolean(values.locationName);

        return (
          <>
            <Button
              variant="outline"
              className="w-full font-normal lg:w-auto lg:shrink-0"
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
            >
              <SlidersHorizontal data-icon="inline-start" />
              选项
            </Button>

            {open ? (
              <FormDialog
                title="搜索选项"
                onClose={() => setOpen(false)}
                actions={<Button onClick={() => setOpen(false)}>完成</Button>}
              >
                <controlsForm.AppField name="resultLimit">
                  {(field) => (
                    <field.SelectField label="结果数" items={RESULT_ITEMS} />
                  )}
                </controlsForm.AppField>

                <controlsForm.AppField name="mode">
                  {(field) => (
                    <field.SelectField
                      label="关键词来源"
                      description={labs ? undefined : GOOGLE_ADS_ONLY_NOTE}
                      items={MODE_ITEMS}
                      disabled={!labs}
                    />
                  )}
                </controlsForm.AppField>

                <controlsForm.Field name="clickstream">
                  {(field) => (
                    <ToggleRow
                      label="点击流修正搜索量"
                      help={
                        !labs
                          ? GOOGLE_ADS_ONLY_NOTE
                          : local
                            ? "本地结果不支持。点击流数据仅覆盖整个国家或地区。"
                            : "Google 会把相似关键词合并为一个搜索量。此选项会估算每个关键词自身的搜索量，消耗双倍额度。"
                      }
                      // The saved choice returns when the option applies again.
                      checked={labs && !local && field.state.value}
                      disabled={!labs || local}
                      onChange={(checked) => field.handleChange(checked)}
                    />
                  )}
                </controlsForm.Field>

                <ToggleRow
                  label="合并关键词"
                  help={labs ? undefined : GOOGLE_ADS_ONLY_NOTE}
                  checked={labs && groupKeywords}
                  disabled={!labs}
                  onChange={setGroupKeywords}
                />
              </FormDialog>
            ) : null}
          </>
        );
      }}
    </controlsForm.Subscribe>
  );
}

function ToggleRow({
  label,
  help,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <Field orientation="horizontal" data-disabled={disabled}>
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {help ? (
          <FieldDescription id={`${id}-description`}>{help}</FieldDescription>
        ) : null}
      </FieldContent>
      <Switch
        id={id}
        aria-describedby={help ? `${id}-description` : undefined}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </Field>
  );
}
