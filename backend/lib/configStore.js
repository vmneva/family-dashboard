const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "..", "data", "config.json");

let cache = null;

function readConfig() {
  if (cache) return cache;

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  cache = JSON.parse(raw);
  return cache;
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  cache = config;
  return cache;
}

module.exports = { readConfig, writeConfig };
