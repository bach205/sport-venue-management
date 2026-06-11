import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { TotalViewCounter } from '@/shared/components/TotalViewCounter';
import React from 'react';
import { Link } from 'react-router';

interface AuthLayoutProps {
  children: React.ReactNode;
  imageUrl: string;
  imageAlt?: string;
  quote?: string;
  quoteAuthor?: string;
}

export function MatchillLogo() {
  return (
    <Link to="/home" className="mb-6 flex flex-col items-center gap-1">
      <img src="/logo.png" alt="Matchill Logo" className="h-16 w-16 object-contain" />
    </Link>
  );
}

export function AuthLayout({ children, imageUrl, quote, quoteAuthor }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-auth-bg relative">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <TotalViewCounter />
        <LanguageSwitcher className="rounded-xl bg-white/90 px-2 py-1 shadow" />
      </div>
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ffb693 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />

      <div className="relative w-full max-w-4xl">
        <div className="flex rounded-2xl overflow-hidden shadow-2xl" style={{ boxShadow: '0 8px 40px rgba(36,25,20,0.15)' }}>
          <div className="flex-1 bg-white p-8 md:p-10 flex flex-col justify-center min-w-0">
            {children}
          </div>

          <div className="hidden md:flex w-72 lg:w-80 relative flex-col overflow-hidden rounded-r-2xl">
            <ImageWithFallback src={imageUrl} alt="Sport" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }} />
            {quote && (
              <div className="absolute bottom-6 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <p className="text-brand-dark text-[13px] font-medium mb-2">"{quote}"</p>
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#ff7e36" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                  <span className="text-brand-body text-[11px] ml-1">{quoteAuthor || 'Trusted by 10k+ players'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
