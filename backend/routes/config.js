const express = require("express");

const { writeConfig } = require("../lib/configStore");
const { readConfigOrFail } = require("../lib/routeHelpers");

const router = express.Router();

function validateConfig(body) {
  if (typeof body !== "object" || body === null)
    return "config must be an object";

  const { location, destination, calendars, waste, wasteIntervals } = body;

  if (typeof location !== "object" || location === null)
    return "location must be an object";
  if (typeof location.lat !== "number" || typeof location.lon !== "number") {
    return "location.lat and location.lon must be numbers";
  }
  if (typeof location.name !== "string") {
    return "location.name must be a string";
  }

  if (typeof destination !== "object" || destination === null)
    return "destination must be an object";
  if (
    typeof destination.lat !== "number" ||
    typeof destination.lon !== "number"
  ) {
    return "destination.lat and destination.lon must be numbers";
  }
  if (typeof destination.name !== "string") {
    return "destination.name must be a string";
  }

  if (!Array.isArray(calendars)) return "calendars must be an array";
  for (const calendar of calendars) {
    if (typeof calendar !== "object" || calendar === null) {
      return "each calendar must be an object";
    }
    if (typeof calendar.id !== "string" || !calendar.id) {
      return "each calendar must have a non-empty string id";
    }
    if (typeof calendar.name !== "string" || !calendar.name) {
      return "each calendar must have a non-empty string name";
    }
    if (typeof calendar.url !== "string") {
      return "each calendar must have a url string";
    }
  }

  if (!Array.isArray(waste)) return "waste must be an array";
  for (const entry of waste) {
    if (typeof entry !== "object" || entry === null) {
      return "each waste entry must be an object";
    }
    if (typeof entry.type !== "string" || !entry.type) {
      return "each waste entry must have a non-empty string type";
    }
    if (typeof entry.lastEmptied !== "string") {
      return "each waste entry must have a lastEmptied date string";
    }
  }

  if (wasteIntervals !== undefined) {
    if (
      typeof wasteIntervals !== "object" ||
      wasteIntervals === null ||
      Array.isArray(wasteIntervals)
    ) {
      return "wasteIntervals must be an object";
    }
    for (const [type, weeks] of Object.entries(wasteIntervals)) {
      if (typeof weeks !== "number" || !Number.isFinite(weeks) || weeks <= 0) {
        return `wasteIntervals.${type} must be a positive number`;
      }
    }
  }

  return null;
}

router.get("/", (_req, res) => {
  const config = readConfigOrFail(res);
  if (!config) return;
  res.json(config);
});

router.put("/", (req, res) => {
  const validationError = validateConfig(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const updated = writeConfig(req.body);
    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ error: "failed to write config", details: err.message });
  }
});

module.exports = router;
