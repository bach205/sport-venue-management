import { useState } from 'react';
import { Zap } from 'lucide-react';
import { MatchingModal } from './MatchingModal';
import { useTranslation } from 'react-i18next';

export function MatchingFAB() {
  const { t } = useTranslation('matching');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
        <span className="hidden xl:inline">{t('fab.label')}</span>
      </button>

      {open && <MatchingModal onClose={() => setOpen(false)} />}
    </>
  );
}
