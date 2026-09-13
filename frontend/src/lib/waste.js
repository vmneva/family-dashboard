const WASTE_TYPE_LABELS = {
  biowaste: 'Biojäte',
  mixed: 'Sekajäte',
  cardboard: 'Kartonki',
  plastic: 'Muovi',
  glass: 'Lasi',
  metal: 'Metalli',
}

const WASTE_TYPE_COLORS = {
  biowaste: 'var(--waste-biowaste)',
  mixed: 'var(--waste-mixed)',
  cardboard: 'var(--waste-cardboard)',
  plastic: 'var(--waste-plastic)',
  glass: 'var(--waste-glass)',
  metal: 'var(--waste-metal)',
}

// Default emptying intervals (tyhjennysväli, in weeks) for a typical detached
// house, per https://kiertokapula.fi/kiinteiston-jatehuolto/jateastioiden-tyhjennysvalit/
// Mirrors backend/lib/wasteIntervals.js — kept in sync manually since the
// frontend and backend are separate npm projects. Users can override per
// type from settings (config.wasteIntervals).
export const DEFAULT_WASTE_INTERVAL_WEEKS = {
  biowaste: 2,
  mixed: 4,
  cardboard: 16,
  plastic: 16,
  glass: 26,
  metal: 26,
}

export function wasteTypeLabel(type) {
  return WASTE_TYPE_LABELS[type] ?? type
}

export function wasteTypeColor(type) {
  return WASTE_TYPE_COLORS[type] ?? 'var(--border)'
}

// Highlights how soon a collection is coming up: today/tomorrow is urgent,
// within a few days is a heads-up, further out fades into the default text color.
export function wasteUrgencyColor(daysUntil) {
  if (daysUntil <= 1) return 'var(--uv-very-high)'
  if (daysUntil <= 3) return 'var(--uv-moderate)'
  return 'var(--text-h)'
}

// { value, label } options for the settings waste-type dropdown, derived
// from the same map so labels never drift out of sync.
export const WASTE_TYPES = Object.entries(WASTE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))
