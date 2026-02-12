import { useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { getThemeForTournament } from "../const/tournamentThemeConfig";

const CSS_VAR_MAP = {
  primary: "--color-primary",
  primaryDark: "--color-primary-dark",
  accent: "--color-accent",
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
};

/**
 * Applies tournament-specific theme colors to document.
 * Reads tournamentId from URL params (searchParams or route params).
 */
export default function TournamentThemeProvider({ children }) {
  const [searchParams] = useSearchParams();
  const params = useParams();

  const tournamentId =
    searchParams.get("tournamentId") ||
    searchParams.get("masterTournamentId") ||
    params?.tournamentId ||
    null;

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
