import { useState, useEffect, useRef, useCallback } from "react";
import socketMatchService from "../umpireScoring/services/socketMatchService.js";

export const DEFAULT_SETTINGS = {
  fontGameScore: 130, // px  --font-game-score-lg
  fontSetScore: 80, // px  --font-score
  fontPlayerName: 36, // px  --display-player-name-size
  fontHeaderLabel: 35, // px  --font-3xl
  logoHeaderH: 100, // px  --display-logo-header-h
  logoCupH: 120, // px  --display-logo-cup-h
  logoTeamSize: 70, // px  --display-logo-team-size
  marginHVw: 5, // vw  --display-margin-h
  marginTopVh: 3, // vh  --display-margin-top
  courtNameSize: 20, // px  --display-court-name-size
  sponsorH: 80, // px  --display-sponsor-h
  headerPaddingVw: 5, // vw  --display-header-padding-h
};

export function applySettings(settings) {
  const root = document.documentElement;
  root.style.setProperty("--font-game-score-lg", settings.fontGameScore + "px");
  root.style.setProperty("--font-score", settings.fontSetScore + "px");
  root.style.setProperty(
    "--display-player-name-size",
    settings.fontPlayerName + "px",
  );
  root.style.setProperty("--font-3xl", settings.fontHeaderLabel + "px");
  root.style.setProperty(
    "--display-logo-header-h",
    settings.logoHeaderH + "px",
  );
  root.style.setProperty("--display-logo-cup-h", settings.logoCupH + "px");
  root.style.setProperty(
    "--display-logo-team-size",
    settings.logoTeamSize + "px",
  );
  root.style.setProperty("--display-margin-h", settings.marginHVw + "vw");
  root.style.setProperty("--display-margin-top", settings.marginTopVh + "vh");
  root.style.setProperty(
    "--display-court-name-size",
    settings.courtNameSize + "px",
  );
  root.style.setProperty("--display-sponsor-h", settings.sponsorH + "px");
  root.style.setProperty(
    "--display-header-padding-h",
    settings.headerPaddingVw + "vw",
  );
}

function getStorageKey(displayId) {
  return `playpro_display_settings_${displayId}`;
}

function getChannelName(displayId) {
  return `playpro_display_settings_${displayId}`;
}

function loadSettingsFromStorage(displayId) {
  try {
    const raw = localStorage.getItem(getStorageKey(displayId));
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettingsToStorage(displayId, settings) {
  try {
    localStorage.setItem(getStorageKey(displayId), JSON.stringify(settings));
  } catch {
    // quota exceeded or private mode — ignore
  }
}

function clearSettingsFromStorage(displayId) {
  localStorage.removeItem(getStorageKey(displayId));
}

const noop = () => {};

/**
 * useDisplaySettings
 *
 * listenOnly=false — master panel mode:
 *   returns { settings, updateSetting, resetSettings, isConnected }
 *
 * listenOnly=true — display screen mode:
 *   applies settings on mount, subscribes to socket + BroadcastChannel
 *   returns null
 */
export function useDisplaySettings({
  displayId = null,
  listenOnly = false,
} = {}) {
  const [settings, setSettings] = useState(() =>
    displayId ? loadSettingsFromStorage(displayId) : { ...DEFAULT_SETTINGS },
  );
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const applyAndPersist = useCallback(
    (next) => {
      applySettings(next);
      if (displayId) {
        saveSettingsToStorage(displayId, next);
      }
    },
    [displayId],
  );

  // Load cached settings when displayId changes
  useEffect(() => {
    if (!displayId) {
      applySettings(DEFAULT_SETTINGS);
      if (!listenOnly) {
        setSettings({ ...DEFAULT_SETTINGS });
      }
      return;
    }
    const cached = loadSettingsFromStorage(displayId);
    setSettings(cached);
    applySettings(cached);
  }, [displayId, listenOnly]);

  // BroadcastChannel — same-browser tab sync
  useEffect(() => {
    if (!displayId) return;

    const channel = new BroadcastChannel(getChannelName(displayId));
    channelRef.current = channel;
    channel.onmessage = (e) => {
      if (e.data && typeof e.data === "object") {
        applySettings(e.data);
        if (!listenOnly) {
          setSettings(e.data);
        }
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [displayId, listenOnly]);

  // Socket sync — cross-device
  useEffect(() => {
    if (!displayId) return;

    let cancelled = false;

    const setup = async () => {
      try {
        await socketMatchService.connect();
        if (cancelled) return;

        setIsConnected(socketMatchService.isConnected);

        const onUpdate = (data) => {
          if (data?.settings) {
            applyAndPersist(data.settings);
            if (!listenOnly) {
              setSettings(data.settings);
            }
          }
        };

        await socketMatchService.listenToDisplaySettings(displayId, onUpdate);

        const serverSettings =
          await socketMatchService.requestDisplaySettings(displayId);
        if (!cancelled && serverSettings) {
          applyAndPersist(serverSettings);
          if (!listenOnly) {
            setSettings(serverSettings);
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
      socketMatchService.stopListeningToDisplaySettings(displayId);
    };
  }, [displayId, listenOnly, applyAndPersist]);

  const updateSetting = useCallback(
    (key, value) => {
      if (!displayId) return;
      const next = { ...settingsRef.current, [key]: value };
      setSettings(next);
      applyAndPersist(next);
      channelRef.current?.postMessage(next);
      socketMatchService.emitUpdateDisplaySettings(displayId, next);
    },
    [displayId, applyAndPersist],
  );

  const resetSettings = useCallback(() => {
    if (!displayId) return;
    const next = { ...DEFAULT_SETTINGS };
    setSettings(next);
    applyAndPersist(next);
    clearSettingsFromStorage(displayId);
    channelRef.current?.postMessage(next);
    socketMatchService.emitUpdateDisplaySettings(displayId, next);
  }, [displayId, applyAndPersist]);

  if (listenOnly) return null;

  if (!displayId) {
    return {
      settings: { ...DEFAULT_SETTINGS },
      updateSetting: noop,
      resetSettings: noop,
      isConnected: false,
    };
  }

  return { settings, updateSetting, resetSettings, isConnected };
}

export default useDisplaySettings;
