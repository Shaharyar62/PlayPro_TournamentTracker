import { useState, useEffect, useCallback } from "react";
import { useUmpire } from "../context/UmpireContext";
import { umpireAPI } from "../services/umpireAPI";

/**
 * Custom hook for managing umpire data operations
 * Provides data fetching, caching, and synchronization with the API
 */
export const useUmpireData = () => {
  const {
    currentCourt,
    matches,
    currentMatch,
    isAuthenticated,
    updateScore,
    startMatch,
    endMatch,
  } = useUmpire();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Fetch matches for current court
  const fetchMatches = useCallback(async (courtId) => {
    if (!courtId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await umpireAPI.getMatchesForCourt(courtId);

      if (response.success) {
        setLastSync(new Date());
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch matches");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching matches:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync score updates with API
  const syncScore = useCallback(
    async (matchId, scores) => {
      try {
        const response = await umpireAPI.updateMatchScore(matchId, scores);

        if (response.success) {
          updateScore(matchId, scores);
          return { success: true };
        } else {
          throw new Error(response.message || "Failed to sync score");
        }
      } catch (err) {
        console.error("Error syncing score:", err);
        return { success: false, error: err.message };
      }
    },
    [updateScore]
  );

  // Start match and sync with API
  const startMatchSync = useCallback(
    async (matchId) => {
      try {
        const response = await umpireAPI.startMatch(matchId);

        if (response.success) {
          startMatch(matchId);
          return { success: true };
        } else {
          throw new Error(response.message || "Failed to start match");
        }
      } catch (err) {
        console.error("Error starting match:", err);
        return { success: false, error: err.message };
      }
    },
    [startMatch]
  );

  // End match and sync with API
  const endMatchSync = useCallback(
    async (matchId, finalScores) => {
      try {
        const response = await umpireAPI.endMatch(matchId, finalScores);

        if (response.success) {
          endMatch(matchId, finalScores);
          return { success: true };
        } else {
          throw new Error(response.message || "Failed to end match");
        }
      } catch (err) {
        console.error("Error ending match:", err);
        return { success: false, error: err.message };
      }
    },
    [endMatch]
  );

  // Auto-refresh matches periodically
  useEffect(() => {
    if (!isAuthenticated || !currentCourt) return;

    const interval = setInterval(() => {
      fetchMatches(currentCourt.id);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, currentCourt, fetchMatches]);

  // Get match statistics
  const getMatchStats = useCallback(() => {
    if (!matches) return { total: 0, upcoming: 0, live: 0, completed: 0 };

    return {
      total: matches.length,
      upcoming: matches.filter((m) => m.status === "upcoming").length,
      live: matches.filter((m) => m.status === "live").length,
      completed: matches.filter((m) => m.status === "completed").length,
    };
  }, [matches]);

  // Get next match
  const getNextMatch = useCallback(() => {
    if (!matches) return null;

    const upcomingMatches = matches
      .filter((m) => m.status === "upcoming")
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

    return upcomingMatches[0] || null;
  }, [matches]);

  // Get current live match
  const getCurrentLiveMatch = useCallback(() => {
    if (!matches) return null;

    return matches.find((m) => m.status === "live") || null;
  }, [matches]);

  // Check if court is available
  const isCourtAvailable = useCallback(() => {
    const liveMatch = getCurrentLiveMatch();
    return !liveMatch;
  }, [getCurrentLiveMatch]);

  // Get match by ID
  const getMatchById = useCallback(
    (matchId) => {
      if (!matches) return null;
      return matches.find((m) => m.id === matchId) || null;
    },
    [matches]
  );

  // Validate score update
  const validateScoreUpdate = useCallback((scores) => {
    if (!scores || !scores.teamA || !scores.teamB) {
      return { valid: false, error: "Invalid score format" };
    }

    // Add validation logic here
    // Check for valid point values, set progression, etc.

    return { valid: true };
  }, []);

  // Get time until next match
  const getTimeUntilNextMatch = useCallback(() => {
    const nextMatch = getNextMatch();
    if (!nextMatch) return null;

    const now = new Date();
    const matchTime = new Date(nextMatch.scheduledTime);
    const diff = matchTime - now;

    if (diff <= 0) return { overdue: true, match: nextMatch };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      overdue: false,
      hours,
      minutes,
      match: nextMatch,
      totalMinutes: Math.floor(diff / (1000 * 60)),
    };
  }, [getNextMatch]);

  return {
    // Data
    matches,
    currentMatch,
    currentCourt,
    isAuthenticated,

    // State
    loading,
    error,
    lastSync,

    // Actions
    fetchMatches,
    syncScore,
    startMatchSync,
    endMatchSync,

    // Utilities
    getMatchStats,
    getNextMatch,
    getCurrentLiveMatch,
    isCourtAvailable,
    getMatchById,
    validateScoreUpdate,
    getTimeUntilNextMatch,

    // Clear error
    clearError: () => setError(null),
  };
};

export default useUmpireData;
