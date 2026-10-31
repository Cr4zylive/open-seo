import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CrawlerAccessForm,
  crawlerCredentialsQueryKey,
} from "@/client/features/crawler-access/CrawlerAccessForm";
import {
  deleteCrawlerCredential,
  listCrawlerCredentials,
} from "@/serverFunctions/crawlerAccess";
import { isCrawlerAccessExpired } from "@/shared/crawler-access";
import { Button } from "@/client/components/ui/button";
import {
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";

const formatDate = (value: string) => new Date(value).toLocaleDateString();

/**
 * Shopify crawler-access signatures saved on this project. The audit crawler
 * replays them per host, and other projects in the organization that audit
 * the same host pick them up too.
 */
export function CrawlerAccessSettings({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const credentialsQuery = useQuery({
    queryKey: crawlerCredentialsQueryKey,
    queryFn: () => listCrawlerCredentials(),
    select: (rows) => rows.filter((row) => row.projectId === projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCrawlerCredential({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: crawlerCredentialsQueryKey,
      });
      toast.success("已移除爬虫访问");
    },
  });

  const credentials = credentialsQuery.data ?? [];

  return (
    <Card size="lg">
      <CardHeader className={isAdding ? "border-b" : undefined}>
        <CardTitle>
          <h2 className="leading-tight">Shopify</h2>
        </CardTitle>
        <CardAction className="self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding((value) => !value)}
          >
            {isAdding ? "取消" : "连接"}
          </Button>
        </CardAction>
      </CardHeader>
      {isAdding ? (
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            让审计爬虫通过 Shopify。把你在 Shopify 后台「Online Store」→
            「Preferences」→「Crawler access」里创建的签名粘贴进来。组织内对该
            域名的每次审计都会随请求发送它。
          </p>
          <CrawlerAccessForm
            projectId={projectId}
            initialHost=""
            onSaved={() => setIsAdding(false)}
          />
        </CardContent>
      ) : null}
      {credentialsQuery.isError || credentials.length > 0 ? (
        <CardContent>
          {credentialsQuery.isError ? (
            <p className="text-sm text-destructive">
              无法加载你的爬虫访问设置。
            </p>
          ) : credentials.length > 0 ? (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>域名</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>添加时间</TableHead>
                    <TableHead>到期时间</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((credential) => (
                    <TableRow key={credential.id}>
                      <TableCell className="font-mono">
                        {credential.host}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Shopify 签名
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(credential.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {credential.expiresAt
                          ? formatDate(credential.expiresAt)
                          : "未知"}
                        {isCrawlerAccessExpired(credential.expiresAt) && (
                          <span className="ml-2 text-destructive">已过期</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`移除 ${credential.host} 的爬虫访问`}
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(credential.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
