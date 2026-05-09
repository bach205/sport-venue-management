import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { MatchingModal } from './MatchingModal';

export function MatchingFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-2.5 h-14 px-5 rounded-full transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(90deg, #a04100 0%, #ff7e36 100%)',
          boxShadow: '0 6px 24px rgba(160,65,0,0.45)',
          fontFamily: 'Lexend, sans-serif',
          fontSize: '15px',
          fontWeight: 700,
          color: '#fff',
          border: 'none',
        }}
        title="Find a Match Now"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.25)' }}
        >
          <Zap size={15} fill="#fff" color="#fff" />
        </div>
        <span>Find Match</span>

        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(255,126,54,0.4)',
            animation: 'fabPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      </button>

      {open && <MatchingModal onClose={() => setOpen(false)} />}

      <style>{`
        @keyframes fabPing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </>
  );
}
