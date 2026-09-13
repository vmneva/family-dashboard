const express = require("express");

const { createCache } = require("../lib/cache");
const { readConfigOrFail } = require("../lib/routeHelpers");

const router = express.Router();

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = createCache(CACHE_TTL_MS);

const WEATHER_CODE_CONDITIONS = {
  0: ("clear", "Selkeää"),
  1: ("mainly_clear", "Pääosin selkeää"),
  2: ("partly_cloudy", "Puolipilvistä"),
  3: ("overcast", "Pilvistä"),
  45: ("fog", "Sumua"),
  48: ("fog", "Huurteinen sumu"),
  51: ("drizzle", "Tihkusadetta"),
  53: ("drizzle", "Kohtalaista tihkua"),
  55: ("drizzle", "Runsasta tihkua"),
  61: ("rain", "Heikkoa sadetta"),
  63: ("rain", "Kohtalaista sadetta"),
  65: ("rain", "Runsasta sadetta"),
  71: ("snow", "Heikkoa lumisadetta"),
  73: ("snow", "Kohtalaista lumisadetta"),
  75: ("snow", "Runsasta lumisadetta"),
  80: ("rain", "Sadekuuroja"),
  81: ("rain", "Kohtalaisia kuuroja"),
  82: ("rain", "Rankkakuuroja"),
  95: ("thunderstorm", "Ukkosmyrsky"),
  96: ("thunderstorm", "Ukkosmyrsky, raekuuroja"),
  99: ("thunderstorm", "Voimakas ukkosmyrsky"),
};

function conditionFromCode(code) {
  return WEATHER_CODE_CONDITIONS[code] || "Unknown";
}

async function fetchForecast(lat, lon) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set("hourly", "uv_index");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`);
  }
  return response.json();
}

function shapeForecast(raw) {
  const current = raw.current || {};
  const times = (raw.hourly && raw.hourly.time) || [];
  const uvValues = (raw.hourly && raw.hourly.uv_index) || [];

  const nowIndex = times.indexOf(current.time);
  const uvIndexNow = nowIndex >= 0 ? uvValues[nowIndex] : null;

  const today = (current.time || "").slice(0, 10);
  const todayUvValues = times
    .map((time, i) => (time.slice(0, 10) === today ? uvValues[i] : null))
    .filter((value) => value !== null);
  const uvIndexMaxToday = todayUvValues.length
    ? Math.max(...todayUvValues)
    : null;

  return {
    current: {
      tempC: current.temperature_2m ?? null,
      condition: conditionFromCode(current.weather_code),
      windKph: current.wind_speed_10m ?? null,
    },
    uvIndexNow,
    uvIndexMaxToday,
  };
}

router.get("/", async (_req, res) => {
  const config = readConfigOrFail(res);
  if (!config) return;

  const { lat, lon } = config.location || {};
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res
      .status(400)
      .json({ error: "config.location.lat and lon must be numbers" });
  }

  const cacheKey = `${lat},${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const raw = await fetchForecast(lat, lon);
    const shaped = shapeForecast(raw);
    cache.set(cacheKey, shaped);
    res.json(shaped);
  } catch (err) {
    res
      .status(502)
      .json({ error: "failed to fetch weather", details: err.message });
  }
});

module.exports = router;
