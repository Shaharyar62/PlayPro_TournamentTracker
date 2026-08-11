import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useScorebugSettings,
  DEFAULT_SCOREBUG_SETTINGS,
} from "../../hooks/useScorebugSettings";

const SLIDER_GROUPS = [
  {
    label: "Font Sizes",
    sliders: [
      {
        key: "fontName",
        label: "Team Name",
        unit: "px",
        min: 14,
        max: 56,
        step: 1,
        hint: "Player / team name text size",
      },
      {
        key: "fontSet",
        label: "Set Score",
        unit: "px",
        min: 18,
        max: 72,
        step: 1,
        hint: "Games won per set",
      },
      {
        key: "fontPoints",
        label: "Game Points",
        unit: "px",
        min: 20,
        max: 80,
        step: 1,
        hint: "Current game score (0/15/30/40/Ad)",
      },
    ],
  },
  {
    label: "Size & Position",
    sliders: [
      {
        key: "widthPx",
        label: "Overlay Width",
        unit: "px",
        min: 500,
        max: 1400,
        step: 10,
        hint: "Maximum width of the scorebug bar",
      },
      {
        key: "offsetX",
        label: "Horizontal Offset",
        unit: "px",
        min: -200,
        max: 200,
        step: 2,
        hint: "Shift left (-) or right (+)",
      },
      {
        key: "offsetY",
        label: "Vertical Offset",
        unit: "px",
        min: 0,
        max: 200,
        step: 2,
        hint: "Distance from top or bottom edge",
      },
      {
        key: "skewDeg",
        label: "Slant Angle",
        unit: "°",
        min: 0,
        max: 24,
        step: 1,
        hint: "Parallelogram slant amount",
      },
    ],
  },
];

const COLOR_FIELDS = [
  { key: "accentColor", label: "Accent / Points Panel" },
  { key: "panelBg", label: "Panel Background" },
  { key: "textColor", label: "Primary Text" },
  { key: "mutedTextColor", label: "Muted Text" },
];

const ServeIndicatorPreview = ({ color }) => (
  <div
    className="flex items-center gap-3 px-4 py-3 rounded-lg"
    style={{ backgroundColor: "#0b1220", border: "1px solid #30363d" }}
  >
    <span
      className="inline-flex rounded-full"
      style={{
        width: 18,
        height: 18,
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}, 0 0 14px ${color}88`,
      }}
      aria-hidden
    />
    <span className="text-sm text-gray-300">Serving team indicator</span>
  </div>
);

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
        <p className="text-xs text-gray-500 mb-2 leading-tight">{config.hint}</p>
      )}
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

const AlignButton = ({ active, onClick, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    style={{
      backgroundColor: active ? "var(--color-accent, #aacb32)" : "#21262d",
      color: active ? "#0f1117" : "#8b949e",
      border: "1px solid #30363d",
    }}
  >
    {children}
  </button>
);

const ScorebugSetup = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const displayId = searchParams.get("displayId");
  const tournamentId = searchParams.get("tournamentId") ?? "";
  const courtId = searchParams.get("courtId") ?? "";

  const [inputId, setInputId] = useState(displayId ?? "");
  const [inputTournamentId, setInputTournamentId] = useState(tournamentId);
  const [inputCourtId, setInputCourtId] = useState(courtId);
  const [copied, setCopied] = useState(false);

  const { settings, updateSetting, resetSettings, isConnected } =
    useScorebugSettings({ displayId, listenOnly: false });

  const controlsEnabled = Boolean(displayId);

  const handleConnect = (e) => {
    e.preventDefault();
    const trimmedId = inputId.trim();
    if (!trimmedId) return;
    const next = new URLSearchParams(searchParams);
    next.set("displayId", trimmedId);
    if (inputTournamentId.trim()) {
      next.set("tournamentId", inputTournamentId.trim());
    }
    if (inputCourtId.trim()) {
      next.set("courtId", inputCourtId.trim());
    }
    setSearchParams(next);
  };

  const buildOverlayUrl = () => {
    const params = new URLSearchParams();
    if (tournamentId) params.set("tournamentId", tournamentId);
    if (courtId) params.set("courtId", courtId);
    if (displayId) params.set("displayId", displayId);
    return `${window.location.origin}/streaming-live-court?${params.toString()}`;
  };

  const handleCopyUrl = async () => {
    if (!tournamentId || !courtId) return;
    try {
      await navigator.clipboard.writeText(buildOverlayUrl());
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
            Scorebug Setup
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
            disabled={!displayId || !tournamentId || !courtId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: copied ? "#1a3a1a" : "#21262d",
              color: copied ? "#4ade80" : "#8b949e",
              border: "1px solid #30363d",
            }}
          >
            {copied ? "Copied!" : "Copy OBS URL"}
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
            Reset Defaults
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!displayId ? (
          <div
            className="mb-6 px-4 py-5 rounded-lg"
            style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
          >
            <h2 className="text-sm font-bold text-white mb-2">
              Connect to OBS Scorebug
            </h2>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Enter a Display ID shared with your OBS browser source overlay.
              Use the same ID in both this setup page and the overlay URL (e.g.{" "}
              <code
                className="px-1 rounded text-xs"
                style={{ backgroundColor: "#21262d" }}
              >
                court-79
              </code>
              ).
            </p>
            <form onSubmit={handleConnect} className="space-y-3">
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Display ID (e.g. court-79)"
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={{
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  color: "#e5e7eb",
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={inputTournamentId}
                  onChange={(e) => setInputTournamentId(e.target.value)}
                  placeholder="Tournament ID"
                  className="px-3 py-2 rounded-lg text-sm font-mono"
                  style={{
                    backgroundColor: "#0d1117",
                    border: "1px solid #30363d",
                    color: "#e5e7eb",
                  }}
                />
                <input
                  type="text"
                  value={inputCourtId}
                  onChange={(e) => setInputCourtId(e.target.value)}
                  placeholder="Court ID"
                  className="px-3 py-2 rounded-lg text-sm font-mono"
                  style={{
                    backgroundColor: "#0d1117",
                    border: "1px solid #30363d",
                    color: "#e5e7eb",
                  }}
                />
              </div>
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
            Changes sync instantly to the OBS overlay with Display ID{" "}
            <code
              className="px-1 rounded text-xs"
              style={{ backgroundColor: "#21262d" }}
            >
              {displayId}
            </code>
            . Use{" "}
            <strong className="text-white">Copy OBS URL</strong> for your
            browser source.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
          >
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">
              Colors
            </h2>
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="mb-4 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-200">
                  {label}
                </label>
                <input
                  type="color"
                  value={settings[key] ?? DEFAULT_SCOREBUG_SETTINGS[key]}
                  disabled={!controlsEnabled}
                  onChange={(e) => updateSetting(key, e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "transparent", border: "none" }}
                />
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
          >
            <h2 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">
              Serve Indicator
            </h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Blue dot shown next to the serving team name on the overlay.
            </p>

            <ServeIndicatorPreview
              color={
                settings.serveIndicatorColor ??
                DEFAULT_SCOREBUG_SETTINGS.serveIndicatorColor
              }
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-200 shrink-0">
                Dot Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    settings.serveIndicatorColor ??
                    DEFAULT_SCOREBUG_SETTINGS.serveIndicatorColor
                  }
                  disabled={!controlsEnabled}
                  onChange={(e) =>
                    updateSetting("serveIndicatorColor", e.target.value)
                  }
                  className="w-12 h-8 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "transparent", border: "none" }}
                />
                <input
                  type="text"
                  value={
                    settings.serveIndicatorColor ??
                    DEFAULT_SCOREBUG_SETTINGS.serveIndicatorColor
                  }
                  disabled={!controlsEnabled}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      updateSetting("serveIndicatorColor", val);
                    }
                  }}
                  className="w-24 px-2 py-1 rounded text-xs font-mono disabled:opacity-40"
                  style={{
                    backgroundColor: "#0d1117",
                    border: "1px solid #30363d",
                    color: "#e5e7eb",
                  }}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
          >
            <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">
              Alignment
            </h2>
            <p className="text-xs text-gray-500 mb-3">Horizontal</p>
            <div className="flex gap-2 mb-4">
              {["left", "center", "right"].map((val) => (
                <AlignButton
                  key={val}
                  active={settings.alignH === val}
                  disabled={!controlsEnabled}
                  onClick={() => updateSetting("alignH", val)}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </AlignButton>
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-3">Vertical</p>
            <div className="flex gap-2">
              {["top", "bottom"].map((val) => (
                <AlignButton
                  key={val}
                  active={settings.alignV === val}
                  disabled={!controlsEnabled}
                  onClick={() => updateSetting("alignV", val)}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </AlignButton>
              ))}
            </div>
          </div>

          {SLIDER_GROUPS.map((group) => (
            <div
              key={group.label}
              className="rounded-xl p-5"
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
              }}
            >
              <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">
                {group.label}
              </h2>
              {group.sliders.map((cfg) => (
                <SliderRow
                  key={cfg.key}
                  config={cfg}
                  value={settings[cfg.key]}
                  disabled={!controlsEnabled}
                  onChange={(val) => updateSetting(cfg.key, val)}
                />
              ))}
            </div>
          ))}
        </div>

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
                const isDefault = DEFAULT_SCOREBUG_SETTINGS[key] === val;
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
                      {key}
                    </div>
                    <div
                      className="text-sm font-bold font-mono truncate"
                      style={{
                        color: isDefault
                          ? "#8b949e"
                          : "var(--color-accent, #aacb32)",
                      }}
                    >
                      {String(val)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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

export default ScorebugSetup;
