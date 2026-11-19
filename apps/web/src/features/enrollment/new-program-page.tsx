import { useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  getListProgramsQueryKey,
  useCreateProgram,
} from '@/api/generated/endpoints/enrollment/enrollment';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const ERROR_KEYS: Record<number, string> = {
  409: 'programs.errors.nameTaken',
  422: 'programs.errors.invalidName',
};

export function NewProgramPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createProgram = useCreateProgram();
  const [error, setError] = useState<string | null>(null);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('name');
    setError(null);
    try {
      const response = await createProgram.mutateAsync({
        data: { name: typeof name === 'string' ? name : '' },
      });
      if (response.status === 201) {
        await queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
        await navigate('/admin/programs');
      } else {
        setError(ERROR_KEYS[response.status] ?? 'programs.errors.server');
      }
    } catch {
      setError('programs.errors.network');
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{t('programs.new')}</h2>
      <form className="flex max-w-sm flex-col gap-4" onSubmit={(event) => void submit(event)}>
        <label className="flex flex-col gap-1 text-sm">
          {t('programs.name')}
          <Input name="name" maxLength={100} required />
        </label>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {t(error)}
          </p>
        ) : null}
        <Button type="submit" disabled={createProgram.isPending}>
          {t('programs.create')}
        </Button>
      </form>
    </section>
  );
}
