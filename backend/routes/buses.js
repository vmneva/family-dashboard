const express = require("express");

const { readConfig } = require("../lib/configStore");

const router = express.Router();

const DIGITRANSIT_ENDPOINT =
  "https://api.digitransit.fi/routing/v2/finland/gtfs/v1";
const NUM_ITINERARIES = 5;
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

const PLAN_QUERY = `
  query NextTrips(
    $fromLat: CoordinateValue!
    $fromLon: CoordinateValue!
    $toLat: CoordinateValue!
    $toLon: CoordinateValue!
    $when: OffsetDateTime!
    $n: Int!
  ) {
    planConnection(
      origin: {
        location: { coordinate: { latitude: $fromLat, longitude: $fromLon } }
      }
      destination: {
        location: { coordinate: { latitude: $toLat, longitude: $toLon } }
      }
      first: $n
      dateTime: { earliestDeparture: $when }
      modes: {
        transit: {
          transit: [
            { mode: BUS }
            { mode: TRAM }
            { mode: RAIL }
            { mode: SUBWAY }
            { mode: FERRY }
          ]
        }
      }
    ) {
      edges {
        node {
          legs {
            mode
            startTime
            route {
              shortName
            }
            trip {
              tripHeadsign
            }
          }
        }
      }
    }
  }
`;

function toHelsinkiIsoString(ms) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date(ms))
    .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

async function fetchPlan(origin, destination) {
  const apiKey = process.env.DIGITRANSIT_API_KEY;
  if (!apiKey) {
    throw new Error("DIGITRANSIT_API_KEY is not set");
  }

  const response = await fetch(DIGITRANSIT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "digitransit-subscription-key": apiKey,
    },
    body: JSON.stringify({
      query: PLAN_QUERY,
      variables: {
        fromLat: origin.lat,
        fromLon: origin.lon,
        toLat: destination.lat,
        toLon: destination.lon,
        when: new Date().toISOString(),
        n: NUM_ITINERARIES,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Digitransit request failed with status ${response.status}`,
    );
  }

  const body = await response.json();
  if (body.errors) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }

  return body.data.planConnection.edges || [];
}

function shapeItineraries(edges) {
  const now = Date.now();
  const seen = new Set();
  const departures = [];

  for (const edge of edges) {
    const transitLegs = edge.node.legs.filter((leg) => leg.mode !== "WALK");
    if (transitLegs.length !== 1) continue; // skip itineraries that require a transfer

    const leg = transitLegs[0];
    const departureMs = Number(leg.startTime);
    const key = `${leg.route.shortName}-${departureMs}`;
    if (seen.has(key)) continue;
    seen.add(key);

    departures.push({
      route: leg.route.shortName,
      destination: leg.trip.tripHeadsign,
      departureTime: toHelsinkiIsoString(departureMs),
      minutesUntil: Math.round((departureMs - now) / 60000),
    });
  }

  departures.sort(
    (a, b) => new Date(a.departureTime) - new Date(b.departureTime),
  );

  return departures;
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

  const { location, destination } = config;
  if (
    !location ||
    typeof location.lat !== "number" ||
    typeof location.lon !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "config.location.lat and lon must be numbers" });
  }
  if (
    !destination ||
    typeof destination.lat !== "number" ||
    typeof destination.lon !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "config.destination.lat and lon must be numbers" });
  }

  const cacheKey = `${location.lat},${location.lon}-${destination.lat},${destination.lon}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

  try {
    const edges = await fetchPlan(location, destination);
    const departures = shapeItineraries(edges);
    cache.set(cacheKey, {
      data: departures,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    res.json(departures);
  } catch (err) {
    res
      .status(502)
      .json({ error: "failed to fetch buses", details: err.message });
  }
});

module.exports = router;
