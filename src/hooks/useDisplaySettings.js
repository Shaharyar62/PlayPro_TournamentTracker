import { useState, useEffect, useRef } from "react";

const CHANNEL_NAME = "playpro_display_settings";
const STORAGE_KEY = "playpro_display_settings";

export const DEFAULT_SETTINGS = {
  fontGameScore: 130,   // px  --font-game-score-lg
  fontSetScore: 80,     // px  --font-score
  fontPlayerName: 36,   // px  --display-player-name-size
  fontHeaderLabel: 35,  // px  --font-3xl
  logoHeaderH: 100,     // px  --display-logo-header-h
  logoCupH: 120,        // px  --display-logo-cup-h
  logoTeamSize: 70,     // px  --display-logo-team-size
  marginHVw: 5,         // vw  --display-margin-h
  marginTopVh: 3,       // vh  --display-margin-top
  courtNameSize: 20,    // px  --display-court-name-size
  sponsorH: 80,         // px  --display-sponsor-h
  headerPaddingVw: 5,   // vw  --display-header-padding-h
};

export function applySettings(settings) {
  const root = document.documentElement;
  root.style.setProperty("--font-game-score-lg", settings.fontGameScore + "px");
  root.style.setProperty("--font-score", settings.fontSetScore + "px");
  root.style.setProperty("--display-player-name-size", settings.fontPlayerName + "px");
  root.style.setProperty("--font-3xl", settings.fontHeaderLabel + "px");
  root.style.setProperty("--display-logo-header-h", settings.logoHeaderH + "px");
  root.style.setProperty("--display-logo-cup-h", settings.logoCupH + "px");
  root.style.setProperty("--display-logo-team-size", settings.logoTeamSize + "px");
  root.style.setProperty("--display-margin-h", settings.marginHVw + "vw");
  root.style.setProperty("--display-margin-top", settings.marginTopVh + "vh");
  root.style.setProperty("--display-court-name-size", settings.courtNameSize + "px");
  root.style.setProperty("--display-sponsor-h", settings.sponsorH + "px");
  root.style.setProperty("--display-header-padding-h", settings.headerPaddingVw + "vw");
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * useDisplaySettings
 *
 * listenOnly=false (default) — master panel mode:
 *   returns { settings, updateSetting, resetSettings }
 *   broadcasts changes via BroadcastChannel and persists to localStorage
 *
 * listenOnly=true — display screen mode:
 *   applies stored settings on mount, then subscribes to BroadcastChannel
 *   returns nothing meaningful
 */
export function useDisplaySettings(listenOnly = false) {
  const [settings, setSettings] = useState(loadSettings);
  const channelRef = useRef(null);

  // Initialise BroadcastChannel once
  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current.onmessage = (e) => {
      if (e.data && typeof e.data === "object") {
        applySettings(e.data);
        if (!listenOnly) {
          setSettings(e.data);
        }
      }
    };
    return () => {
      channelRef.current?.close();
    };
  }, [listenOnly]);

  // Apply on mount (picks up persisted settings)
  useEffect(() => {
    applySettings(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applySettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // quota exceeded or private mode — ignore
    }
    channelRef.current?.postMessage(next);
  };

  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    applySettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    channelRef.current?.postMessage(DEFAULT_SETTINGS);
  };

  if (listenOnly) return null;
  return { settings, updateSetting, resetSettings };
}

export default useDisplaySettings;
