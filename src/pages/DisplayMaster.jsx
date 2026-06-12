import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useDisplaySettings,
  DEFAULT_SETTINGS,
} from "../hooks/useDisplaySettings";

// ─── Slider config ────────────────────────────────────────────────────────────
const SLIDER_GROUPS = [
  {
    label: "Score Sizes",
    icon: "🎯",
    sliders: [
      {
        key: "fontGameScore",
        label: "Game / Point Score",
        unit: "px",
        min: 60,
        max: 200,
        step: 1,
        hint: "The large score shown in the accent column",
      },
      {
        key: "fontSetScore",
        label: "Set Score",
        unit: "px",
        min: 40,
        max: 140,
        step: 1,
        hint: "Scores inside each SET column",
      },
    ],
  },
  {
    label: "Text Sizes",
    icon: "🔤",
    sliders: [
      {
        key: "fontPlayerName",
        label: "Player / Team Name",
        unit: "px",
        min: 20,
        max: 500,
        step: 1,
        hint: "Team name text in the player rows",
      },
      {
        key: "fontHeaderLabel",
        label: "Header Labels (PLAYERS / SET 1 / SCORE)",
        unit: "px",
        min: 16,
        max: 60,
        step: 1,
        hint: "Column heading text in the scoreboard header bar",
      },
      {
        key: "courtNameSize",
        label: "Court Name / Bottom Label",
        unit: "px",
        min: 10,
        max: 80,
        step: 1,
        hint: "Font size of the court name shown in the bottom centre of each scoreboard",
      },
    ],
  },
  {
    label: "Logo Sizes",
    icon: "🖼️",
    sliders: [
      {
        key: "logoHeaderH",
        label: "Side Logos Height (left & right)",
        unit: "px",
        min: 40,
        max: 1000,
        step: 5,
        hint: "Max-height of the left and right header logos",
      },
      {
        key: "logoCupH",
        label: "Center Cup Logo Height",
        unit: "px",
        min: 40,
        max: 1000,
        step: 5,
        hint: "Max-height of the tournament cup/title logo",
      },
      {
        key: "logoTeamSize",
        label: "Team Logo Size (scoreboard)",
        unit: "px",
        min: 30,
        max: 1000,
        step: 5,
        hint: "Width & height of team crests in the player rows",
      },
      {
        key: "sponsorH",
        label: "Sponsor Strip Height",
        unit: "px",
        min: 30,
        max: 300,
        step: 5,
        hint: "Height of the scrolling sponsor logo bar at the bottom",
      },
    ],
  },
  {
    label: "Spacing",
    icon: "📐",
    sliders: [
      {
        key: "marginHVw",
        label: "Horizontal Margin",
        unit: "vw",
        min: 0,
        max: 15,
        step: 0.5,
        hint: "Left/right space between scoreboard and screen edge",
      },
      {
        key: "marginTopVh",
        label: "Top Gap (below header)",
        unit: "vh",
        min: 0,
        max: 12,
        step: 0.5,
        hint: "Vertical gap between the header logos and the scoreboard",
      },
      {
        key: "headerPaddingVw",
        label: "Header Left/Right Spacing",
        unit: "vw",
        min: 0,
        max: 20,
        step: 0.5,
        hint: "Horizontal padding on the tournament header logo row (left & right logos)",
      },
    ],
  },
];

// ─── Single Slider Row ────────────────────────────────────────────────────────
const SliderRow = ({ config, value, onChange, disabled }) => {
  const pct = ((value - config.min) / (config.max - config.min)) * 100;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-gray-200 leading-tight">
          {config.label}
        </label>
        <span
          className="ml-3 min-w-[4.5rem] text-right text-sm font-mono font-bold"
          style={{ color: "var(--color-accent, #aacb32)" }}
        >
          {value}
          {config.unit}
        </span>
      </div>
      {config.hint && (
        <p className="text-xs text-gray-500 mb-2 leading-tight">
          {config.hint}
        </p>
      )}
      <div className="relative flex items-center">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, var(--color-accent, #aacb32) ${pct}%, #374151 ${pct}%)`,
            outline: "none",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-1 px-0.5">
        <span>
          {config.min}
          {config.unit}
        </span>
        <span>
          {config.max}
          {config.unit}
        </span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DisplayMaster = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const displayId = searchParams.get("displayId");
  const tournamentId = searchParams.get("tournamentId") ?? "67";
  const courtId = searchParams.get("courtId") ?? "79";

  const [inputId, setInputId] = useState(displayId ?? "");
  const [copied, setCopied] = useState(false);

  const { settings, updateSetting, resetSettings, isConnected } =
    useDisplaySettings({ displayId, listenOnly: false });

  const slidersEnabled = Boolean(displayId);

  const handleSetDisplayId = (e) => {
    e.preventDefault();
    const trimmed = inputId.trim();
    if (!trimmed) return;
    const next = new URLSearchParams(searchParams);
    next.set("displayId", trimmed);
    setSearchParams(next);
  };

  const handleCopyUrl = async () => {
    if (!displayId) return;
    const params = new URLSearchParams({
      tournamentId,
      courtId,
      displayId,
    });
    const url = `${window.location.origin}/home/live-court?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#0f1117", color: "#e5e7eb" }}
    >
      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
        style={{ backgroundColor: "#161b22", borderColor: "#30363d" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: isConnected
                ? "var(--color-accent, #aacb32)"
                : "#6b7280",
              animation: isConnected ? "pulse 2s infinite" : "none",
            }}
          />
          <h1 className="text-lg font-bold tracking-wide text-white">
            Display Master Control
          </h1>
          {displayId && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium font-mono"
              style={{ backgroundColor: "#21262d", color: "#8b949e" }}
            >
              {displayId}
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: isConnected ? "#1e2d0e" : "#2d1a1a",
              color: isConnected ? "var(--color-accent, #aacb32)" : "#f85149",
            }}
          >
            {isConnected ? "CONNECTED" : "OFFLINE"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyUrl}
            disabled={!displayId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: copied ? "#1a3a1a" : "#21262d",
              color: copied ? "#4ade80" : "#8b949e",
              border: "1px solid #30363d",
            }}
          >
            {copied ? "✓ Copied!" : "📋 Copy Display URL"}
          </button>
          <button
            onClick={resetSettings}
            disabled={!displayId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#21262d",
              color: "#f85149",
              border: "1px solid #30363d",
            }}
          >
            ↺ Reset Defaults
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Display ID setup */}
        {!displayId ? (
          <div
            className="mb-6 px-4 py-5 rounded-lg"
            style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
          >
            <h2 className="text-sm font-bold text-white mb-2">
              Connect to a Display Screen
            </h2>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Enter the same Display ID shown on the TV screen. Each screen has
              its own ID (e.g.{" "}
              <code
                className="px-1 rounded text-xs"
                style={{ backgroundColor: "#21262d" }}
              >
                court-79
              </code>
              ). Only that screen will receive your changes.
            </p>
            <form onSubmit={handleSetDisplayId} className="flex gap-2">
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="e.g. court-79"
                className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                style={{
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  color: "#e5e7eb",
                }}
              />
              <button
                type="submit"
                disabled={!inputId.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{
                  backgroundColor: "var(--color-accent, #aacb32)",
                  color: "#0f1117",
                }}
              >
                Connect
              </button>
            </form>
          </div>
        ) : (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm leading-relaxed"
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              color: "#8b949e",
            }}
          >
            Move any slider — changes appear{" "}
            <strong className="text-white">instantly</strong> on the TV display
            with ID{" "}
            <code
              className="px-1 rounded text-xs"
              style={{ backgroundColor: "#21262d" }}
            >
              {displayId}
            </code>
            . Open this page on your phone and the display on the TV — both sync
            via WebSocket. Use{" "}
            <strong className="text-white">Copy Display URL</strong> to share
            the TV link.
          </div>
        )}

        {/* Slider groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SLIDER_GROUPS.map((group) => (
            <div
              key={group.label}
              className="rounded-xl p-5"
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
              }}
            >
              <h2 className="flex items-center gap-2 text-sm font-bold text-white mb-4 uppercase tracking-widest">
                <span>{group.icon}</span>
                {group.label}
              </h2>
              {group.sliders.map((cfg) => (
                <SliderRow
                  key={cfg.key}
                  config={cfg}
                  value={settings[cfg.key]}
                  disabled={!slidersEnabled}
                  onChange={(val) => updateSetting(cfg.key, val)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Current values summary */}
        {displayId && (
          <div
            className="mt-6 rounded-xl p-5"
            style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
          >
            <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-widest">
              Current Values
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {Object.entries(settings).map(([key, val]) => {
                const allSliders = SLIDER_GROUPS.flatMap((g) => g.sliders);
                const cfg = allSliders.find((s) => s.key === key);
                const isDefault = DEFAULT_SETTINGS[key] === val;
                return (
                  <div
                    key={key}
                    className="rounded-lg p-2 text-center"
                    style={{
                      backgroundColor: isDefault ? "#0d1117" : "#1a2a0a",
                      border: `1px solid ${isDefault ? "#21262d" : "var(--color-accent, #aacb32)"}`,
                    }}
                  >
                    <div className="text-[9px] text-gray-500 leading-none mb-1 truncate">
                      {cfg?.label?.split(" ").slice(0, 2).join(" ") ?? key}
                    </div>
                    <div
                      className="text-sm font-bold font-mono"
                      style={{
                        color: isDefault
                          ? "#8b949e"
                          : "var(--color-accent, #aacb32)",
                      }}
                    >
                      {val}
                      {cfg?.unit ?? ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Range input thumb style */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-accent, #aacb32);
          cursor: pointer;
          border: 2px solid #0f1117;
          box-shadow: 0 0 4px rgba(170,203,50,0.5);
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-accent, #aacb32);
          cursor: pointer;
          border: 2px solid #0f1117;
        }
      `}</style>
    </div>
  );
};

export default DisplayMaster;
