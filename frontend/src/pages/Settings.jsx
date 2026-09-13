import { useEffect, useState } from "react";
import {
  WASTE_TYPES,
  DEFAULT_WASTE_INTERVAL_WEEKS,
  wasteTypeColor,
} from "../lib/waste.js";
import { calendarColorForIndex } from "../lib/calendarColors.js";
import BackIcon from "../components/BackIcon.jsx";

// Waste comes back from the API as one { type, lastEmptied } entry per type
// that's being tracked; editing keeps one row per known waste type, keyed by
// type, and only types with a lastEmptied date are sent back on save.
function wasteEntriesFromConfig(waste, wasteIntervals) {
  const byType = new Map((waste ?? []).map((entry) => [entry.type, entry]));
  return Object.fromEntries(
    WASTE_TYPES.map(({ value }) => [
      value,
      {
        lastEmptied: byType.get(value)?.lastEmptied ?? "",
        intervalWeeks:
          wasteIntervals?.[value] ?? DEFAULT_WASTE_INTERVAL_WEEKS[value],
      },
    ]),
  );
}

let nextLocalId = 0;
function makeLocalId() {
  nextLocalId += 1;
  return `new-${Date.now().toString(36)}-${nextLocalId}`;
}

function calendarsFromConfig(calendars) {
  if (!Array.isArray(calendars) || calendars.length === 0) {
    return [{ id: makeLocalId(), name: "", url: "" }];
  }
  return calendars.map((calendar) => ({
    id: calendar.id,
    name: calendar.name ?? "",
    url: calendar.url ?? "",
  }));
}

function Settings({ onBack }) {
  const [config, setConfig] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [wasteEntries, setWasteEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | success | error
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/config");
        if (!response.ok) {
          throw new Error(`/api/config responded with ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) return;
        setConfig(data);
        setCalendars(calendarsFromConfig(data.calendars));
        setWasteEntries(
          wasteEntriesFromConfig(data.waste, data.wasteIntervals),
        );
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateCalendar(id, changes) {
    setCalendars((cals) =>
      cals.map((cal) => (cal.id === id ? { ...cal, ...changes } : cal)),
    );
  }

  function addCalendar() {
    setCalendars((cals) => [...cals, { id: makeLocalId(), name: "", url: "" }]);
  }

  function removeCalendar(id) {
    setCalendars((cals) => cals.filter((cal) => cal.id !== id));
  }

  function updateWasteEntry(type, changes) {
    setWasteEntries((entries) => ({
      ...entries,
      [type]: { ...entries[type], ...changes },
    }));
  }

  useEffect(() => {
    if (saveState !== "success" && saveState !== "error") return undefined;
    const timeout = setTimeout(
      () => setSaveState("idle"),
      saveState === "success" ? 2500 : 5000,
    );
    return () => clearTimeout(timeout);
  }, [saveState]);

  async function handleSave(event) {
    event.preventDefault();
    setSaveState("saving");
    setSaveError(null);

    const payload = {
      ...config,
      calendars: calendars
        .filter((cal) => cal.name.trim() || cal.url.trim())
        .map((cal) => ({
          id: cal.id,
          name: cal.name.trim(),
          url: cal.url.trim(),
        })),
      waste: WASTE_TYPES.filter(
        ({ value }) => wasteEntries[value]?.lastEmptied,
      ).map(({ value }) => ({
        type: value,
        lastEmptied: wasteEntries[value].lastEmptied,
      })),
      wasteIntervals: Object.fromEntries(
        WASTE_TYPES.map(({ value }) => [
          value,
          Number(wasteEntries[value]?.intervalWeeks) ||
            DEFAULT_WASTE_INTERVAL_WEEKS[value],
        ]),
      ),
    };

    try {
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ?? `PUT /api/config responded with ${response.status}`,
        );
      }
      setConfig(data);
      setCalendars(calendarsFromConfig(data.calendars));
      setWasteEntries(wasteEntriesFromConfig(data.waste, data.wasteIntervals));
      setSaveState("success");
    } catch (error) {
      setSaveState("error");
      setSaveError(error);
    }
  }

  return (
    <div id="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button
            type="button"
            className="settings-back-button"
            onClick={onBack}
            aria-label="Takaisin"
          >
            <BackIcon className="settings-back-icon" />
          </button>
          <h1>Asetukset</h1>
        </div>

        {loading ? (
          <p className="panel-message">Ladataan…</p>
        ) : loadError ? (
          <p className="panel-message panel-message-error">
            Asetusten lataaminen epäonnistui
          </p>
        ) : (
          <form className="settings-form" onSubmit={handleSave}>
            <fieldset className="settings-section settings-section-calendars">
              <legend>Kalenterit</legend>
              <div className="settings-calendar-rows">
                {calendars.map((calendar, index) => (
                  <div className="settings-calendar-row" key={calendar.id}>
                    <span
                      className="settings-calendar-swatch"
                      style={{ background: calendarColorForIndex(index) }}
                      aria-hidden="true"
                    />
                    <label className="settings-field settings-calendar-name">
                      Nimi
                      <input
                        type="text"
                        value={calendar.name}
                        onChange={(event) =>
                          updateCalendar(calendar.id, {
                            name: event.target.value,
                          })
                        }
                        placeholder="Esim. Äiti"
                      />
                    </label>
                    <label className="settings-field settings-calendar-url">
                      iCal-osoite
                      <input
                        type="url"
                        value={calendar.url}
                        onChange={(event) =>
                          updateCalendar(calendar.id, {
                            url: event.target.value,
                          })
                        }
                        placeholder="https://…"
                      />
                    </label>
                    <button
                      type="button"
                      className="settings-remove-button"
                      onClick={() => removeCalendar(calendar.id)}
                      aria-label={`Poista kalenteri ${calendar.name || ""}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="settings-add-button"
                onClick={addCalendar}
              >
                + Lisää kalenteri
              </button>
            </fieldset>

            <fieldset className="settings-section settings-section-waste">
              <legend>Jätehuolto</legend>
              <div className="settings-waste-rows">
                {WASTE_TYPES.map((option) => {
                  const entry = wasteEntries[option.value] ?? {};
                  return (
                    <div className="settings-waste-row" key={option.value}>
                      <span
                        className="chip settings-waste-chip"
                        style={{ background: wasteTypeColor(option.value) }}
                      >
                        {option.label}
                      </span>
                      <div className="settings-waste-controls">
                        <label className="settings-waste-subfield">
                          Viimeksi tyhjennetty
                          <input
                            type="date"
                            value={entry.lastEmptied ?? ""}
                            onChange={(event) =>
                              updateWasteEntry(option.value, {
                                lastEmptied: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="settings-waste-subfield settings-waste-interval">
                          Tyhjennysväli
                          <span className="settings-interval-input-group">
                            <input
                              type="number"
                              min="1"
                              value={entry.intervalWeeks ?? ""}
                              onChange={(event) =>
                                updateWasteEntry(option.value, {
                                  intervalWeeks: event.target.value,
                                })
                              }
                            />
                            <span className="settings-interval-unit">vk</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className="settings-actions">
              <button type="submit" disabled={saveState === "saving"}>
                {saveState === "saving" ? "Tallennetaan…" : "Tallenna"}
              </button>
            </div>
          </form>
        )}
      </div>

      {(saveState === "success" || saveState === "error") && (
        <div
          className={`toast ${saveState === "success" ? "toast-success" : "toast-error"}`}
          role="status"
        >
          {saveState === "success"
            ? "Tallennettu"
            : `Virhe: ${saveError?.message}`}
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setSaveState("idle")}
            aria-label="Sulje ilmoitus"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default Settings;
