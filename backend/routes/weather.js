const express = require("express");

const { createCache } = require("../lib/cache");
const { readConfigOrFail } = require("../lib/routeHelpers");

const router = express.Router();

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = createCache(CACHE_TTL_MS);

const WEATHER_CODE_CONDITIONS = {
  0: { code: "clear", label: "Selkeää" },
  1: { code: "clear", label: "Pääosin selkeää" },
  2: { code: "partly-cloudy", label: "Puolipilvistä" },
  3: { code: "cloudy", label: "Pilvistä" },
  45: { code: "fog", label: "Sumua" },
  48: { code: "fog", label: "Huurteinen sumu" },
  51: { code: "drizzle", label: "Tihkusadetta" },
  53: { code: "drizzle", label: "Kohtalaista tihkua" },
  55: { code: "drizzle", label: "Runsasta tihkua" },
  61: { code: "rain", label: "Heikkoa sadetta" },
  63: { code: "rain", label: "Kohtalaista sadetta" },
  65: { code: "rain", label: "Runsasta sadetta" },
  71: { code: "snow", label: "Heikkoa lumisadetta" },
  73: { code: "snow", label: "Kohtalaista lumisadetta" },
  75: { code: "snow", label: "Runsasta lumisadetta" },
  80: { code: "rain", label: "Sadekuuroja" },
  81: { code: "rain", label: "Kohtalaisia kuuroja" },
  82: { code: "rain", label: "Rankkakuuroja" },
  95: { code: "thunderstorm", label: "Ukkosmyrsky" },
  96: { code: "thunderstorm", label: "Ukkosmyrsky, raekuuroja" },
  99: { code: "thunderstorm", label: "Voimakas ukkosmyrsky" },
};

function conditionFromCode(code) {
  return WEATHER_CODE_CONDITIONS[code] || { code: "unknown", label: "Tuntematon" };
}

async function fetchForecast(lat, lon) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set(
    "current",
    "temperature_2m,precipitation,weather_code,wind_speed_10m",
  );
  url.searchParams.set("hourly", "uv_index,precipitation_probability");
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
  const precipProbabilityValues =
    (raw.hourly && raw.hourly.precipitation_probability) || [];

  const nowIndex = times.indexOf(current.time);
  const uvIndexNow = nowIndex >= 0 ? uvValues[nowIndex] : null;
  const precipProbabilityNow =
    nowIndex >= 0 ? precipProbabilityValues[nowIndex] : null;

  const today = (current.time || "").slice(0, 10);
  const todayIndexes = times
    .map((time, i) => (time.slice(0, 10) === today ? i : null))
    .filter((i) => i !== null);
  const todayUvValues = todayIndexes
    .map((i) => uvValues[i])
    .filter((value) => value !== null && value !== undefined);
  const uvIndexMaxToday = todayUvValues.length
    ? Math.max(...todayUvValues)
    : null;
  const todayPrecipProbabilityValues = todayIndexes
    .map((i) => precipProbabilityValues[i])
    .filter((value) => value !== null && value !== undefined);
  const precipProbabilityMaxToday = todayPrecipProbabilityValues.length
    ? Math.max(...todayPrecipProbabilityValues)
    : null;

  const condition = conditionFromCode(current.weather_code);

  return {
    current: {
      tempC: current.temperature_2m ?? null,
      condition: condition.label,
      conditionCode: condition.code,
      windKph: current.wind_speed_10m ?? null,
      precipMm: current.precipitation ?? null,
    },
    uvIndexNow,
    uvIndexMaxToday,
    precipProbabilityNow,
    precipProbabilityMaxToday,
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
