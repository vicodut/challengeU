import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  getGetStudentQueryKey,
  getListStudentsQueryKey,
  useChangeStudentStatus,
  useGetStudent,
} from '@/api/generated/endpoints/enrollment/enrollment';
import { Button } from '@/shared/ui/button';

export function StudentDetailPage() {
  const { t } = useTranslation();
  const { studentId = '' } = useParams();
  const student = useGetStudent(studentId);
  const changeStatus = useChangeStudentStatus();
  const queryClient = useQueryClient();
  const [error, setError] = useState(false);

  if (student.isPending) return <p>{t('programs.loading')}</p>;
  const detail = student.data?.status === 200 ? student.data.data : null;
  if (!detail) {
    const missing = student.data?.status === 404;
    return <p role="alert">{t(missing ? 'students.notFound' : 'students.loadError')}</p>;
  }
  const next = detail.status === 'active' ? 'suspended' : 'active';

  async function toggle() {
    setError(false);
    try {
      const response = await changeStatus.mutateAsync({ id: studentId, data: { status: next } });
      if (response.status !== 200) {
        setError(true);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
      await queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
    } catch {
      setError(true);
    }
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
      <div className="flex items-center gap-3">
        <Button onClick={() => void toggle()} disabled={changeStatus.isPending}>
          {t(`students.action.${next}`)}
        </Button>
        {error && <p role="alert">{t('students.statusError')}</p>}
      </div>
    </section>
  );
}
