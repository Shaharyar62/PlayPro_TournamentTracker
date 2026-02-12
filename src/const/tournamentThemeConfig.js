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
  // "appt": { primary: "#093337", accent: "#aacb32", ... },
  // "pvc": { primary: "#003184", accent: "#A8CE08", ... },
};

/**
 * Get theme colors for a tournament ID.
 * @param {string|null|undefined} tournamentId - Tournament ID from URL
 * @returns {Object} Theme object with color values
 */
export function getThemeForTournament(tournamentId) {
  if (!tournamentId || !tournamentId.trim()) {
    return DEFAULT_THEME;
  }
  const theme =
    TOURNAMENT_THEMES[tournamentId] ||
    TOURNAMENT_THEMES[tournamentId.toLowerCase()];
  return theme ? { ...DEFAULT_THEME, ...theme } : DEFAULT_THEME;
}
