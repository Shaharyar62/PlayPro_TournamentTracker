import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Timer types
 */
export const TimerType = {
  POINT: "point",
  SIDE_CHANGE: "side_change",
  SIDE_CHANGE_FIRST: "side_change_first",
  SET: "set",
  MATCH: "match", // Overall match time
};

/**
 * Custom hook for managing multiple timer types
 * @param {Object} matchSettings - MatchSettings object
 * @returns {Object} Timer state and controls
 */
export function useTimer(matchSettings) {
  const [activeTimer, setActiveTimer] = useState(null); // Current active timer type
  const [timeRemaining, setTimeRemaining] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const timerStartTimeRef = useRef(null);

  // Calculate total seconds from minutes and seconds
  const calculateTotalSeconds = useCallback(
    (timerType) => {
      if (!matchSettings) return 0;

      switch (timerType) {
        case TimerType.POINT:
          return (
            (matchSettings.pointTimerMinutes || 0) * 60 +
            (matchSettings.pointTimerSeconds || 0)
          );
        case TimerType.SIDE_CHANGE_FIRST:
          return (
            (matchSettings.changeSide1_Minutes || 0) * 60 +
            (matchSettings.changeSide1_Seconds || 0)
          );
        case TimerType.SIDE_CHANGE:
          return (
            (matchSettings.changeSideMinutes || 0) * 60 +
            (matchSettings.changeSideSeconds || 0)
          );
        case TimerType.SET:
          return (
            (matchSettings.setTimerMinutes || 0) * 60 +
            (matchSettings.setTimerSeconds || 0)
          );
        default:
          return 0;
      }
    },
    [matchSettings]
  );

  // Format time as MM:SS
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Start a timer
  const startTimer = useCallback(
    (timerType, initialTime = null) => {
      // Stop any existing timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const totalSeconds =
        initialTime !== null ? initialTime : calculateTotalSeconds(timerType);

      if (totalSeconds <= 0) {
        // Timer disabled or zero time
        return;
      }

      setActiveTimer(timerType);
      setTimeRemaining(totalSeconds);
      setIsRunning(true);
      setIsPaused(false);
      timerStartTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer expired
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setActiveTimer(null);
            // Trigger timer expired callback if needed
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [calculateTotalSeconds]
  );

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPaused(true);
    setIsRunning(false);
  }, []);

  // Resume timer
  const resumeTimer = useCallback(() => {
    if (!isPaused || !activeTimer || timeRemaining <= 0) return;

    setIsPaused(false);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setActiveTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isPaused, activeTimer, timeRemaining]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveTimer(null);
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(0);
    timerStartTimeRef.current = null;
  }, []);

  // Reset timer to initial value
  const resetTimer = useCallback(
    (timerType) => {
      stopTimer();
      const totalSeconds = calculateTotalSeconds(timerType);
      setTimeRemaining(totalSeconds);
    },
    [stopTimer, calculateTotalSeconds]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start point timer if enabled
  useEffect(() => {
    if (
      matchSettings?.autoStartTime &&
      matchSettings?.pointTimerMinutes >= 0 &&
      matchSettings?.pointTimerSeconds > 0 &&
      !activeTimer
    ) {
      // Auto-start will be handled by component when needed
    }
  }, [matchSettings, activeTimer]);

  return {
    activeTimer,
    timeRemaining,
    isRunning,
    isPaused,
    formattedTime: formatTime(timeRemaining),
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    formatTime,
    TimerType,
  };
}

