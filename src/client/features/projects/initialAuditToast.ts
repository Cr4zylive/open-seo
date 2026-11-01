import { toast } from "sonner";
import { getStandardErrorMessage } from "@/client/lib/error-messages";

/** Tells the user whether saving a website started its first site scan. */
export function toastInitialAudit(
  initialAudit:
    | { status: "started" | "pending" }
    | { status: "unavailable"; code: string }
    | null,
) {
  if (initialAudit?.status === "unavailable")
    toast.warning("网站已保存。首次扫描未能启动。", {
      description: getStandardErrorMessage(new Error(initialAudit.code)),
    });
  else if (initialAudit?.status === "started")
    toast.success("50 页站点扫描正在运行");
}
