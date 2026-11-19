import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useListBlocks } from '@/api/generated/endpoints/booking/booking';
import { formatInZone } from '@/shared/lib/zoned-time';
import { Button } from '@/shared/ui/button';

/** The coach's upcoming blocks, one page at a time, in the coach's zone. */
export function BlocksPage({ timeZone }: { timeZone: string }) {
  const { t } = useTranslation();
  // Cursors of the pages already visited; the last one is the page on screen.
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const cursor = cursors[cursors.length - 1];
  const { data, isPending, isError } = useListBlocks({ limit: 10, cursor });
  const page = data?.status === 200 ? data.data : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t('nav.availability')}</h2>
        <Link to="new" className="text-sm underline">
          {t('availability.list.new')}
        </Link>
      </div>
      {isPending ? (
        <p>{t('availability.list.loading')}</p>
      ) : isError || !page ? (
        <p role="alert">{t('availability.list.loadError')}</p>
      ) : page.items.length === 0 ? (
        <p>{t('availability.list.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {page.items.map((block) => (
            <li key={block.id} className="rounded-md border p-3">
              <Link to={block.id} className="underline">
                {formatInZone(block.startsAt, timeZone)}
              </Link>
              {' · '}
              {t('availability.new.minutes', { count: block.durationMinutes })}
              {' · '}
              {t('availability.list.booked', { count: block.bookedSessionCount })}
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Button
          disabled={cursors.length === 1}
          onClick={() => {
            setCursors((all) => all.slice(0, -1));
          }}
        >
          {t('availability.list.previous')}
        </Button>
        <Button
          disabled={!page?.nextCursor}
          onClick={() => {
            if (page?.nextCursor) setCursors((all) => [...all, page.nextCursor ?? undefined]);
          }}
        >
          {t('availability.list.next')}
        </Button>
      </div>
    </section>
  );
}
