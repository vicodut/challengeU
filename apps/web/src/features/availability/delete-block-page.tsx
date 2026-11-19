import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { getListBlocksQueryKey, useDeleteBlock } from '@/api/generated/endpoints/booking/booking';
import { Button } from '@/shared/ui/button';

const ERROR_CODES = ['BLOCK_HAS_BOOKINGS', 'BLOCK_NOT_FOUND'] as const;

/** Confirmation panel (not window.confirm: dialogs block automation). */
export function DeleteBlockPage() {
  const { t } = useTranslation();
  const { blockId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const remove = useDeleteBlock();
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function confirm() {
    try {
      const response = await remove.mutateAsync({ id: blockId });
      if (response.status === 200) {
        await queryClient.invalidateQueries({ queryKey: getListBlocksQueryKey() });
        void navigate('/coach/availability');
        return;
      }
      const known = ERROR_CODES.find((code) => code === response.data.code);
      setErrorKey(`availability.delete.errors.${known ?? 'server'}`);
    } catch {
      setErrorKey('availability.delete.errors.server');
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{t('availability.delete.title')}</h2>
      <p>{t('availability.delete.question')}</p>
      {errorKey ? (
        <p role="alert" className="text-destructive text-sm">
          {t(errorKey)}
        </p>
      ) : null}
      <div className="flex items-center gap-4">
        <Button disabled={remove.isPending} onClick={() => void confirm()}>
          {t('availability.delete.confirm')}
        </Button>
        <Link to=".." relative="path" className="text-sm underline">
          {t('availability.delete.cancel')}
        </Link>
      </div>
    </section>
  );
}
