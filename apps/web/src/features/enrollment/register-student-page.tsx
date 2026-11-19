import { useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import {
  getListProgramsQueryKey,
  getListStudentsQueryKey,
  useListPrograms,
  useRegisterStudent,
} from '@/api/generated/endpoints/enrollment/enrollment';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const ERROR_KEYS: Record<number, string> = {
  404: 'students.errors.PROGRAM_NOT_FOUND',
  409: 'students.errors.conflict',
  422: 'students.errors.invalid',
};

export function RegisterStudentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const programs = useListPrograms();
  const register = useRegisterStudent();
  const [error, setError] = useState<string | null>(null);
  const items = programs.data?.status === 200 ? programs.data.data.items : [];

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === 'string' ? value : '';
    };
    setError(null);
    try {
      const response = await register.mutateAsync({
        data: {
          username: field('username'),
          password: field('password'),
          displayName: field('displayName'),
          timeZone: field('timeZone'),
          programId: field('programId'),
        },
      });
      if (response.status === 201) {
        await queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        await queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
        await navigate(`/admin/students/${response.data.id}`);
      } else {
        setError(ERROR_KEYS[response.status] ?? 'programs.errors.server');
      }
    } catch {
      setError('programs.errors.network');
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{t('students.new')}</h2>
      <form className="flex max-w-sm flex-col gap-4" onSubmit={(event) => void submit(event)}>
        <label className="flex flex-col gap-1 text-sm">
          {t('students.username')}
          <Input name="username" autoComplete="off" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('students.password')}
          <Input name="password" type="password" autoComplete="new-password" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('students.displayName')}
          <Input name="displayName" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('students.timeZone')}
          <Input
            name="timeZone"
            list="time-zones"
            defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
            required
          />
          <datalist id="time-zones">
            {Intl.supportedValuesOf('timeZone').map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('students.program')}
          {/* Keyed so the preselection applies once the programs have loaded. */}
          <select
            key={items.length}
            name="programId"
            className="h-9 rounded-md border px-2"
            defaultValue={params.get('programId') ?? ''}
            required
          >
            <option value="" />
            {items.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {t(error)}
          </p>
        ) : null}
        <Button type="submit" disabled={register.isPending}>
          {t('students.create')}
        </Button>
      </form>
    </section>
  );
}
