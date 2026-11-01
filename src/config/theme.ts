// One switch for the seasonal look. Set enabled to false, or let endsOn pass, and the site is back to normal.
export const FESTIVE_THEME = { enabled: true, name: 'diwali', endsOn: '2026-11-20' };

// Editable banner line. No discount claims here unless the offer is real.
export const FESTIVE_BANNER_TEXT = 'Happy Diwali from Chill Mechanic. Book your AC and appliance service before the festival rush.';

export const isFestiveActive = (now: Date = new Date()) =>
  FESTIVE_THEME.enabled && now < new Date(`${FESTIVE_THEME.endsOn}T00:00:00+05:30`);
