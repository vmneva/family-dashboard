require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const weatherRouter = require("./routes/weather");
const busesRouter = require("./routes/buses");
const calendarRouter = require("./routes/calendar");
const wasteRouter = require("./routes/waste");
const configRouter = require("./routes/config");

const CONFIG_PATH = path.join(__dirname, "data", "config.json");
const CONFIG_EXAMPLE_PATH = path.join(__dirname, "data", "config.example.json");

function ensureConfigExists() {
  if (fs.existsSync(CONFIG_PATH)) return;

  if (fs.existsSync(CONFIG_EXAMPLE_PATH)) {
    fs.copyFileSync(CONFIG_EXAMPLE_PATH, CONFIG_PATH);
    console.warn(
      `No data/config.json found — created one from config.example.json. Edit it with real values before relying on the dashboard.`,
    );
  } else {
    console.warn(
      "No data/config.json or config.example.json found — /api/config will fail until one is created.",
    );
  }
}

ensureConfigExists();

const FRONTEND_DIST_PATH = path.join(__dirname, "..", "frontend", "dist");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use("/api/weather", weatherRouter);
app.use("/api/buses", busesRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/waste", wasteRouter);
app.use("/api/config", configRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(FRONTEND_DIST_PATH));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(FRONTEND_DIST_PATH, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Family dashboard backend listening on port ${PORT}`);
});
