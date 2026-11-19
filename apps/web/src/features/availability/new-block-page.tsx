import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { usePublishBlock } from '@/api/generated/endpoints/booking/booking';
import { zonedToUtc } from '@/shared/lib/zoned-time';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const ERROR_CODES = [
  'INVALID_BLOCK_DURATION',
  'BLOCK_NOT_ALIGNED',
  'BLOCK_IN_PAST',
  'BLOCK_OVERLAP',
] as const;

function formString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

/** The coach picks a start in their own zone; it is sent as a UTC instant. */
export function NewBlockPage({ timeZone }: { timeZone: string }) {
  const { t } = useTranslation();
  const publish = usePublishBlock();
  const [message, setMessage] = useState<{ key: string; ok: boolean } | null>(null);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startsAt = zonedToUtc(formString(form.get('startsAt')), timeZone);
    if (!startsAt) {
      setMessage({ key: 'availability.new.errors.localTime', ok: false });
      return;
    }
    try {
      const response = await publish.mutateAsync({
        data: {
          startsAt: startsAt.toISOString(),
          durationMinutes: Number(formString(form.get('durationMinutes'))) as 30 | 60,
        },
      });
      if (response.status === 201) {
        setMessage({ key: 'availability.new.published', ok: true });
        return;
      }
      const known = ERROR_CODES.find((code) => code === response.data.code);
      setMessage({ key: `availability.new.errors.${known ?? 'server'}`, ok: false });
    } catch {
      setMessage({ key: 'availability.new.errors.network', ok: false });
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
      <h2 className="text-2xl font-semibold">{t('availability.new.title')}</h2>
      <label className="flex flex-col gap-1 text-sm">
        {t('availability.new.startsAt', { timeZone })}
        <Input name="startsAt" type="datetime-local" step={1800} required />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('availability.new.duration')}
        <select
          name="durationMinutes"
          defaultValue="60"
          className="border-border h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="30">{t('availability.new.minutes', { count: 30 })}</option>
          <option value="60">{t('availability.new.minutes', { count: 60 })}</option>
        </select>
      </label>
      {message ? (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={message.ok ? 'text-sm' : 'text-destructive text-sm'}
        >
          {t(message.key)}
        </p>
      ) : null}
      <Button type="submit" disabled={publish.isPending}>
        {t('availability.new.submit')}
      </Button>
    </form>
  );
}
