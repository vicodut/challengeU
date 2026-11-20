import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useListCoaches } from '@/api/generated/endpoints/enrollment/enrollment';

/** The coaches of the signed-in student's program (the API scopes the list). */
export function StudentCoachesPage() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useListCoaches();
  const items = data?.status === 200 ? data.data.items : null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{t('studentCoaches.title')}</h2>
      {isPending ? (
        <p>{t('programs.loading')}</p>
      ) : isError || !items ? (
        <p role="alert">{t('studentCoaches.loadError')}</p>
      ) : items.length === 0 ? (
        <p>{t('studentCoaches.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((coach) => (
            <li key={coach.id} className="flex justify-between rounded-md border p-3">
              <span>{coach.displayName}</span>
              <Link to={`/student/coaches/${coach.id}/week`} className="text-sm underline">
                {t('studentCoaches.week', { name: coach.displayName })}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
