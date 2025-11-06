import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTimer } from "../hooks/useTimer.js";

/**
 * TimerHeader Component
 * Displays timer, logo, and set labels in the header
 * Following REACT_IMPLEMENTATION_GUIDE.md specification
 */
const TimerHeader = ({ matchSettings, matchState, setsData, onBack, onEndMatch }) => {
  const {
    activeTimer,
    formattedTime,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    TimerType,
  } = useTimer(matchSettings);

  const displayTime = formattedTime || "00:00";

  // Calculate active set for current games display
  const activeSetIndex = matchState && setsData
    ? Math.max(matchState.team1?.sets || 0, matchState.team2?.sets || 0)
    : 0;
  const activeSetKey = activeSetIndex.toString();
  const activeSet = setsData?.[activeSetKey] || { team1Games: 0, team2Games: 0 };

  return (
    <div className="flex items-center justify-between p-4 bg-blue-900/50 backdrop-blur-sm">
      {/* Left side: Back button, Timer, Logo */}
      <div className="flex items-center space-x-3 flex-1">
        {onBack && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
        )}
        <div className="bg-gray-800 px-3 py-1 rounded-lg flex-shrink-0">
          <span className="text-white font-mono text-lg">{displayTime}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">PlayPro</span>
          {activeTimer && (
            <div className="flex items-center space-x-1">
              {isRunning && !isPaused && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={pauseTimer}
                  className="px-2 py-1 bg-yellow-500/30 text-yellow-200 text-xs rounded"
                >
                  Pause
                </motion.button>
              )}
              {isPaused && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={resumeTimer}
                  className="px-2 py-1 bg-green-500/30 text-green-200 text-xs rounded"
                >
                  Resume
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                className="px-2 py-1 bg-red-500/30 text-red-200 text-xs rounded"
              >
                Stop
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Center: Set scores */}
      <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm font-medium flex-1 justify-center">
        {matchSettings?.numberOfSets >= 1 && (
          <span>
            SET 1: {setsData?.["0"]?.team1Games || 0}-
            {setsData?.["0"]?.team2Games || 0}
          </span>
        )}
        {matchSettings?.numberOfSets >= 2 && (
          <span>
            SET 2: {setsData?.["1"]?.team1Games || 0}-
            {setsData?.["1"]?.team2Games || 0}
          </span>
        )}
        {matchSettings?.numberOfSets >= 3 && (
          <span>
            SET 3: {setsData?.["2"]?.team1Games || 0}-
            {setsData?.["2"]?.team2Games || 0}
          </span>
        )}
        {matchState && setsData && (
          <span>
            Current: {activeSet.team1Games || 0}-
            {activeSet.team2Games || 0}
          </span>
        )}
      </div>

      {/* Right side: End Match button */}
      <div className="flex-1 flex justify-end">
        {onEndMatch && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onEndMatch}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors duration-200 shadow-md border border-red-500 text-xs sm:text-sm flex-shrink-0"
          >
            End Match
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default TimerHeader;

