import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { useGetBlock } from '@/api/generated/endpoints/booking/booking';
import { formatInZone } from '@/shared/lib/zoned-time';

export function BlockPage({ timeZone }: { timeZone: string }) {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const { data, isPending, isError } = useGetBlock(id);
  const block = data?.status === 200 ? data.data : null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{t('availability.detail.title')}</h2>
      {isPending ? (
        <p>{t('availability.list.loading')}</p>
      ) : isError || !block ? (
        <p role="alert">{t('availability.detail.notFound')}</p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt>{t('availability.detail.start', { timeZone })}</dt>
          <dd>{formatInZone(block.startsAt, timeZone)}</dd>
          <dt>{t('availability.new.duration')}</dt>
          <dd>{t('availability.new.minutes', { count: block.durationMinutes })}</dd>
          <dt>{t('availability.detail.booked')}</dt>
          <dd>{block.bookedSessionCount}</dd>
        </dl>
      )}
      {block ? (
        <Link to="delete" className="text-sm underline">
          {t('availability.detail.delete')}
        </Link>
      ) : null}
      <Link to=".." relative="path" className="text-sm underline">
        {t('availability.detail.back')}
      </Link>
    </section>
  );
}
