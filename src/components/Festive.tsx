import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { PROMO_BANNER_TEXT } from '@/config/theme';

const DISMISS_KEY = 'promo-banner-dismissed';
const readDismissed = () => {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
};

/** Top promo banner (hidden on admin routes). Mount once, inside the router. */
export function FestiveTheme() {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed || pathname.startsWith('/admin')) return null;
  return (
    <div className="relative flex items-center justify-center gap-2 bg-primary px-3 py-2 text-xs text-primary-foreground sm:gap-3 sm:px-4 sm:text-sm">
      <p className="text-center font-medium">{PROMO_BANNER_TEXT}</p>
      <Link to="/services/ac/gurgaon" className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:opacity-90">
        Book a service
      </Link>
      <button
        type="button"
        aria-label="Dismiss message"
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
