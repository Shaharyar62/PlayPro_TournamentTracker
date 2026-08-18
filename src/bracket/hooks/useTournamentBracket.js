import { useCallback, useEffect, useRef, useState } from "react";
import Common from "../../helper/common";
import { BracketGraphBuilder } from "../utils/bracketGraphBuilder";
import { EMPTY_GRAPH } from "../models/tournamentBracketGraph";
import { hasContent, getImageUrl } from "../utils/bracketHelpers";

export function buildBracketFromDetails(details) {
  if (!details) {
    return {
      graph: EMPTY_GRAPH,
      scheduleImage: null,
      scheduleUrl: null,
      tournamentName: null,
      fingerprint: "",
    };
  }

  const matches = Array.isArray(details.matches) ? details.matches : [];
  const teams = Array.isArray(details.teams) ? details.teams : [];
  const isTeamOnly = Boolean(details.isTeamOnly);
  const fingerprint = BracketGraphBuilder.structureFingerprint(matches);

  const graph = BracketGraphBuilder.build({
    matches,
    teams,
    isTeamOnly,
  });

  return {
    graph,
    scheduleImage: hasContent(details.scheduleImage)
      ? getImageUrl(details.scheduleImage)
      : null,
    scheduleUrl: hasContent(details.scheduleUrl)
      ? String(details.scheduleUrl).trim()
      : null,
    tournamentName: details.name?.toString() ?? null,
    fingerprint,
    isTeamOnly,
    matches,
    teams,
  };
}

export function hasFixtureContent({ graph, scheduleImage, scheduleUrl }) {
  return !graph.isEmpty || scheduleImage != null || scheduleUrl != null;
}

export default function useTournamentBracket(tournamentId, { refreshInterval = 5 } = {}) {
  const [graph, setGraph] = useState(EMPTY_GRAPH);
  const [scheduleImage, setScheduleImage] = useState(null);
  const [scheduleUrl, setScheduleUrl] = useState(null);
  const [tournamentName, setTournamentName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fingerprintRef = useRef("");
  const graphRef = useRef(EMPTY_GRAPH);
  const metaRef = useRef({ teams: [], isTeamOnly: false });

  const applyDetails = useCallback((details, { isRefresh = false } = {}) => {
    const built = buildBracketFromDetails(details);

    if (
      isRefresh &&
      built.fingerprint &&
      built.fingerprint === fingerprintRef.current &&
      !graphRef.current.isEmpty
    ) {
      const updated = BracketGraphBuilder.updateMatchDataOnly({
        existing: graphRef.current,
        matches: built.matches,
        teams: built.teams,
        isTeamOnly: built.isTeamOnly,
      });
      graphRef.current = updated;
      setGraph(updated);
    } else {
      fingerprintRef.current = built.fingerprint;
      graphRef.current = built.graph;
      metaRef.current = {
        teams: built.teams,
        isTeamOnly: built.isTeamOnly,
      };
      setGraph(built.graph);
    }

    setScheduleImage(built.scheduleImage);
    setScheduleUrl(built.scheduleUrl);
    setTournamentName(built.tournamentName);
  }, []);

  const fetchDetails = useCallback(
    async (isRefresh = false) => {
      if (!tournamentId) {
        setError("Tournament ID is required");
        setLoading(false);
        return;
      }

      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        const response = await Common.ApiService.getInstance().request(
          `GetTournamentDetails?id=${tournamentId}`,
          null,
          "Get",
          false,
          false,
        );

        const details = response?.data?.[0];
        if (!details) {
          setError("No tournament data found");
          graphRef.current = EMPTY_GRAPH;
          fingerprintRef.current = "";
          setGraph(EMPTY_GRAPH);
          setScheduleImage(null);
          setScheduleUrl(null);
          setTournamentName(null);
          return;
        }

        applyDetails(details, { isRefresh });
      } catch (err) {
        setError(err.message || "Failed to fetch tournament details");
      } finally {
        setLoading(false);
      }
    },
    [tournamentId, applyDetails],
  );

  useEffect(() => {
    fingerprintRef.current = "";
    graphRef.current = EMPTY_GRAPH;
    fetchDetails(false);
  }, [fetchDetails]);

  useEffect(() => {
    if (!tournamentId || !refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(
      () => fetchDetails(true),
      refreshInterval * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [fetchDetails, refreshInterval, tournamentId]);

  return {
    graph,
    scheduleImage,
    scheduleUrl,
    tournamentName,
    loading,
    error,
    hasContent: hasFixtureContent({ graph, scheduleImage, scheduleUrl }),
    refetch: () => fetchDetails(true),
  };
}
