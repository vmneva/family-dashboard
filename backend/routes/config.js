const express = require("express");

const { readConfig, writeConfig } = require("../lib/configStore");

const router = express.Router();

function validateConfig(body) {
  if (typeof body !== "object" || body === null)
    return "config must be an object";

  const { location, destination, calendars, waste } = body;

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

  if (typeof calendars !== "object" || calendars === null)
    return "calendars must be an object";
  if (typeof calendars.mom !== "string" || typeof calendars.dad !== "string") {
    return "calendars.mom and calendars.dad must be strings";
  }

  if (!Array.isArray(waste)) return "waste must be an array";

  return null;
}

router.get("/", (_req, res) => {
  try {
    const config = readConfig();
    res.json(config);
  } catch (err) {
    res
      .status(500)
      .json({ error: "failed to read config", details: err.message });
  }
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
