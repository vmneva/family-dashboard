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
