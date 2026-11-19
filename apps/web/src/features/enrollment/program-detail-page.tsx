import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import {
  getGetProgramQueryKey,
  useAssignCoach,
  useGetProgram,
  useListCoaches,
} from '@/api/generated/endpoints/enrollment/enrollment';
import { Button } from '@/shared/ui/button';

export function ProgramDetailPage() {
  const { t } = useTranslation();
  const { programId = '' } = useParams();
  const queryClient = useQueryClient();
  const program = useGetProgram(programId);
  const coaches = useListCoaches();
  const assignCoach = useAssignCoach();
  const [coachId, setCoachId] = useState('');
  const [error, setError] = useState(false);

  if (program.isPending) return <p>{t('programs.loading')}</p>;
  const detail = program.data?.status === 200 ? program.data.data : null;
  if (!detail) {
    const missing = program.data?.status === 404;
    return <p role="alert">{t(missing ? 'programs.notFound' : 'programs.loadError')}</p>;
  }
  const assigned = new Set(detail.coaches.map((coach) => coach.id));
  const available = (coaches.data?.status === 200 ? coaches.data.data.items : []).filter(
    (coach) => !assigned.has(coach.id),
  );

  async function assign() {
    setError(false);
    try {
      const response = await assignCoach.mutateAsync({ id: programId, data: { coachId } });
      if (response.status !== 204) {
        setError(true);
        return;
      }
      setCoachId('');
      await queryClient.invalidateQueries({ queryKey: getGetProgramQueryKey(programId) });
    } catch {
      setError(true);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">{detail.name}</h2>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">{t('programs.coaches')}</h3>
        {detail.coaches.length === 0 ? (
          <p>{t('programs.noCoaches')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {detail.coaches.map((coach) => (
              <li key={coach.id} className="rounded-md border p-3">
                {coach.displayName}
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void assign();
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            {t('programs.pickCoach')}
            <select
              className="h-9 rounded-md border px-2"
              value={coachId}
              onChange={(event) => {
                setCoachId(event.target.value);
              }}
              required
            >
              <option value="" />
              {available.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.displayName}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={assignCoach.isPending}>
            {t('programs.assign')}
          </Button>
        </form>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {t('programs.assignError')}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{t('programs.students')}</h3>
          <Link to={`/admin/students/new?programId=${programId}`} className="text-sm underline">
            {t('programs.assignStudent')}
          </Link>
        </div>
        {detail.students.length === 0 ? (
          <p>{t('programs.noStudents')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {detail.students.map((student) => (
              <li key={student.id} className="rounded-md border p-3">
                {student.displayName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
