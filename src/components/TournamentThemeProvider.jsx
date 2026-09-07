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
  scheduleCategoryBg: "--color-schedule-category-bg",
  courtNameText: "--color-court-name-text",
  scoreTableBodyBg: "--color-score-table-body-bg",
  scoreTableRowChampionBg: "--color-score-row-champion-bg",
  scoreTableRowQualifiedBg: "--color-score-row-qualified-bg",
  scoreTableRowDefaultBg: "--color-score-row-default-bg",
  scoreTableRowHoverBg: "--color-score-row-hover-bg",
  scoreTableCardHeaderBg: "--color-score-table-card-header-bg",
  scoreTableCardHeaderColsBg: "--color-score-table-card-header-cols-bg",
  scoreTableGlass: "--score-table-glass",
  scoreTableGlassBg: "--color-score-table-glass-bg",
  scoreTableGlassBlur: "--score-table-glass-blur",
  scoreTableHeaderBlur: "--score-table-header-blur",
  cardOutline: "--color-card-outline",
  cardShadow: "--color-card-shadow",
};

function getHeaderTintColor(theme) {
  const header = theme?.scoreTableCardHeaderBg || theme?.accent || "";
  const hex = String(header).match(/#(?:[0-9a-fA-F]{3,8})/);
  return hex ? hex[0] : theme?.accent || "";
}

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

    if (tournamentId != null && tournamentId !== "") {
      root.dataset.tournamentTheme = String(tournamentId);
    } else {
      delete root.dataset.tournamentTheme;
    }

    Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
      const value = theme[key];
      if (value) {
        root.style.setProperty(cssVar, value);
      }
    });

    const tint = getHeaderTintColor(theme);
    if (tint) {
      root.style.setProperty("--color-set-score-tint", tint);
    }
  }, [tournamentId]);

  return children;
}
