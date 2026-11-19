import { useGetHealth } from '@/api/generated/endpoints/ops/ops';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function HealthStatus() {
  const { data, isPending, isError } = useGetHealth();

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>API status</CardTitle>
      </CardHeader>
      <CardContent aria-live="polite">
        {isPending ? (
          <Badge>Checking…</Badge>
        ) : isError || data.status !== 200 ? (
          <Badge variant="destructive">API unavailable</Badge>
        ) : (
          <div className="flex flex-col gap-2">
            <Badge variant="success">
              API {data.data.status} · database {data.data.database}
            </Badge>
            <p className="text-muted-foreground text-sm">Server time: {data.data.checkedAt}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
