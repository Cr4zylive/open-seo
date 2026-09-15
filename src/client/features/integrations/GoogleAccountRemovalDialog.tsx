import { useEffect, useId, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import {
  getGoogleAccountRemovalImpact,
  removeGoogleAccount,
} from "@/serverFunctions/googleAccounts";

export function GoogleAccountRemovalDialog({
  provider,
  accountId,
  label,
  onClose,
  onRemoved,
}: {
  provider: "gsc" | "ga4";
  accountId: string;
  label: string;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const queryClient = useQueryClient();
  const impact = useQuery({
    queryKey: ["googleAccountRemovalImpact", provider, accountId],
    queryFn: () =>
      getGoogleAccountRemovalImpact({ data: { provider, accountId } }),
    staleTime: 0,
    gcTime: 0,
  });
  const removal = useMutation({
    mutationFn: () =>
      removeGoogleAccount({ data: { provider, accountId, confirmed: true } }),
    onSuccess: async () => {
      const keys =
        provider === "gsc"
          ? [
              "gscConnection",
              "gscSites",
              "gscGrantStatus",
              "searchPerformance",
              "searchPerformanceTable",
              "dashboardGscReport",
              "dashboardActivation",
            ]
          : [
              "ga4Connection",
              "ga4Properties",
              "dashboardGa4Report",
              "dashboardActivation",
            ];
      await Promise.all(
        keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
      );
      onRemoved();
    },
  });
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const name = provider === "gsc" ? "Search Console" : "Google Analytics";
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="modal"
      onCancel={(event) => {
        event.preventDefault();
        if (!removal.isPending) onClose();
      }}
    >
      <div className="modal-box max-w-md space-y-4">
        <h3 id={titleId} className="text-lg font-semibold">
          移除 Google 账号？
        </h3>
        <p className="break-all text-sm font-medium">{label}</p>
        <p className="text-sm text-base-content/70">
          这会从 OpenSEO 移除该账号的 {name} 连接。之后可以随时重新连接。
        </p>
        {impact.isPending ? (
          <p role="status" className="text-sm text-base-content/60">
            正在检查已连接的项目…
          </p>
        ) : impact.isError ? (
          <div role="alert" className="text-sm">
            <p className="text-error">无法检查已连接的项目。</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void impact.refetch()}
            >
              重试
            </button>
          </div>
        ) : impact.data.projectCount > 0 ? (
          <p className="text-sm font-medium">
            这还会从 {impact.data.projectCount} 个项目断开 {name}。
          </p>
        ) : (
          <p className="text-sm text-base-content/60">
            不会影响任何项目。
          </p>
        )}
        {removal.isError ? (
          <p role="alert" className="text-sm text-error">
            {getStandardErrorMessage(removal.error)}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={removal.isPending}
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="btn btn-error btn-sm"
            disabled={
              !impact.isSuccess || impact.isFetching || removal.isPending
            }
            onClick={() => removal.mutate()}
          >
            {removal.isPending ? "移除中…" : "移除账号"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
