import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY_PREFIX = "match-timer-";

/**
 * Get localStorage key for a match
 * @param {string} matchId - Match ID
 * @returns {string}
 */
function getStorageKey(matchId) {
  return `${STORAGE_KEY_PREFIX}${matchId}`;
}

/**
 * Load startedAt timestamp from localStorage
 * @param {string} matchId - Match ID
 * @returns {number|null} startedAt timestamp or null
 */
function loadStartedAt(matchId) {
  try {
    const key = getStorageKey(matchId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed?.startedAt === "number" ? parsed.startedAt : null;
  } catch {
    return null;
  }
}

/**
 * Save startedAt timestamp to localStorage
 * @param {string} matchId - Match ID
 * @param {number} startedAt - Timestamp
 */
function saveStartedAt(matchId, startedAt) {
  try {
    const key = getStorageKey(matchId);
    localStorage.setItem(key, JSON.stringify({ startedAt }));
  } catch (e) {
    console.warn("Failed to save match timer:", e);
  }
}

/**
 * Clear timer from localStorage
 * @param {string} matchId - Match ID
 */
function clearTimerStorage(matchId) {
  try {
    localStorage.removeItem(getStorageKey(matchId));
  } catch (e) {
    console.warn("Failed to clear match timer:", e);
  }
}

/**
 * Format seconds as MM:SS or HH:MM:SS
 * @param {number} seconds - Elapsed seconds
 * @returns {string}
 */
function formatElapsedTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Custom hook for match duration timer (count-up)
 * Persists startedAt in localStorage so timer survives navigation.
 *
 * @param {string} matchId - Match ID for storage key
 * @param {boolean} isMatchComplete - Whether match is completed (stops timer)
 * @returns {Object} Timer state and controls
 */
export function useMatchTimer(matchId, isMatchComplete) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Compute elapsed from startedAt
  const computeElapsed = useCallback(() => {
    const startedAt = loadStartedAt(matchId);
    if (!startedAt) return 0;
    return Math.floor((Date.now() - startedAt) / 1000);
  }, [matchId]);

  // Initialize from localStorage on mount or matchId change
  useEffect(() => {
    if (!matchId) return;

    const startedAt = loadStartedAt(matchId);
    if (startedAt) {
      setElapsedSeconds(computeElapsed());
      setIsRunning(true);
    } else {
      setElapsedSeconds(0);
      setIsRunning(false);
    }
  }, [matchId, computeElapsed]);

  // Tick every second when running
  useEffect(() => {
    if (!isRunning || !matchId) return;

    const tick = () => {
      setElapsedSeconds(computeElapsed());
    };

    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, matchId, computeElapsed]);

  // Stop timer when match is complete
  useEffect(() => {
    if (isMatchComplete && matchId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
      clearTimerStorage(matchId);
    }
  }, [isMatchComplete, matchId]);

  const startTimer = useCallback(() => {
    if (!matchId) return;
    const now = Date.now();
    saveStartedAt(matchId, now);
    setElapsedSeconds(0);
    setIsRunning(true);
  }, [matchId]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (matchId) {
      clearTimerStorage(matchId);
    }
    setIsRunning(false);
    setElapsedSeconds(0);
  }, [matchId]);

  const formattedTime = formatElapsedTime(elapsedSeconds);

  return {
    elapsedSeconds,
    formattedTime,
    isRunning,
    startTimer,
    stopTimer,
    formatElapsedTime,
  };
}
