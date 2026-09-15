import type { ReactNode } from "react";
import { GoogleGlyph } from "@/client/features/gsc/GoogleGlyph";

export function GoogleProjectEmptyState({
  name,
  hasGrant,
  disabled,
  canManage,
  onChoose,
  onLink,
  children,
}: {
  name: string;
  hasGrant: boolean;
  disabled: boolean;
  canManage: boolean;
  onChoose: () => void;
  onLink: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/70">
        {hasGrant
          ? `选择一个 ${name} 媒体资源，完成本项目的连接。`
          : `连接 ${name} 以查看此项目的数据。`}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {canManage || hasGrant ? (
          <button
            type="button"
            onClick={hasGrant ? onChoose : onLink}
            disabled={disabled}
            aria-busy={disabled}
            className="inline-flex items-center gap-2.5 rounded-lg border border-base-300 bg-base-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-base-200 disabled:opacity-50"
          >
            {disabled ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              !hasGrant && <GoogleGlyph className="size-[18px]" />
            )}
            {disabled
              ? "正在打开 Google…"
              : canManage
                ? hasGrant
                  ? "选择媒体资源"
                  : "连接"
                : "管理 Google 账号"}
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
