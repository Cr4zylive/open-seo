import { Button } from "@/client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { SUPPORT_EMAIL } from "@/client/lib/support";

// Checkout can't sell the yearly plans yet, so /subscribe sends people who
// pick one to support, or lets them start monthly and switch later.
export function AnnualPlanDialog({
  open,
  onOpenChange,
  planName,
  annualPriceUsd,
  onSubscribeMonthly,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  annualPriceUsd: number;
  onSubscribeMonthly: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>年付套餐目前通过邮件开通</DialogTitle>
          <DialogDescription>
            发邮件到 {SUPPORT_EMAIL}，我们会帮你转到 {planName}，年付 $
            {annualPriceUsd.toLocaleString()}。应用内年付即将上线。
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          想今天就开始？先订阅月付，之后切换时，我们会把本月剩余部分抵到年付套餐。
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onSubscribeMonthly();
            }}
          >
            订阅月付
          </Button>
          <Button
            nativeButton={false}
            render={
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  `Yearly ${planName}`,
                )}`}
              />
            }
          >
            发邮件给我们
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
