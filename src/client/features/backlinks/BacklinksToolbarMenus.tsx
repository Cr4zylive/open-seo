import { ChevronDown, Gauge, Link2, MoreHorizontal } from "lucide-react";
import { Button } from "@/client/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { Spinner } from "@/client/components/ui/spinner";
import { DEFAULT_BACKLINKS_SPAM_THRESHOLD } from "@/types/schemas/backlinks";

export function BacklinksBestLinksMenu({
  hideSpam,
  onHideSpamChange,
}: {
  hideSpam: boolean;
  onHideSpamChange: (hideSpam: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <Link2 data-icon="inline-start" />
        优质链接：{hideSpam ? "开" : "关"}
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuRadioGroup
          value={hideSpam ? "best" : "all"}
          onValueChange={(value) => onHideSpamChange(value === "best")}
        >
          <DropdownMenuRadioItem value="best">
            <span>
              <span className="block">仅优质链接</span>
              <span className="block text-xs text-muted-foreground">
                分数低于 {DEFAULT_BACKLINKS_SPAM_THRESHOLD} 或未知
              </span>
            </span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="all">
            <span>
              <span className="block">全部链接（含垃圾链接）</span>
              <span className="block text-xs text-muted-foreground">
                包含分数 ≥ {DEFAULT_BACKLINKS_SPAM_THRESHOLD} 的链接
              </span>
            </span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BacklinksActionsMenu({
  isLoadingRatings,
  loadRatings,
  ratableDomains,
}: {
  isLoadingRatings: boolean;
  loadRatings: (domains: string[]) => void | Promise<void>;
  ratableDomains: string[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="反向链接表格操作"
            title="反向链接表格操作"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => void loadRatings(ratableDomains)}
          disabled={isLoadingRatings}
          title="查询表格中各域名的 Ahrefs 域名评级"
        >
          {isLoadingRatings ? <Spinner /> : <Gauge />}
          Ahrefs DR
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
