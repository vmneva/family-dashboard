const express = require("express");
const ical = require("node-ical");

const { createCache } = require("../lib/cache");
const { readConfigOrFail } = require("../lib/routeHelpers");
const { toHelsinkiIsoString } = require("../lib/time");
const { calendarColorForIndex } = require("../lib/calendarColors");

const router = express.Router();

const CACHE_TTL_MS = 7 * 60 * 1000;
const WINDOW_DAYS_AHEAD = 7;
const cache = createCache(CACHE_TTL_MS);

function getWindow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + WINDOW_DAYS_AHEAD);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function initialFor(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

async function fetchCalendarEvents(calendar, window) {
  const data = await ical.async.fromURL(calendar.url);
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
        calendarId: calendar.id,
        calendarName: calendar.name,
        color: calendar.color,
        initial: initialFor(calendar.name),
      });
    }
  }

  return events;
}

router.get("/", async (_req, res) => {
  const config = readConfigOrFail(res);
  if (!config) return;

  const calendars = (config.calendars || [])
    .map((calendar, index) => ({
      ...calendar,
      color: calendarColorForIndex(index),
    }))
    .filter((calendar) => calendar.url);

  if (!calendars.length) {
    return res.json({ events: [] });
  }

  const cacheKey = calendars.map((c) => `${c.id}:${c.url}`).join("|");
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const window = getWindow();
  const results = await Promise.allSettled(
    calendars.map((calendar) => fetchCalendarEvents(calendar, window)),
  );

  const events = [];
  const errors = [];
  results.forEach((result, i) => {
    const calendar = calendars[i];
    if (result.status === "fulfilled") {
      events.push(...result.value);
    } else {
      console.warn(
        `Failed to fetch/parse calendar "${calendar.name}": ${result.reason.message}`,
      );
      errors.push({
        calendarId: calendar.id,
        calendarName: calendar.name,
        message: result.reason.message,
      });
    }
  });

  events.sort((a, b) => new Date(a.start) - new Date(b.start));

  const shaped = errors.length ? { events, errors } : { events };
  cache.set(cacheKey, shaped);
  res.json(shaped);
});

module.exports = router;
