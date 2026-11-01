import { useId } from "react";
import { SerpLocationCombobox } from "@/client/components/SerpLocationCombobox";
import { usePrewarmSerpLocations } from "@/client/components/usePrewarmSerpLocations";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/client/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/client/components/ui/radio-group";

type TargetingMode = "national" | "local";

export function SearchTargetingField({
  mode,
  onModeChange,
  locationName,
  onLocationNameChange,
  countryCode,
  error,
}: {
  mode: TargetingMode;
  onModeChange: (mode: TargetingMode) => void;
  locationName: string | undefined;
  onLocationNameChange: (locationName: string | undefined) => void;
  countryCode: string;
  /** The error for the city, shown under the city search. */
  error?: string;
}) {
  const id = useId();
  // Warm the moment Local targeting is in play.
  usePrewarmSerpLocations(countryCode, mode === "local");
  return (
    <FieldSet className="gap-2" data-invalid={error ? true : undefined}>
      <FieldLegend variant="label" className="mb-0">
        搜索定向
      </FieldLegend>
      <RadioGroup
        value={mode}
        onValueChange={(value) => {
          if (value === "local") onModeChange("local");
          if (value === "national") {
            onModeChange("national");
            onLocationNameChange(undefined);
          }
        }}
        className="flex gap-4"
      >
        <Field orientation="horizontal" className="w-auto">
          <RadioGroupItem value="national" id={`${id}-national`} />
          <FieldLabel htmlFor={`${id}-national`} className="font-normal">
            全国
          </FieldLabel>
        </Field>
        <Field orientation="horizontal" className="w-auto">
          <RadioGroupItem value="local" id={`${id}-local`} />
          <FieldLabel htmlFor={`${id}-local`} className="font-normal">
            本地
          </FieldLabel>
        </Field>
      </RadioGroup>
      <FieldDescription>
        {mode === "local" ? (
          <>
            <span className="font-medium text-success">适合：</span>
            「附近」查询、城市/地区关键词、服务覆盖页。
          </>
        ) : (
          <>
            本地定向可能会低估未带地理修饰词的关键词排名。
          </>
        )}
      </FieldDescription>
      {mode === "local" && (
        <>
          <FieldLabel htmlFor={`${id}-city`} className="sr-only">
            城市或地区
          </FieldLabel>
          <SerpLocationCombobox
            id={`${id}-city`}
            value={locationName}
            onChange={onLocationNameChange}
            countryCode={countryCode}
            placeholder="搜索城市…"
            invalid={Boolean(error)}
          />
        </>
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  );
}
