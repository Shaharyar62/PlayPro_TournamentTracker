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
  // Score table only — live scoreboards do not read these
  fontScoreTableCategory: 36, // px  --display-score-table-category ("Open")
  fontScoreTableHeader: 18, // px  --display-score-table-header (Group / column labels)
  fontScoreTableTeam: 35, // px  --display-score-table-team
  fontScoreTableScore: 36, // px  --display-score-table-score
  fontScoreTableRank: 16, // px  --display-score-table-rank (1, 2, 3, 4)
};

function mergeSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const unpacked = unpackScoreTableSizes(merged.sponsorH);
  if (unpacked) {
    merged.fontScoreTableCategory = unpacked.fontScoreTableCategory;
    merged.fontScoreTableHeader = unpacked.fontScoreTableHeader;
    merged.fontScoreTableTeam = unpacked.fontScoreTableTeam;
    merged.fontScoreTableScore = unpacked.fontScoreTableScore;
  }
  const rank = unpackScoreTableRank(merged.headerPaddingVw);
  if (rank) merged.fontScoreTableRank = rank;
  return merged;
}

function nearestHalf(value) {
  return Math.round(value * 2) / 2;
}

// Rank size rides in the extra decimals of header padding (5.00028vw still
// lays out as 5vw). 0 means the rank was never set, so keep the default.
function unpackScoreTableRank(headerPaddingVw) {
  if (typeof headerPaddingVw !== "number" || !Number.isFinite(headerPaddingVw)) {
    return null;
  }
  const padding = nearestHalf(headerPaddingVw);
  const rank = Math.round((headerPaddingVw - padding) * 100000);
  if (rank <= 0 || rank > 999) return null;
  return rank;
}

// The settings socket only keeps the original numeric fields, so score-table
// sizes travel in the fractional part of sponsor height. 80.036018035036px
// still renders as 80px. An integer sponsor height means "use defaults".
function unpackScoreTableSizes(sponsorH) {
  if (typeof sponsorH !== "number" || !Number.isFinite(sponsorH)) return null;
  const micro = Math.round((sponsorH - Math.round(sponsorH)) * 1e12);
  if (micro <= 0) return null;
  return {
    fontScoreTableCategory: Math.floor(micro / 1e9),
    fontScoreTableHeader: Math.floor((micro % 1e9) / 1e6),
    fontScoreTableTeam: Math.floor((micro % 1e6) / 1e3),
    fontScoreTableScore: micro % 1e3,
  };
}

function packScoreTableSizes(settings) {
  const next = { ...settings };
  const base = Math.round(next.sponsorH);
  const atDefaults =
    next.fontScoreTableCategory === DEFAULT_SETTINGS.fontScoreTableCategory &&
    next.fontScoreTableHeader === DEFAULT_SETTINGS.fontScoreTableHeader &&
    next.fontScoreTableTeam === DEFAULT_SETTINGS.fontScoreTableTeam &&
    next.fontScoreTableScore === DEFAULT_SETTINGS.fontScoreTableScore;
  if (atDefaults) {
    next.sponsorH = base;
    return packScoreTableRank(next);
  }
  const cat = next.fontScoreTableCategory;
  const header = next.fontScoreTableHeader;
  const team = next.fontScoreTableTeam;
  const score = next.fontScoreTableScore;
  next.sponsorH = base + cat / 1000 + header / 1e6 + team / 1e9 + score / 1e12;
  return packScoreTableRank(next);
}

function packScoreTableRank(settings) {
  const next = { ...settings };
  const padding = nearestHalf(next.headerPaddingVw);
  if (next.fontScoreTableRank === DEFAULT_SETTINGS.fontScoreTableRank) {
    next.headerPaddingVw = padding;
    return next;
  }
  next.headerPaddingVw = padding + next.fontScoreTableRank / 100000;
  return next;
}

export function applySettings(settings) {
  const s = mergeSettings(settings);
  const root = document.documentElement;
  root.style.setProperty("--font-game-score-lg", s.fontGameScore + "px");
  root.style.setProperty("--font-score", s.fontSetScore + "px");
  root.style.setProperty("--display-player-name-size", s.fontPlayerName + "px");
  root.style.setProperty("--font-3xl", s.fontHeaderLabel + "px");
  root.style.setProperty("--display-logo-header-h", s.logoHeaderH + "px");
  root.style.setProperty("--display-logo-cup-h", s.logoCupH + "px");
  root.style.setProperty("--display-logo-team-size", s.logoTeamSize + "px");
  root.style.setProperty("--display-margin-h", s.marginHVw + "vw");
  root.style.setProperty("--display-margin-top", s.marginTopVh + "vh");
  root.style.setProperty("--display-court-name-size", s.courtNameSize + "px");
  root.style.setProperty("--display-sponsor-h", Math.round(s.sponsorH) + "px");
  root.style.setProperty(
    "--display-header-padding-h",
    nearestHalf(s.headerPaddingVw) + "vw",
  );
  root.style.setProperty(
    "--display-score-table-rank",
    s.fontScoreTableRank + "px",
  );
  root.style.setProperty(
    "--display-score-table-category",
    s.fontScoreTableCategory + "px",
  );
  root.style.setProperty(
    "--display-score-table-header",
    s.fontScoreTableHeader + "px",
  );
  root.style.setProperty(
    "--display-score-table-team",
    s.fontScoreTableTeam + "px",
  );
  root.style.setProperty(
    "--display-score-table-score",
    s.fontScoreTableScore + "px",
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
      const merged = mergeSettings(next);
      applySettings(merged);
      if (displayId) {
        saveSettingsToStorage(displayId, merged);
      }
      return merged;
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
        const merged = mergeSettings(e.data);
        applySettings(merged);
        if (!listenOnly) {
          setSettings(merged);
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
            const merged = applyAndPersist(data.settings);
            if (!listenOnly) {
              setSettings(merged);
            }
          }
        };

        await socketMatchService.listenToDisplaySettings(displayId, onUpdate);

        const serverSettings =
          await socketMatchService.requestDisplaySettings(displayId);
        if (!cancelled && serverSettings) {
          const merged = applyAndPersist(serverSettings);
          if (!listenOnly) {
            setSettings(merged);
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
      const next = packScoreTableSizes({
        ...settingsRef.current,
        [key]: value,
      });
      settingsRef.current = next;
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
