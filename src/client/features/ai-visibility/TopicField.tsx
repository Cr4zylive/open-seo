import { useId, useState } from "react";
import { Field, FieldLabel } from "@/client/components/ui/field";
import { Input } from "@/client/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";

/** Picks a saved topic or names a new one. */
export function TopicField({
  topics,
  value,
  onChange,
}: {
  topics: string[];
  value: string;
  onChange: (topic: string) => void;
}) {
  const topicId = useId();
  // Kept separately so typing a saved topic's name doesn't hide the input.
  const [creating, setCreating] = useState(!topics.includes(value));
  const items = [
    ...topics.map((name) => ({ value: name, label: name })),
    { value: "", label: "新主题" },
  ];
  return (
    <>
      {topics.length > 0 && (
        <Field>
          <FieldLabel>主题</FieldLabel>
          <Select
            items={items}
            value={creating ? "" : value}
            onValueChange={(name) => {
              setCreating(!name);
              onChange(name ?? "");
            }}
          >
            <SelectTrigger className="w-full" aria-label="主题">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      {creating && (
        <Field>
          <FieldLabel htmlFor={topicId}>主题名称</FieldLabel>
          <Input
            id={topicId}
            required
            maxLength={100}
            placeholder="例如 SEO 工具"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </Field>
      )}
    </>
  );
}
