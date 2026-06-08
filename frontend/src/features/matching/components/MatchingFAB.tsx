import { useState } from 'react';
import { Zap } from 'lucide-react';
import { MatchingModal } from './MatchingModal';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';

export function MatchingFAB({
  onClose,
  showLabel = false,
}: {
  onClose?: () => void;
  showLabel?: boolean;
}) {
  const { t } = useTranslation('matching');
  const { requireAuth } = useAuthGuard();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!requireAuth()) {
            onClose?.();
            return;
          }
          setOpen(true);
        }}
        className="flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 transition-opacity hover:opacity-90 lg:px-3"
        style={{
          background: 'linear-gradient(90deg, #a04100 0%, #ff7e36 100%)',
          boxShadow: '0 2px 8px rgba(160,65,0,0.24)',
          fontFamily: 'Lexend, sans-serif',
          fontSize: '13px',
          fontWeight: 700,
          color: '#fff',
          border: 'none',
        }}
        title={t('fab.title')}
      >
        <Zap size={15} fill="#fff" color="#fff" />
        <span className={showLabel ? 'inline' : 'hidden xl:inline'}>{t('fab.label')}</span>
      </button>

      {open && (
        <MatchingModal
          onClose={() => {
            setOpen(false);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
