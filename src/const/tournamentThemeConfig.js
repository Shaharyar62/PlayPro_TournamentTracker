/**
 * Tournament Theme Configuration
 * Maps tournamentId to color overrides.
 * Add new tournaments by adding entries to TOURNAMENT_THEMES.
 */

const DEFAULT_THEME = {
  primary: "#093337",
  primaryDark: "#061f22",
  accent: "#aacb32",
  background: "#2b2b8a",
  backgroundStart: "#093337",
  backgroundEnd: "#093337",
  backgroundMid: "#2e7ebb",
  primaryBlue: "#003184",
  button: "#265cb6",
  link: "#646cff",
  linkHover: "#535bf2",
  success: "#16a34a",
  warning: "#ca8a04",
  danger: "#dc2626",
  bodyBg: "#2b2b8a",
  statusBar: "#1e40af",
  // ScoreTable gradient colors
  gradientPrimary: "#2e55b9",
  gradientAccent: "#67b3fd",
};

export const TOURNAMENT_THEMES = {
  default: DEFAULT_THEME,
  // Add tournament-specific themes here:
  46: {
    primary: "green",
    accent: "#2e55b9",
    background: "red",
    backgroundStart: "#red",
    backgroundEnd: "red",
    backgroundMid: "#red",
    primaryBlue: "#2c2c2c",
    button: "#red",
    link: "red",
    linkHover: "#red",
    success: "#red",
    warning: "#red",
    danger: "#red",
    bodyBg: "#red",
    statusBar: "#red",
  },
  52: {
    primary: "#0d57a7",
    primaryDark: "#0d57a7",
    accent: "#0d57a7",
    background: "#0d57a7",
    backgroundStart: "#093337",
    backgroundEnd: "#093337",
    backgroundMid: "#2e7ebb",
    primaryBlue: "#003184",
    button: "#265cb6",
    link: "#646cff",
    linkHover: "#535bf2",
    success: "#16a34a",
    warning: "#ca8a04",
    danger: "#dc2626",
    bodyBg: "#2b2b8a",
    statusBar: "#000000",
    gradientPrimary: "#0d57a7",
    gradientAccent: "#3d8fd9",
  },
  53: {
    primary: "#0d57a7",
    primaryDark: "#0d57a7",
    accent: "#0d57a7",
    background: "#0d57a7",
    backgroundStart: "#093337",
    backgroundEnd: "#093337",
    backgroundMid: "#2e7ebb",
    primaryBlue: "#003184",
    button: "#265cb6",
    link: "#646cff",
    linkHover: "#535bf2",
    success: "#16a34a",
    warning: "#ca8a04",
    danger: "#dc2626",
    bodyBg: "#2b2b8a",
    statusBar: "#000000",
    gradientPrimary: "#0d57a7",
    gradientAccent: "#3d8fd9",
  },
  57: {
    primary: "#cccccc",
    primaryDark: "#cccccc",
    accent: "#0d57a7",
    background: "#0d57a7",
    backgroundStart: "#093337",
    backgroundEnd: "#093337",
    backgroundMid: "#2e7ebb",
    primaryBlue: "#003184",
    button: "#265cb6",
    link: "#646cff",
    linkHover: "#535bf2",
    success: "#16a34a",
    warning: "#ca8a04",
    danger: "#dc2626",
    bodyBg: "#2b2b8a",
    statusBar: "#000000",
    gradientPrimary: "#0d57a7",
    gradientAccent: "#3d8fd9",
  },
  67: {
    primary: "#0d57a7",
    primaryDark: "#0d57a7",
    accent: "#0d57a7",
    background: "#0d57a7",
    backgroundStart: "#093337",
    backgroundEnd: "#093337",
    backgroundMid: "#2e7ebb",
    primaryBlue: "#003184",
    button: "#265cb6",
    link: "#646cff",
    linkHover: "#535bf2",
    success: "#16a34a",
    warning: "#ca8a04",
    danger: "#dc2626",
    bodyBg: "#2b2b8a",
    statusBar: "#fff",
    gradientPrimary: "#0d57a7",
    gradientAccent: "#3d8fd9",
  },
  // "appt": { primary: "#093337", accent: "#aacb32", ... },
  // "pvc": { primary: "#003184", accent: "#A8CE08", ... },
};

/**
 * Get theme colors for a tournament ID.
 * @param {string|number|null|undefined} tournamentId - Tournament ID from URL
 * @returns {Object} Theme object with color values
 */
export function getThemeForTournament(tournamentId) {
  if (tournamentId == null || tournamentId === "") {
    return DEFAULT_THEME;
  }
  const id =
    typeof tournamentId === "string" ? tournamentId : String(tournamentId);
  const theme =
    TOURNAMENT_THEMES[tournamentId] ||
    TOURNAMENT_THEMES[id] ||
    TOURNAMENT_THEMES[id.toLowerCase?.()];
  return theme ? { ...DEFAULT_THEME, ...theme } : DEFAULT_THEME;
}
