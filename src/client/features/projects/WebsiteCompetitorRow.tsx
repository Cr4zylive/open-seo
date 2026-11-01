import { Check, Pencil, Trash2 } from "lucide-react";
import { DomainFavicon } from "@/client/features/ai-visibility/DomainFavicon";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import { TableCell, TableRow } from "@/client/components/ui/table";

export type WebsiteCompetitor = {
  id: string;
  name: string;
  domain: string;
  notes: string;
};

export function WebsiteCompetitorRow({
  competitor,
  index,
  editing,
  onChange,
  onEdit,
  onRemove,
}: {
  competitor: WebsiteCompetitor;
  index: number;
  editing: boolean;
  onChange: (competitor: WebsiteCompetitor) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <span className="flex items-center gap-2">
          <DomainFavicon domain={competitor.domain} />
          {editing ? (
            <Input
              autoFocus
              aria-label={`竞争对手 ${index + 1} 名称`}
              placeholder="竞争对手名称"
              required
              maxLength={120}
              value={competitor.name}
              onChange={(event) =>
                onChange({ ...competitor, name: event.target.value })
              }
            />
          ) : (
            <span className="font-medium">{competitor.name}</span>
          )}
        </span>
      </TableCell>
      <TableCell>
        {editing ? (
          <Input
            aria-label={`竞争对手 ${index + 1} 网站`}
            placeholder="example.com"
            required
            maxLength={255}
            value={competitor.domain}
            onChange={(event) =>
              onChange({ ...competitor, domain: event.target.value, notes: "" })
            }
          />
        ) : (
          <span className="text-muted-foreground">{competitor.domain}</span>
        )}
      </TableCell>
      <TableCell className="w-20">
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={
              editing
                ? "完成编辑竞争对手"
                : `编辑 ${competitor.name}`
            }
            disabled={
              editing && (!competitor.name.trim() || !competitor.domain.trim())
            }
            onClick={onEdit}
          >
            {editing ? (
              <Check className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`移除 ${competitor.name || `竞争对手 ${index + 1}`}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
