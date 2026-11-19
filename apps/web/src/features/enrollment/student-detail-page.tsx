import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useGetStudent } from '@/api/generated/endpoints/enrollment/enrollment';

export function StudentDetailPage() {
  const { t } = useTranslation();
  const { studentId = '' } = useParams();
  const student = useGetStudent(studentId);

  if (student.isPending) return <p>{t('programs.loading')}</p>;
  const detail = student.data?.status === 200 ? student.data.data : null;
  if (!detail) {
    const missing = student.data?.status === 404;
    return <p role="alert">{t(missing ? 'students.notFound' : 'students.loadError')}</p>;
  }
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{detail.displayName}</h2>
      <dl className="grid max-w-sm grid-cols-2 gap-2 text-sm">
        <dt>{t('students.program')}</dt>
        <dd>{detail.programName}</dd>
        <dt>{t('students.statusLabel')}</dt>
        <dd>{t(`students.status.${detail.status}`)}</dd>
        <dt>{t('students.timeZone')}</dt>
        <dd>{detail.timeZone}</dd>
        <dt>{t('students.statusChangedAt')}</dt>
        <dd>{new Date(detail.statusChangedAt).toLocaleString()}</dd>
      </dl>
    </section>
  );
}
