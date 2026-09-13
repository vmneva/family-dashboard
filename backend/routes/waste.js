const express = require("express");

const { readConfigOrFail } = require("../lib/routeHelpers");
const { toHelsinkiDateString } = require("../lib/time");

const router = express.Router();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(today, date) {
  return Math.round((new Date(`${date}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / MS_PER_DAY);
}

function nextCollection(entry, today) {
  const upcoming = (entry.dates || [])
    .filter((date) => date >= today)
    .sort();

  if (!upcoming.length) return null;

  const date = upcoming[0];
  return { type: entry.type, date, daysUntil: daysUntil(today, date) };
}

router.get("/", (_req, res) => {
  const config = readConfigOrFail(res);
  if (!config) return;

  const waste = Array.isArray(config.waste) ? config.waste : [];
  const today = toHelsinkiDateString();

  const collections = waste
    .map((entry) => nextCollection(entry, today))
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  res.json({ collections });
});

module.exports = router;
