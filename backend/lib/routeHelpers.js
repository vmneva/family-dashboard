const { readConfig } = require("./configStore");

// Reads config for a route handler, sending a 500 response and returning
// null if it fails. Callers should `return` immediately when this returns null.
function readConfigOrFail(res) {
  try {
    return readConfig();
  } catch (err) {
    res.status(500).json({ error: "failed to read config", details: err.message });
    return null;
  }
}

module.exports = { readConfigOrFail };
