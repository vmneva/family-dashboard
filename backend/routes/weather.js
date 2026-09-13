const express = require("express");

const { readConfig } = require("../lib/configStore");

const router = express.Router();

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();

const WEATHER_CODE_CONDITIONS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
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
  let config;
  try {
    config = readConfig();
  } catch (err) {
    return res
      .status(500)
      .json({ error: "failed to read config", details: err.message });
  }

  const { lat, lon } = config.location || {};
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res
      .status(400)
      .json({ error: "config.location.lat and lon must be numbers" });
  }

  const cacheKey = `${lat},${lon}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

  try {
    const raw = await fetchForecast(lat, lon);
    const shaped = shapeForecast(raw);
    cache.set(cacheKey, { data: shaped, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(shaped);
  } catch (err) {
    res
      .status(502)
      .json({ error: "failed to fetch weather", details: err.message });
  }
});

module.exports = router;
