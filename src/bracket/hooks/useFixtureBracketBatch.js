import { useCallback, useEffect, useRef, useState } from "react";
import Common from "../../helper/common";
import { BracketGraphBuilder } from "../utils/bracketGraphBuilder";
import { EMPTY_GRAPH } from "../models/tournamentBracketGraph";
import {
  buildAllBracketsFromScheduleResponse,
  scheduleResponseHasTournamentIds,
} from "../utils/scheduleMatchesAdapter";
import {
  buildBracketFromDetails,
  hasFixtureContent,
} from "../utils/bracketDetailsBuilder";

const EMPTY_BRACKET_STATE = {
  graph: EMPTY_GRAPH,
  scheduleImage: null,
  scheduleUrl: null,
  tournamentName: null,
  hasContent: false,
};

function applyRefreshUpdate(cacheRef, fingerprintsRef, builtMap) {
  const next = new Map(cacheRef.current);

  for (const [tournamentId, built] of builtMap.entries()) {
    const existing = next.get(tournamentId);
    const prevFingerprint = fingerprintsRef.current.get(tournamentId) ?? "";

    if (
      existing &&
      built.fingerprint &&
      built.fingerprint === prevFingerprint &&
      !existing.graph.isEmpty
    ) {
      const updatedGraph = BracketGraphBuilder.updateMatchDataOnly({
        existing: existing.graph,
        matches: built.matches,
        teams: built.teams,
        isTeamOnly: built.isTeamOnly,
      });

      next.set(tournamentId, {
        graph: updatedGraph,
        scheduleImage: built.scheduleImage,
        scheduleUrl: built.scheduleUrl,
        tournamentName: built.tournamentName,
        fingerprint: built.fingerprint,
        isTeamOnly: built.isTeamOnly,
        matches: built.matches,
        teams: built.teams,
        hasContent: hasFixtureContent({
          graph: updatedGraph,
          scheduleImage: built.scheduleImage,
          scheduleUrl: built.scheduleUrl,
        }),
      });
    } else {
      next.set(tournamentId, {
        ...built,
        hasContent: hasFixtureContent(built),
      });
    }

    fingerprintsRef.current.set(tournamentId, built.fingerprint ?? "");
  }

  cacheRef.current = next;
  return next;
}

export default function useFixtureBracketBatch(
  tournamentIds,
  { refreshInterval = 5 } = {},
) {
  const [cacheVersion, setCacheVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheRef = useRef(new Map());
  const fingerprintsRef = useRef(new Map());
  const tournamentIdsKey = tournamentIds.join(",");

  const bumpCache = useCallback(() => {
    setCacheVersion((v) => v + 1);
  }, []);

  const fetchLegacyDetails = useCallback(async () => {
    const entries = await Promise.all(
      tournamentIds.map(async (tournamentId) => {
        const response = await Common.ApiService.getInstance().request(
          `GetTournamentDetails?id=${tournamentId}`,
          null,
          "Get",
          false,
          false,
        );
        const details = response?.data?.[0];
        const built = buildBracketFromDetails(details);
        return [
          tournamentId,
          {
            ...built,
            hasContent: hasFixtureContent(built),
          },
        ];
      }),
    );

    cacheRef.current = new Map(entries);
    for (const [tournamentId, built] of entries) {
      fingerprintsRef.current.set(tournamentId, built.fingerprint ?? "");
    }
    bumpCache();
  }, [tournamentIds, bumpCache]);

  const fetchBatch = useCallback(
    async (isRefresh = false) => {
      if (!tournamentIds.length) {
        setError("Tournament IDs are required");
        setLoading(false);
        return;
      }

      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        const response = await Common.ApiService.getInstance().request(
          "GetTournamentScheduleMatches",
          {
            tournamentIds,
            applyVisibilityFilter: true,
          },
          "POST",
          false,
          false,
        );

        const matches = response?.data;
        if (!Array.isArray(matches)) {
          setError("No tournament schedule data found");
          cacheRef.current = new Map();
          fingerprintsRef.current = new Map();
          bumpCache();
          return;
        }

        if (!scheduleResponseHasTournamentIds(matches)) {
          console.warn(
            "[Fixture] GetTournamentScheduleMatches missing tournamentId; falling back to GetTournamentDetails",
          );
          await fetchLegacyDetails();
          return;
        }

        const builtMap = buildAllBracketsFromScheduleResponse(
          matches,
          tournamentIds,
        );
        applyRefreshUpdate(cacheRef, fingerprintsRef, builtMap);
        bumpCache();
      } catch (err) {
        setError(err.message || "Failed to fetch tournament schedule");
      } finally {
        setLoading(false);
      }
    },
    [tournamentIds, fetchLegacyDetails, bumpCache],
  );

  useEffect(() => {
    cacheRef.current = new Map();
    fingerprintsRef.current = new Map();
    fetchBatch(false);
  }, [fetchBatch, tournamentIdsKey]);

  useEffect(() => {
    if (!tournamentIds.length || !refreshInterval || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(
      () => fetchBatch(true),
      refreshInterval * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [fetchBatch, refreshInterval, tournamentIds.length, tournamentIdsKey]);

  const getBracketState = useCallback(
    (tournamentId) => {
      if (!tournamentId) return EMPTY_BRACKET_STATE;
      void cacheVersion;
      return cacheRef.current.get(tournamentId) ?? EMPTY_BRACKET_STATE;
    },
    [cacheVersion],
  );

  const hasAnyContent = useCallback(() => {
    void cacheVersion;
    for (const state of cacheRef.current.values()) {
      if (state.hasContent) return true;
    }
    return false;
  }, [cacheVersion]);

  return {
    getBracketState,
    loading,
    error,
    hasAnyContent: hasAnyContent(),
    refetch: () => fetchBatch(true),
  };
}
