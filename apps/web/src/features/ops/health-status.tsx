import { useTranslation } from 'react-i18next';
import { useGetHealth } from '@/api/generated/endpoints/ops/ops';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function HealthStatus() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useGetHealth();

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{t('health.title')}</CardTitle>
      </CardHeader>
      <CardContent aria-live="polite">
        {isPending ? (
          <Badge>{t('health.checking')}</Badge>
        ) : isError || data.status !== 200 ? (
          <Badge variant="destructive">{t('health.unavailable')}</Badge>
        ) : (
          <div className="flex flex-col gap-2">
            <Badge variant="success">
              {t('health.ok', { status: data.data.status, database: data.data.database })}
            </Badge>
            <p className="text-muted-foreground text-sm">
              {t('health.serverTime', { time: data.data.checkedAt })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
