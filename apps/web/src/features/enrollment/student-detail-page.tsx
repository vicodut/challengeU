import { useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  getGetStudentQueryKey,
  getListProgramsQueryKey,
  getListStudentsQueryKey,
  useGetStudent,
  useListPrograms,
  useUpdateStudent,
} from '@/api/generated/endpoints/enrollment/enrollment';
import { Button } from '@/shared/ui/button';

const ERROR_KEYS: Record<number, string> = {
  404: 'students.errors.PROGRAM_NOT_FOUND',
  422: 'students.errors.invalid',
};

export function StudentDetailPage() {
  const { t } = useTranslation();
  const { studentId = '' } = useParams();
  const queryClient = useQueryClient();
  const student = useGetStudent(studentId);
  const programs = useListPrograms();
  const update = useUpdateStudent();
  const [message, setMessage] = useState<{ key: string; ok: boolean } | null>(null);
  const items = programs.data?.status === 200 ? programs.data.data.items : [];

  async function move(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('programId');
    if (typeof value !== 'string' || !value) return;
    setMessage(null);
    try {
      const response = await update.mutateAsync({ id: studentId, data: { programId: value } });
      if (response.status === 200) {
        await Promise.all(
          [
            getGetStudentQueryKey(studentId),
            getListStudentsQueryKey(),
            getListProgramsQueryKey(),
          ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
        setMessage({ key: 'students.moved', ok: true });
      } else {
        setMessage({ key: ERROR_KEYS[response.status] ?? 'programs.errors.server', ok: false });
      }
    } catch {
      setMessage({ key: 'programs.errors.network', ok: false });
    }
  }

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
      <form className="flex max-w-sm items-end gap-2" onSubmit={(event) => void move(event)}>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          {t('students.move')}
          {/* Keyed so the current program is selected once the programs have loaded. */}
          <select
            key={[items.length, detail.programId].join()}
            name="programId"
            className="h-9 rounded-md border px-2"
            defaultValue={detail.programId}
          >
            {items.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={update.isPending}>
          {t('students.move')}
        </Button>
      </form>
      {message ? (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={message.ok ? 'text-sm' : 'text-destructive text-sm'}
        >
          {t(message.key)}
        </p>
      ) : null}
    </section>
  );
}
