import { Link } from "@tanstack/react-router";
import { Button } from "@/client/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";

export function NotFound() {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>404</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          未找到你访问的页面。
        </CardContent>
        <CardFooter>
          <Button nativeButton={false} render={<Link to="/" />}>
            首页
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
