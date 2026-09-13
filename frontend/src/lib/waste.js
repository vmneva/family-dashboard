const WASTE_TYPE_LABELS = {
  biowaste: 'Biojäte',
  mixed: 'Sekajäte',
  cardboard: 'Kartonki',
  plastic: 'Muovi',
  glass: 'Lasi',
  metal: 'Metalli',
}

export function wasteTypeLabel(type) {
  return WASTE_TYPE_LABELS[type] ?? type
}

// { value, label } options for the settings waste-type dropdown, derived
// from the same map so labels never drift out of sync.
export const WASTE_TYPES = Object.entries(WASTE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))
