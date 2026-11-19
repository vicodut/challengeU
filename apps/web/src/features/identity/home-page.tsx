import { useTranslation } from 'react-i18next';
import { useGetMe } from '@/api/generated/endpoints/identity/identity';
import { endSession } from '@/shared/auth/session';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

/** Placeholder protected page: role areas and breadcrumbs arrive in a later ticket. */
export function HomePage() {
  const { t } = useTranslation();
  const { data } = useGetMe();
  const me = data?.status === 200 ? data.data : null;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">{t('app.name')}</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>
            {me ? t('home.signedInAs', { name: me.displayName }) : t('home.signedIn')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {me ? (
            <p className="text-muted-foreground text-sm">{t('home.role', { role: me.role })}</p>
          ) : null}
          <Button onClick={endSession}>{t('home.logout')}</Button>
        </CardContent>
      </Card>
    </main>
  );
}
