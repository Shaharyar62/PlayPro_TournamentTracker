import { useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { getThemeForTournament } from "../const/tournamentThemeConfig";

const CSS_VAR_MAP = {
  primary: "--color-primary",
  primaryDark: "--color-primary-dark",
  accent: "--color-accent",
  accentText: "--color-accent-text",
  background: "--color-background",
  backgroundStart: "--color-background-start",
  backgroundEnd: "--color-background-end",
  backgroundMid: "--color-background-mid",
  primaryBlue: "--color-primary-blue",
  button: "--color-button",
  link: "--color-link",
  linkHover: "--color-link-hover",
  success: "--color-success",
  warning: "--color-warning",
  danger: "--color-danger",
  bodyBg: "--color-body-bg",
  statusBar: "--color-status-bar",
  gradientPrimary: "--color-gradient-primary",
  gradientAccent: "--color-gradient-accent",
  gradientText: "--color-gradient-text",
  todayMatchText: "--color-today-match-text",
  titleText: "--color-title-text",
  sponsorBarBg: "--color-sponsor-bar-bg",
  scheduleTitleText: "--color-schedule-title-text",
  scheduleMatchText: "--color-schedule-match-text",
};

/**
 * Applies tournament-specific theme colors to document.
 * Reads tournamentId from URL params (searchParams or route params).
 */
export default function TournamentThemeProvider({ children }) {
  const [searchParams] = useSearchParams();
  const params = useParams();

  // Support tournamentId, masterTournamentId, or first ID from tournamentIds (for ScoreTable)
  // themeId overrides theme/images while tournamentId is used for API data
  let tournamentId =
    searchParams.get("themeId") ||
    searchParams.get("tournamentId") ||
    searchParams.get("masterTournamentId") ||
    params?.tournamentId ||
    null;

  if (!tournamentId && searchParams.get("tournamentIds")) {
    try {
      const parsed = JSON.parse(searchParams.get("tournamentIds"));
      tournamentId = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      const csv = searchParams.get("tournamentIds").split(",").map((id) => id.trim())[0];
      tournamentId = csv || null;
    }
  }

  useEffect(() => {
    const theme = getThemeForTournament(tournamentId);
    const root = document.documentElement;

    Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
      const value = theme[key];
      if (value) {
        root.style.setProperty(cssVar, value);
      }
    });
  }, [tournamentId]);

  return children;
}
