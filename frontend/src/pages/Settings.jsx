import { useEffect, useState } from "react";
import {
  WASTE_TYPES,
  DEFAULT_WASTE_INTERVAL_WEEKS,
  wasteTypeColor,
} from "../lib/waste.js";
import { calendarColorForIndex } from "../lib/calendarColors.js";
import BackIcon from "../components/BackIcon.jsx";

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

// Waste comes back from the API as one { type, lastEmptied } entry per type
// that's being tracked; only tracked types get an editable row, mirroring
// the calendar rows' add/remove flow.
function wasteRowsFromConfig(waste, wasteIntervals) {
  return (waste ?? []).map((entry) => ({
    id: makeLocalId(),
    type: entry.type,
    lastEmptied: entry.lastEmptied ?? "",
    intervalWeeks:
      wasteIntervals?.[entry.type] ?? DEFAULT_WASTE_INTERVAL_WEEKS[entry.type],
  }));
}

// Serializes the editable state so it can be compared against a saved
// snapshot to tell whether the form has unsaved changes.
function snapshotOf(calendars, wasteRows) {
  return JSON.stringify({ calendars, wasteRows });
}

function Settings({ onBack }) {
  const [config, setConfig] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [wasteRows, setWasteRows] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | success | error
  const [saveError, setSaveError] = useState(null);

  const isDirty =
    savedSnapshot !== null &&
    snapshotOf(calendars, wasteRows) !== savedSnapshot;

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
        const nextCalendars = calendarsFromConfig(data.calendars);
        const nextWasteRows = wasteRowsFromConfig(
          data.waste,
          data.wasteIntervals,
        );
        setConfig(data);
        setCalendars(nextCalendars);
        setWasteRows(nextWasteRows);
        setSavedSnapshot(snapshotOf(nextCalendars, nextWasteRows));
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

  function updateWasteRow(id, changes) {
    setWasteRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  }

  function addWasteRow() {
    setWasteRows((rows) => {
      const usedTypes = new Set(rows.map((row) => row.type));
      const nextType = WASTE_TYPES.find(({ value }) => !usedTypes.has(value));
      if (!nextType) return rows;
      return [
        ...rows,
        {
          id: makeLocalId(),
          type: nextType.value,
          lastEmptied: "",
          intervalWeeks: DEFAULT_WASTE_INTERVAL_WEEKS[nextType.value],
        },
      ];
    });
  }

  function removeWasteRow(id) {
    setWasteRows((rows) => rows.filter((row) => row.id !== id));
  }

  function availableWasteTypesFor(row) {
    const usedByOthers = new Set(
      wasteRows
        .filter((other) => other.id !== row.id)
        .map((other) => other.type),
    );
    return WASTE_TYPES.filter(({ value }) => !usedByOthers.has(value));
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
      waste: wasteRows.map((row) => ({
        type: row.type,
        lastEmptied: row.lastEmptied,
      })),
      wasteIntervals: Object.fromEntries(
        wasteRows.map((row) => [
          row.type,
          Number(row.intervalWeeks) || DEFAULT_WASTE_INTERVAL_WEEKS[row.type],
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
      const nextCalendars = calendarsFromConfig(data.calendars);
      const nextWasteRows = wasteRowsFromConfig(
        data.waste,
        data.wasteIntervals,
      );
      setConfig(data);
      setCalendars(nextCalendars);
      setWasteRows(nextWasteRows);
      setSavedSnapshot(snapshotOf(nextCalendars, nextWasteRows));
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
                      ❌
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="settings-add-button"
                onClick={addCalendar}
              >
                ➕ Lisää kalenteri
              </button>
            </fieldset>

            <fieldset className="settings-section settings-section-waste">
              <legend>Jätehuolto</legend>
              <div className="settings-waste-rows">
                {wasteRows.map((row) => (
                  <div className="settings-waste-row" key={row.id}>
                    <span
                      className="settings-waste-swatch"
                      style={{ background: wasteTypeColor(row.type) }}
                      aria-hidden="true"
                    />
                    <label className="settings-field settings-waste-type">
                      Jätetyyppi
                      <select
                        value={row.type}
                        onChange={(event) =>
                          updateWasteRow(row.id, {
                            type: event.target.value,
                            intervalWeeks:
                              DEFAULT_WASTE_INTERVAL_WEEKS[event.target.value],
                          })
                        }
                      >
                        {availableWasteTypesFor(row).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="settings-field settings-waste-date">
                      Viimeksi tyhjennetty
                      <input
                        type="date"
                        value={row.lastEmptied}
                        onChange={(event) =>
                          updateWasteRow(row.id, {
                            lastEmptied: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="settings-field settings-waste-interval">
                      Tyhjennysväli
                      <span className="settings-interval-input-group">
                        <input
                          type="number"
                          min="1"
                          value={row.intervalWeeks ?? ""}
                          onChange={(event) =>
                            updateWasteRow(row.id, {
                              intervalWeeks: event.target.value,
                            })
                          }
                        />
                        <span className="settings-interval-unit">vk</span>
                      </span>
                    </label>
                    <button
                      type="button"
                      className="settings-remove-button"
                      onClick={() => removeWasteRow(row.id)}
                      aria-label={`Poista jäte ${row.type}`}
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="settings-add-button"
                onClick={addWasteRow}
                disabled={wasteRows.length >= WASTE_TYPES.length}
              >
                ➕ Lisää jäte
              </button>
            </fieldset>

            {(isDirty || saveState === "saving") && (
              <div className="settings-actions">
                <button type="submit" disabled={saveState === "saving"}>
                  {saveState === "saving"
                    ? "Tallennetaan…"
                    : "Tallenna muutokset"}
                </button>
              </div>
            )}
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
