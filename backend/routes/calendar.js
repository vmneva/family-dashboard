const express = require("express");
const ical = require("node-ical");

const { readConfig } = require("../lib/configStore");
const { toHelsinkiIsoString } = require("../lib/time");

const router = express.Router();

const CACHE_TTL_MS = 7 * 60 * 1000;
const WINDOW_DAYS_AHEAD = 7;
const cache = new Map();

function getWindow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + WINDOW_DAYS_AHEAD);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function fetchOwnerEvents(url, owner, window) {
  const data = await ical.async.fromURL(url);
  const events = [];

  for (const component of Object.values(data)) {
    if (component.type !== "VEVENT") continue;

    const instances = ical.expandRecurringEvent(component, {
      from: window.start,
      to: window.end,
    });

    for (const instance of instances) {
      events.push({
        title: instance.summary || "(untitled)",
        start: toHelsinkiIsoString(instance.start.getTime()),
        end: toHelsinkiIsoString(instance.end.getTime()),
        allDay: Boolean(instance.isFullDay),
        owner,
      });
    }
  }

  return events;
}

router.get("/", async (_req, res) => {
  let config;
  try {
    config = readConfig();
  } catch (err) {
    return res
      .status(500)
      .json({ error: "failed to read config", details: err.message });
  }

  const owners = Object.entries(config.calendars || {}).filter(
    ([, url]) => url,
  );
  if (!owners.length) {
    return res.json({ events: [] });
  }

  const cacheKey = owners.map(([owner, url]) => `${owner}:${url}`).join("|");
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

  const window = getWindow();
  const results = await Promise.allSettled(
    owners.map(([owner, url]) => fetchOwnerEvents(url, owner, window)),
  );

  const events = [];
  const errors = [];
  results.forEach((result, i) => {
    const [owner] = owners[i];
    if (result.status === "fulfilled") {
      events.push(...result.value);
    } else {
      console.warn(
        `Failed to fetch/parse calendar for "${owner}": ${result.reason.message}`,
      );
      errors.push({ owner, message: result.reason.message });
    }
  });

  events.sort((a, b) => new Date(a.start) - new Date(b.start));

  const shaped = errors.length ? { events, errors } : { events };
  cache.set(cacheKey, { data: shaped, expiresAt: Date.now() + CACHE_TTL_MS });
  res.json(shaped);
});

module.exports = router;
