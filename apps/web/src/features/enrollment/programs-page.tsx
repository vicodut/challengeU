import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useListPrograms } from '@/api/generated/endpoints/enrollment/enrollment';

export function ProgramsPage() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useListPrograms();
  const items = data?.status === 200 ? data.data.items : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t('programs.title')}</h2>
        <Link to="/admin/programs/new" className="text-sm underline">
          {t('programs.new')}
        </Link>
      </div>
      {isPending ? (
        <p>{t('programs.loading')}</p>
      ) : isError || !items ? (
        <p role="alert">{t('programs.loadError')}</p>
      ) : items.length === 0 ? (
        <p>{t('programs.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((program) => (
            <li key={program.id} className="rounded-md border p-3">
              {program.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
