import { useEffect, useState } from "react";
import { WASTE_TYPES, DEFAULT_WASTE_INTERVAL_WEEKS } from "../lib/waste.js";

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

function Settings({ onBack }) {
  const [config, setConfig] = useState(null);
  const [momUrl, setMomUrl] = useState("");
  const [dadUrl, setDadUrl] = useState("");
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
        setMomUrl(data.calendars?.mom ?? "");
        setDadUrl(data.calendars?.dad ?? "");
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

  function updateWasteEntry(type, changes) {
    setWasteEntries((entries) => ({
      ...entries,
      [type]: { ...entries[type], ...changes },
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveState("saving");
    setSaveError(null);

    const payload = {
      ...config,
      calendars: { mom: momUrl, dad: dadUrl },
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
      setWasteEntries(wasteEntriesFromConfig(data.waste, data.wasteIntervals));
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
              {WASTE_TYPES.map((option) => {
                const entry = wasteEntries[option.value] ?? {};
                return (
                  <div className="settings-waste-row" key={option.value}>
                    <span className="settings-waste-label">
                      {option.label}
                    </span>
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
                );
              })}
            </div>
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
