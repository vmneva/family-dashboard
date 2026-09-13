// Default emptying intervals (tyhjennysväli, in weeks) per waste type for a
// typical detached house without special arrangements, per
// https://kiertokapula.fi/kiinteiston-jatehuolto/jateastioiden-tyhjennysvalit/
// Users can override any of these per-family via PUT /api/config (config.wasteIntervals).
const DEFAULT_WASTE_INTERVAL_WEEKS = {
  biowaste: 2,
  mixed: 4,
  cardboard: 16,
  plastic: 16,
  glass: 26,
  metal: 26,
};

module.exports = { DEFAULT_WASTE_INTERVAL_WEEKS };
