import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/client/components/ui/combobox";
import { LOCATION_OPTIONS } from "@/shared/keyword-locations";

type LocationOption = (typeof LOCATION_OPTIONS)[number];

type Props = {
  value: number;
  onChange: (locationCode: number) => void;
  /** Defaults to the full country list. Pass a subset (e.g. Labs-only). */
  options?: readonly LocationOption[];
  /** Width utilities for the field. Defaults to full width. */
  className?: string;
};

function matches(option: LocationOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    option.label.toLowerCase().includes(needle) ||
    option.shortLabel.toLowerCase().includes(needle)
  );
}

/** Searchable country picker: type to filter the country list. */
export function LocationSelect({
  value,
  onChange,
  options = LOCATION_OPTIONS,
  className = "w-full",
}: Props) {
  const selected = options.find((option) => option.code === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      itemToStringLabel={(option) => option.label}
      autoHighlight
      filter={matches}
      onValueChange={(option) => {
        if (option) onChange(option.code);
      }}
    >
      <ComboboxInput
        className={className}
        placeholder="选择国家或地区"
        aria-label="国家或地区"
      />
      <ComboboxContent>
        <ComboboxEmpty>没有匹配的国家或地区。</ComboboxEmpty>
        <ComboboxList>
          {(option: LocationOption) => (
            <ComboboxItem key={option.code} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
