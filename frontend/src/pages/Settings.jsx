import { useEffect, useState } from "react";
import { WASTE_TYPES } from "../lib/waste.js";

// Waste entries come back from the API grouped as { type, dates: [...] };
// editing is easier as flat type+date rows, regrouped on save.
function flattenWaste(waste) {
  return waste.flatMap((entry) =>
    entry.dates.map((date) => ({
      id: crypto.randomUUID(),
      type: entry.type,
      date,
    })),
  );
}

function groupWasteRows(rows) {
  const datesByType = new Map();
  for (const row of rows) {
    if (!row.type || !row.date) continue;
    if (!datesByType.has(row.type)) datesByType.set(row.type, new Set());
    datesByType.get(row.type).add(row.date);
  }
  return Array.from(datesByType, ([type, dates]) => ({
    type,
    dates: Array.from(dates).sort(),
  }));
}

function emptyWasteRow() {
  return { id: crypto.randomUUID(), type: WASTE_TYPES[0].value, date: "" };
}

function Settings({ onBack }) {
  const [config, setConfig] = useState(null);
  const [momUrl, setMomUrl] = useState("");
  const [dadUrl, setDadUrl] = useState("");
  const [wasteRows, setWasteRows] = useState([]);
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
        setMomUrl(data.calendars?.mom ?? "");
        setDadUrl(data.calendars?.dad ?? "");
        setWasteRows(flattenWaste(data.waste ?? []));
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

  function updateRow(id, changes) {
    setWasteRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  }

  function addRow() {
    setWasteRows((rows) => [...rows, emptyWasteRow()]);
  }

  function removeRow(id) {
    setWasteRows((rows) => rows.filter((row) => row.id !== id));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveState("saving");
    setSaveError(null);

    const payload = {
      ...config,
      calendars: { mom: momUrl, dad: dadUrl },
      waste: groupWasteRows(wasteRows),
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
      setWasteRows(flattenWaste(data.waste ?? []));
      setSaveState("success");
    } catch (error) {
      setSaveState("error");
      setSaveError(error);
    }
  }

  return (
    <div id="settings-page">
      <div className="settings-header">
        <h1>Asetukset</h1>
        <button type="button" onClick={onBack}>
          Takaisin
        </button>
      </div>

      {loading ? (
        <p className="panel-message">Ladataan…</p>
      ) : loadError ? (
        <p className="panel-message panel-message-error">
          Asetusten lataaminen epäonnistui
        </p>
      ) : (
        <form className="settings-form" onSubmit={handleSave}>
          <fieldset className="settings-section">
            <legend>Kalenterit</legend>
            <label className="settings-field">
              Äidin kalenteri (iCal-osoite)
              <input
                type="url"
                value={momUrl}
                onChange={(event) => setMomUrl(event.target.value)}
                placeholder="https://…"
              />
            </label>
            <label className="settings-field">
              Isän kalenteri (iCal-osoite)
              <input
                type="url"
                value={dadUrl}
                onChange={(event) => setDadUrl(event.target.value)}
                placeholder="https://…"
              />
            </label>
          </fieldset>

          <fieldset className="settings-section">
            <legend>Jätehuolto</legend>
            <div className="settings-waste-rows">
              {wasteRows.map((row) => (
                <div className="settings-waste-row" key={row.id}>
                  <select
                    value={row.type}
                    onChange={(event) =>
                      updateRow(row.id, { type: event.target.value })
                    }
                  >
                    {WASTE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(event) =>
                      updateRow(row.id, { date: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="settings-remove-row"
                    onClick={() => removeRow(row.id)}
                    aria-label="Poista tyhjennys"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {wasteRows.length === 0 && (
                <p className="panel-message">Ei tyhjennyksiä</p>
              )}
            </div>
            <button type="button" className="settings-add-row" onClick={addRow}>
              + Lisää tyhjennys
            </button>
          </fieldset>

          <div className="settings-actions">
            <button type="submit" disabled={saveState === "saving"}>
              {saveState === "saving" ? "Tallennetaan…" : "Tallenna"}
            </button>
            {saveState === "success" && (
              <span className="settings-feedback settings-feedback-success">
                Tallennettu
              </span>
            )}
            {saveState === "error" && (
              <span className="settings-feedback settings-feedback-error">
                Virhe: {saveError?.message}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

export default Settings;
