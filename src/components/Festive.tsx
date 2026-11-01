import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
    <div className="festive-banner flex items-center justify-center gap-3 px-4 py-2 text-center text-sm">
      <p>{FESTIVE_BANNER_TEXT}</p>
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

/** Small diya for the hero corner. Decorative only. */
export function DiyaAccent() {
  if (!useFestive()) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 56"
      className="pointer-events-none absolute bottom-3 right-3 z-10 h-14 w-16 opacity-90 md:bottom-6 md:right-10 md:h-20 md:w-24"
    >
      <g className="festive-flame">
        <path d="M32 4c6 7 8 12 4 18-1 2-3 3-4 3s-3-1-4-3c-4-6-2-11 4-18z" fill="hsl(var(--fest-saffron))" />
        <path d="M32 11c3 4 4 7 2 10-.6 1-1.4 1.5-2 1.5s-1.4-.5-2-1.5c-2-3-1-6 2-10z" fill="hsl(var(--fest-gold))" />
      </g>
      <path d="M6 30h52c0 12-10 22-26 22S6 42 6 30z" fill="hsl(var(--fest-maroon))" stroke="hsl(var(--fest-gold))" strokeWidth="2" />
      <path d="M14 36h36" stroke="hsl(var(--fest-gold))" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Thin string-lights strip. Fixed height so it never shifts the layout. */
export function SparkleDivider() {
  if (!useFestive()) return null;
  const colors = ['--fest-gold', '--fest-saffron', '--fest-maroon'];
  return (
    <div aria-hidden="true" className="festive-divider h-6 w-full overflow-hidden">
      <svg viewBox="0 0 400 24" preserveAspectRatio="none" className="h-6 w-full">
        <path d="M0 4 Q 25 14 50 4 T 100 4 T 150 4 T 200 4 T 250 4 T 300 4 T 350 4 T 400 4" fill="none" stroke="hsl(var(--fest-maroon))" strokeWidth="1" />
        {Array.from({ length: 16 }, (_, i) => (
          <circle
            key={i}
            className="festive-bulb"
            style={{ animationDelay: `${(i % 4) * 0.4}s` }}
            cx={12.5 + i * 25}
            cy={i % 2 ? 6 : 12}
            r="3"
            fill={`hsl(var(${colors[i % 3]}))`}
          />
        ))}
      </svg>
    </div>
  );
}

/** Festive footer strip. */
export function FestiveFooterStrip() {
  if (!useFestive()) return null;
  return (
    <div className="festive-banner px-4 py-2 text-center text-sm">
      Shubh Deepawali. Wishing you a bright and happy home.
    </div>
  );
}
