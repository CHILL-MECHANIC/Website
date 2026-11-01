import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { FESTIVE_BANNER_TEXT, FESTIVE_THEME, isFestiveActive } from '@/config/theme';

const DISMISS_KEY = `festive-banner-dismissed:${FESTIVE_THEME.name}`;
const readDismissed = () => {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
};

/** True when the theme is on and we're not on an admin route. */
export const useFestive = () => {
  const { pathname } = useLocation();
  return isFestiveActive() && !pathname.startsWith('/admin');
};

/** Toggles the body class and renders the top banner. Mount once, inside the router. */
export function FestiveTheme() {
  const active = useFestive();
  const [dismissed, setDismissed] = useState(readDismissed);

  // Also removes the class that a prerendered page may carry after the season ends.
  useEffect(() => {
    document.body.classList.toggle('theme-diwali', active);
    return () => document.body.classList.remove('theme-diwali');
  }, [active]);

  if (!active || dismissed) return null;
  return (
    <div className="festive-banner festive-banner-top relative flex items-center justify-center gap-3 px-4 py-2 text-sm">
      <MiniDiya className="hidden h-6 w-6 shrink-0 sm:block" />
      <p className="text-center font-medium">{FESTIVE_BANNER_TEXT}</p>
      <Link to="/services/ac/gurgaon" className="festive-banner-cta hidden shrink-0 rounded-full px-3 py-1 text-xs font-semibold sm:inline-block">
        Book a service
      </Link>
      <button
        type="button"
        aria-label="Dismiss festive message"
        className="shrink-0 rounded p-1 hover:bg-white/15"
        onClick={() => {
          try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
          setDismissed(true);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const MiniDiya = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 64 56" className={className}>
    <path d="M32 2c6 7 8 12 4 18-1 2-3 3-4 3s-3-1-4-3c-4-6-2-11 4-18z" fill="hsl(var(--fest-saffron))" />
    <path d="M6 28h52c0 12-10 22-26 22S6 40 6 28z" fill="hsl(var(--fest-gold))" />
  </svg>
);

const PETAL = 'M0 -34 C 7 -26 7 -14 0 -6 C -7 -14 -7 -26 0 -34 Z';

/** Rangoli-style mandala and a glowing diya for the hero corners. Decorative only. */
export function DiyaAccent() {
  if (!useFestive()) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <div className="festive-hero-glow absolute inset-0" />
      <svg viewBox="-100 -100 200 200" className="festive-mandala absolute -bottom-20 -right-20 h-64 w-64 opacity-80 md:-bottom-28 md:-right-24 md:h-[26rem] md:w-[26rem]">
        <g fill="none" stroke="hsl(var(--fest-gold))" strokeWidth="1.2">
          <circle r="96" strokeDasharray="2 5" />
          <circle r="40" />
        </g>
        {Array.from({ length: 16 }, (_, i) => (
          <path key={`o${i}`} d={PETAL} transform={`rotate(${i * 22.5}) translate(0 -46) scale(1.15)`} fill="hsl(var(--fest-saffron))" fillOpacity="0.85" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={`i${i}`} d={PETAL} transform={`rotate(${i * 30 + 15}) translate(0 -2) scale(0.9)`} fill="hsl(var(--fest-gold))" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={`d${i}`} r="3" cx={Math.cos((i * Math.PI) / 4) * 84} cy={Math.sin((i * Math.PI) / 4) * 84} fill="hsl(var(--fest-maroon))" stroke="hsl(var(--fest-gold))" />
        ))}
        <circle r="9" fill="hsl(var(--fest-maroon))" stroke="hsl(var(--fest-gold))" strokeWidth="2" />
      </svg>
      <svg viewBox="0 0 64 56" className="absolute bottom-4 left-4 h-14 w-16 md:bottom-8 md:left-12 md:h-20 md:w-24">
        <ellipse className="festive-flame-glow" cx="32" cy="14" rx="22" ry="20" fill="hsl(var(--fest-gold))" opacity="0.35" />
        <g className="festive-flame">
          <path d="M32 2c6 7 8 12 4 18-1 2-3 3-4 3s-3-1-4-3c-4-6-2-11 4-18z" fill="hsl(var(--fest-saffron))" />
          <path d="M32 9c3 4 4 7 2 10-.6 1-1.4 1.5-2 1.5s-1.4-.5-2-1.5c-2-3-1-6 2-10z" fill="hsl(var(--fest-gold))" />
        </g>
        <path d="M6 30h52c0 12-10 22-26 22S6 42 6 30z" fill="hsl(var(--fest-maroon))" stroke="hsl(var(--fest-gold))" strokeWidth="2" />
        <path d="M14 36h36" stroke="hsl(var(--fest-gold))" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Marigold garland (toran) strip. Fixed height so it never shifts the layout. */
export function SparkleDivider() {
  if (!useFestive()) return null;
  return (
    <div aria-hidden="true" className="festive-divider h-8 w-full overflow-hidden">
      <svg width="100%" height="32" className="block">
        <defs>
          <pattern id="fest-garland" width="48" height="32" patternUnits="userSpaceOnUse">
            <path d="M0 4 Q 24 18 48 4" fill="none" stroke="hsl(var(--fest-maroon))" strokeWidth="1.2" />
            <path d="M24 13 C 18 18 18 24 24 29 C 30 24 30 18 24 13 Z" fill="hsl(var(--fest-saffron))" />
            <circle className="festive-bulb" cx="24" cy="21" r="3" fill="hsl(var(--fest-gold))" />
            <circle cx="0" cy="4" r="3" fill="hsl(var(--fest-gold))" />
            <circle cx="48" cy="4" r="3" fill="hsl(var(--fest-gold))" />
          </pattern>
        </defs>
        <rect width="100%" height="32" fill="url(#fest-garland)" />
      </svg>
    </div>
  );
}

/** Festive footer strip. */
export function FestiveFooterStrip() {
  if (!useFestive()) return null;
  return (
    <div className="festive-banner festive-footer">
      <SparkleDivider />
      <p className="px-4 pb-3 pt-1 text-center text-sm font-medium">Shubh Deepawali. Wishing you a bright and happy home.</p>
    </div>
  );
}
