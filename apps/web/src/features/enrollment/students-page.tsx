import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useListStudents } from '@/api/generated/endpoints/enrollment/enrollment';

export function StudentsPage() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useListStudents();
  const items = data?.status === 200 ? data.data.items : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t('students.title')}</h2>
        <Link to="/admin/students/new" className="text-sm underline">
          {t('students.new')}
        </Link>
      </div>
      {isPending ? (
        <p>{t('programs.loading')}</p>
      ) : isError || !items ? (
        <p role="alert">{t('students.loadError')}</p>
      ) : items.length === 0 ? (
        <p>{t('students.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((student) => (
            <li key={student.id} className="flex justify-between rounded-md border p-3">
              <Link to={`/admin/students/${student.id}`} className="underline">
                {student.displayName}
              </Link>
              <span className="text-sm">
                {student.programName} · {t(`students.status.${student.status}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
