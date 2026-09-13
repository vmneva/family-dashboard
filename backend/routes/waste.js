const express = require("express");

const { readConfigOrFail } = require("../lib/routeHelpers");
const { toHelsinkiDateString } = require("../lib/time");
const { DEFAULT_WASTE_INTERVAL_WEEKS } = require("../lib/wasteIntervals");

const router = express.Router();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(today, date) {
  return Math.round((new Date(`${date}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / MS_PER_DAY);
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The user enters the last actual emptying date per type; the next one is
// projected forward using the type's emptying interval (tyhjennysväli),
// repeating until it lands on or after today.
function nextCollection(entry, today, intervalWeeks) {
  if (!entry.lastEmptied || !intervalWeeks) return null;

  const intervalDays = intervalWeeks * 7;
  let date = addDays(entry.lastEmptied, intervalDays);
  while (date < today) {
    date = addDays(date, intervalDays);
  }
  return { type: entry.type, date, daysUntil: daysUntil(today, date) };
}

router.get("/", (_req, res) => {
  const config = readConfigOrFail(res);
  if (!config) return;

  const waste = Array.isArray(config.waste) ? config.waste : [];
  const intervals = {
    ...DEFAULT_WASTE_INTERVAL_WEEKS,
    ...(config.wasteIntervals || {}),
  };
  const today = toHelsinkiDateString();

  const collections = waste
    .map((entry) => nextCollection(entry, today, intervals[entry.type]))
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  res.json({ collections });
});

module.exports = router;
