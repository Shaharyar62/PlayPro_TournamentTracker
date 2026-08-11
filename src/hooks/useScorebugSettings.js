import { useState, useEffect, useRef, useCallback } from "react";
import socketMatchService from "../umpireScoring/services/socketMatchService.js";

export const DEFAULT_SCOREBUG_SETTINGS = {
  accentColor: "#015d9c",
  serveIndicatorColor: "#38bdf8",
  panelBg: "#0b1220",
  textColor: "#ffffff",
  mutedTextColor: "#9ca3af",
  fontName: 28,
  fontSet: 36,
  fontPoints: 42,
  widthPx: 920,
  offsetX: 0,
  offsetY: 24,
  alignH: "center",
  alignV: "top",
  skewDeg: 12,
};

const SCOREBUG_SETTING_KEYS = Object.keys(DEFAULT_SCOREBUG_SETTINGS);

export function toScorebugWireId(displayId) {
  if (!displayId) return null;
  const trimmed = displayId.toString().trim();
  if (!trimmed) return null;
  return trimmed.startsWith("scorebug-") ? trimmed : `scorebug-${trimmed}`;
}

export function isScorebugSettings(obj) {
  if (!obj || typeof obj !== "object") return false;
  return SCOREBUG_SETTING_KEYS.some((key) => key in obj);
}

export function applyScorebugSettings(settings) {
  const root = document.documentElement;
  root.style.setProperty("--sb-accent", settings.accentColor);
  root.style.setProperty(
    "--sb-serve",
    settings.serveIndicatorColor ?? settings.accentColor,
  );
  root.style.setProperty("--sb-panel-bg", settings.panelBg);
  root.style.setProperty("--sb-text", settings.textColor);
  root.style.setProperty("--sb-muted", settings.mutedTextColor);
  root.style.setProperty("--sb-font-name", `${settings.fontName}px`);
  root.style.setProperty("--sb-font-set", `${settings.fontSet}px`);
  root.style.setProperty("--sb-font-points", `${settings.fontPoints}px`);
  root.style.setProperty("--sb-width", `${settings.widthPx}px`);
  root.style.setProperty("--sb-translate-x", `${settings.offsetX}px`);
  root.style.setProperty("--sb-skew", `${settings.skewDeg}deg`);
  root.style.setProperty(
    "--sb-pad-top",
    settings.alignV === "bottom" ? "0px" : `${settings.offsetY}px`,
  );
  root.style.setProperty(
    "--sb-pad-bottom",
    settings.alignV === "bottom" ? `${settings.offsetY}px` : "0px",
  );
  root.style.setProperty(
    "--sb-justify",
    settings.alignH === "left"
      ? "flex-start"
      : settings.alignH === "right"
        ? "flex-end"
        : "center",
  );
  root.style.setProperty(
    "--sb-align-items",
    settings.alignV === "bottom" ? "flex-end" : "flex-start",
  );
}

function getStorageKey(wireId) {
  return `playpro_scorebug_settings_${wireId}`;
}

function getChannelName(wireId) {
  return `playpro_scorebug_settings_${wireId}`;
}

function loadSettingsFromStorage(wireId) {
  try {
    const raw = localStorage.getItem(getStorageKey(wireId));
    if (raw) {
      return { ...DEFAULT_SCOREBUG_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SCOREBUG_SETTINGS };
}

function saveSettingsToStorage(wireId, settings) {
  try {
    localStorage.setItem(getStorageKey(wireId), JSON.stringify(settings));
    localStorage.setItem(`${getStorageKey(wireId)}_ts`, String(Date.now()));
  } catch {
    // quota exceeded or private mode — ignore
  }
}

function clearSettingsFromStorage(wireId) {
  localStorage.removeItem(getStorageKey(wireId));
  localStorage.removeItem(`${getStorageKey(wireId)}_ts`);
}

function extractScorebugSettings(data, base = DEFAULT_SCOREBUG_SETTINGS) {
  if (!data || typeof data !== "object") return null;

  const candidate = data.settings ?? data;
  if (!isScorebugSettings(candidate)) return null;

  return { ...base, ...candidate };
}

const noop = () => {};

/**
 * useScorebugSettings
 *
 * listenOnly=false — setup panel (master): localStorage is source of truth, pushes to socket
 * listenOnly=true  — overlay: listens to socket + storage sync
 */
export function useScorebugSettings({
  displayId = null,
  listenOnly = false,
} = {}) {
  const wireId = toScorebugWireId(displayId);

  const [settings, setSettings] = useState(() =>
    wireId ? loadSettingsFromStorage(wireId) : { ...DEFAULT_SCOREBUG_SETTINGS },
  );
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef(null);
  const settingsRef = useRef(settings);
  const ignorePollRef = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const applyAndPersist = useCallback(
    (next, { skipSave = false } = {}) => {
      applyScorebugSettings(next);
      if (wireId && !skipSave) {
        ignorePollRef.current = true;
        saveSettingsToStorage(wireId, next);
        setTimeout(() => {
          ignorePollRef.current = false;
        }, 500);
      }
    },
    [wireId],
  );

  useEffect(() => {
    if (!wireId) {
      applyScorebugSettings(DEFAULT_SCOREBUG_SETTINGS);
      if (!listenOnly) {
        setSettings({ ...DEFAULT_SCOREBUG_SETTINGS });
      }
      return;
    }
    const cached = loadSettingsFromStorage(wireId);
    setSettings(cached);
    applyScorebugSettings(cached);
  }, [wireId, listenOnly]);

  useEffect(() => {
    if (!wireId) return;

    const channel = new BroadcastChannel(getChannelName(wireId));
    channelRef.current = channel;

    channel.onmessage = (e) => {
      const next = extractScorebugSettings(e.data, settingsRef.current);
      if (!next) return;
      applyScorebugSettings(next);
      if (!listenOnly) {
        setSettings(next);
      }
    };

    const onStorage = (e) => {
      if (e.key !== getStorageKey(wireId) || !e.newValue) return;
      try {
        const next = extractScorebugSettings(
          JSON.parse(e.newValue),
          settingsRef.current,
        );
        if (!next) return;
        applyScorebugSettings(next);
        if (!listenOnly) {
          setSettings(next);
        }
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      channel.close();
      channelRef.current = null;
      window.removeEventListener("storage", onStorage);
    };
  }, [wireId, listenOnly]);

  // Overlay only: poll localStorage for same-browser setup changes
  useEffect(() => {
    if (!wireId || !listenOnly) return;

    let lastTs = localStorage.getItem(`${getStorageKey(wireId)}_ts`) ?? "";

    const poll = setInterval(() => {
      if (ignorePollRef.current) return;
      const ts = localStorage.getItem(`${getStorageKey(wireId)}_ts`) ?? "";
      if (ts && ts !== lastTs) {
        lastTs = ts;
        const next = loadSettingsFromStorage(wireId);
        applyScorebugSettings(next);
      }
    }, 400);

    return () => clearInterval(poll);
  }, [wireId, listenOnly]);

  useEffect(() => {
    if (!wireId) return;

    let cancelled = false;

    const setup = async () => {
      try {
        await socketMatchService.connect();
        if (cancelled) return;

        setIsConnected(socketMatchService.isConnected);

        // Setup page is master — do NOT listen to socket echoes (TV settings were resetting scorebug)
        if (listenOnly) {
          const onUpdate = (data) => {
            const next = extractScorebugSettings(data, settingsRef.current);
            if (!next) return;
            applyAndPersist(next);
          };

          await socketMatchService.listenToDisplaySettings(wireId, onUpdate);

          const serverSettings =
            await socketMatchService.requestDisplaySettings(wireId);
          if (
            !cancelled &&
            serverSettings &&
            isScorebugSettings(serverSettings)
          ) {
            const cached = loadSettingsFromStorage(wireId);
            const hasLocal =
              localStorage.getItem(getStorageKey(wireId)) !== null;
            const next = hasLocal
              ? cached
              : { ...DEFAULT_SCOREBUG_SETTINGS, ...serverSettings };
            applyAndPersist(next);
          }
        }
      } catch {
        if (!cancelled) {
          setIsConnected(false);
        }
      }
    };

    setup();

    const interval = setInterval(() => {
      setIsConnected(socketMatchService.isConnected);
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (listenOnly) {
        socketMatchService.stopListeningToDisplaySettings(wireId);
      }
    };
  }, [wireId, listenOnly, applyAndPersist]);

  const updateSetting = useCallback(
    (key, value) => {
      if (!wireId) return;
      const next = { ...settingsRef.current, [key]: value };
      setSettings(next);
      applyAndPersist(next);
      channelRef.current?.postMessage(next);
      socketMatchService.emitUpdateDisplaySettings(wireId, next);
    },
    [wireId, applyAndPersist],
  );

  const resetSettings = useCallback(() => {
    if (!wireId) return;
    const next = { ...DEFAULT_SCOREBUG_SETTINGS };
    setSettings(next);
    applyAndPersist(next);
    clearSettingsFromStorage(wireId);
    channelRef.current?.postMessage(next);
    socketMatchService.emitUpdateDisplaySettings(wireId, next);
  }, [wireId, applyAndPersist]);

  if (listenOnly) return null;

  if (!wireId) {
    return {
      settings: { ...DEFAULT_SCOREBUG_SETTINGS },
      updateSetting: noop,
      resetSettings: noop,
      isConnected: false,
      wireId: null,
    };
  }

  return { settings, updateSetting, resetSettings, isConnected, wireId };
}

export default useScorebugSettings;
