import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "./useSocket.js";
import {
  formatElapsedTime,
  computeElapsedSeconds,
} from "../utils/matchTimerUtils.js";

/**
 * Custom hook for match duration timer (count-up)
 * Syncs with WebSocket - server is source of truth.
 *
 * @param {string} matchId - Match ID
 * @param {string} tournamentId - Tournament ID
 * @param {Object|null} matchTimer - Timer state from matchState (server)
 * @param {boolean} isMatchComplete - Whether match is completed
 * @returns {Object} Timer state and controls
 */
export function useMatchTimer(matchId, tournamentId, matchTimer, isMatchComplete) {
  const { socketService } = useSocket();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef(null);

  const status = matchTimer?.status || "stopped";
  const isRunning = status === "running";
  const isPaused = status === "paused";

  // Compute display value from server state
  const computeDisplay = useCallback(() => {
    return computeElapsedSeconds(matchTimer);
  }, [matchTimer]);

  // Update elapsed for display (when running, tick every second)
  useEffect(() => {
    setElapsedSeconds(computeDisplay());
  }, [computeDisplay, matchTimer]);

  // Tick every second when running
  useEffect(() => {
    if (status !== "running" || isMatchComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      setElapsedSeconds(computeElapsedSeconds(matchTimer));
    };

    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, isMatchComplete, matchTimer]);

  const startTimer = useCallback(async () => {
    if (!matchId || !tournamentId || !socketService || isMatchComplete) return;
    await socketService.updateMatchTimer({
      tournamentId,
      matchId,
      matchTimer: {
        elapsedSeconds: 0,
        startedAt: Date.now(),
        status: "running",
      },
      action: "start",
    });
  }, [matchId, tournamentId, socketService, isMatchComplete]);

  const pauseTimer = useCallback(async () => {
    if (!matchId || !tournamentId || !socketService || isMatchComplete) return;
    const currentElapsed = computeElapsedSeconds(matchTimer);
    await socketService.updateMatchTimer({
      tournamentId,
      matchId,
      matchTimer: {
        elapsedSeconds: currentElapsed,
        startedAt: null,
        status: "paused",
      },
      action: "pause",
    });
  }, [matchId, tournamentId, socketService, matchTimer, isMatchComplete]);

  const resumeTimer = useCallback(async () => {
    if (!matchId || !tournamentId || !socketService || isMatchComplete) return;
    const currentElapsed = computeElapsedSeconds(matchTimer);
    await socketService.updateMatchTimer({
      tournamentId,
      matchId,
      matchTimer: {
        elapsedSeconds: currentElapsed,
        startedAt: Date.now(),
        status: "running",
      },
      action: "resume",
    });
  }, [matchId, tournamentId, socketService, matchTimer, isMatchComplete]);

  const resetTimer = useCallback(async () => {
    if (!matchId || !tournamentId || !socketService) return;
    await socketService.updateMatchTimer({
      tournamentId,
      matchId,
      matchTimer: {
        elapsedSeconds: 0,
        startedAt: null,
        status: "stopped",
      },
      action: "reset",
    });
  }, [matchId, tournamentId, socketService]);

  const formattedTime = formatElapsedTime(elapsedSeconds);

  return {
    elapsedSeconds,
    formattedTime,
    isRunning,
    isPaused,
    status,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    formatElapsedTime,
  };
}
