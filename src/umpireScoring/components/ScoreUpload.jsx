import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RotateCcw,
  Trash2,
  Flag,
  Settings,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { useUmpire } from "../context/UmpireContext";

const ScoreUpload = ({ match, onSave, onEndMatch, onBack }) => {
  const { updateScore } = useUmpire();
  const [scores, setScores] = useState(
    match?.scores || {
      teamA: { sets: [0, 0, 0], games: [0, 0, 0], points: 0 },
      teamB: { sets: [0, 0, 0], games: [0, 0, 0], points: 0 },
    }
  );

  const [currentSet, setCurrentSet] = useState(0);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);

  // Auto-save scores
  useEffect(() => {
    if (match?.id) {
      updateScore(match.id, scores);
    }
  }, [scores, match?.id, updateScore]);

  // Determine current set based on completed sets
  useEffect(() => {
    const completedSets = Math.max(
      scores.teamA.sets.filter((set) => set >= 6).length,
      scores.teamB.sets.filter((set) => set >= 6).length
    );
    setCurrentSet(Math.min(completedSets, 2));
  }, [scores]);

  const updatePoints = (team, increment) => {
    setScores((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        points: Math.max(0, prev[team].points + increment),
      },
    }));
    setGameInProgress(true);
  };

  const updateGames = (team, setIndex, increment) => {
    setScores((prev) => {
      const newScores = { ...prev };
      const currentGames = newScores[team].games[setIndex];
      newScores[team].games[setIndex] = Math.max(0, currentGames + increment);

      // Auto-update sets if games reach 6 and opponent has less than 5
      const opponentTeam = team === "teamA" ? "teamB" : "teamA";
      const opponentGames = newScores[opponentTeam].games[setIndex];

      if (newScores[team].games[setIndex] >= 6 && opponentGames <= 4) {
        newScores[team].sets[setIndex] = newScores[team].games[setIndex];
        newScores[opponentTeam].sets[setIndex] = opponentGames;
      }

      return newScores;
    });
  };

  const completeGame = (winningTeam) => {
    setScores((prev) => {
      const newScores = { ...prev };
      newScores[winningTeam].games[currentSet]++;

      // Check if set is won
      const winnerGames = newScores[winningTeam].games[currentSet];
      const loserTeam = winningTeam === "teamA" ? "teamB" : "teamA";
      const loserGames = newScores[loserTeam].games[currentSet];

      if (winnerGames >= 6 && winnerGames - loserGames >= 2) {
        newScores[winningTeam].sets[currentSet] = winnerGames;
        newScores[loserTeam].sets[currentSet] = loserGames;
      }

      // Reset points
      newScores.teamA.points = 0;
      newScores.teamB.points = 0;

      return newScores;
    });

    setGameInProgress(false);
  };

  const resetCurrentGame = () => {
    setScores((prev) => ({
      ...prev,
      teamA: { ...prev.teamA, points: 0 },
      teamB: { ...prev.teamB, points: 0 },
    }));
    setGameInProgress(false);
  };

  const getPointsDisplay = (points) => {
    const pointsMap = { 0: "0", 1: "15", 2: "30", 3: "40" };
    return pointsMap[points] || points.toString();
  };

  const isMatchComplete = () => {
    const setsWonA = scores.teamA.sets.filter(
      (set, i) => set > scores.teamB.sets[i]
    ).length;
    const setsWonB = scores.teamB.sets.filter(
      (set, i) => set > scores.teamA.sets[i]
    ).length;
    return setsWonA >= 2 || setsWonB >= 2;
  };

  const getMatchWinner = () => {
    const setsWonA = scores.teamA.sets.filter(
      (set, i) => set > scores.teamB.sets[i]
    ).length;
    const setsWonB = scores.teamB.sets.filter(
      (set, i) => set > scores.teamA.sets[i]
    ).length;

    if (setsWonA >= 2) return "teamA";
    if (setsWonB >= 2) return "teamB";
    return null;
  };

  const handleEndMatch = () => {
    if (isMatchComplete()) {
      onEndMatch?.(match.id, scores);
      setShowEndMatchModal(false);
    }
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-white/60 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            No Match Selected
          </h2>
          <p className="text-white/70">
            Please select a match to start scoring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-blue-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <div className="bg-gray-800 px-3 py-1 rounded-lg">
            <span className="text-white font-mono text-lg">00:00</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">PlayPro</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm font-medium">
            <span>SET 1</span>
            <span>SET 2</span>
            <span>SCORE</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEndMatchModal(true)}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors duration-200 shadow-md border border-red-500 text-xs sm:text-sm"
          >
            End Match
          </motion.button>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="px-4 py-6">
        {/* Team A */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-semibold text-blue-300">
                {match.teamA.name.split(" ")[0]}
              </h2>
              <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-blue-900">2</span>
              </div>
            </div>
            <p className="text-blue-200 text-sm">
              {match.teamA.players[0] || "Player 1"}
            </p>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-8 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-blue-300">
              {scores.teamA.sets[0] || 0}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-300">-</div>
            <div className="bg-blue-500 rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px]">
              <div className="text-xl sm:text-2xl font-bold text-white">
                {getPointsDisplay(scores.teamA.points)}
              </div>
            </div>
          </div>
        </div>

        {/* Team B */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-semibold text-red-300">
                {match.teamB.name.split(" ")[0]}
              </h2>
            </div>
            <p className="text-red-200 text-sm">
              {match.teamB.players[0] || "Player 2"}
            </p>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-8 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-red-300">
              {scores.teamB.sets[0] || 0}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-red-300">-</div>
            <div className="bg-red-500 rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px]">
              <div className="text-xl sm:text-2xl font-bold text-white">
                {getPointsDisplay(scores.teamB.points)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-6 gap-2 sm:gap-3 px-2">
          {/* Menu Button */}
          {/* <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Menu
            </span>
          </motion.button> */}

          {/* Undo Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={resetCurrentGame}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Undo
            </span>
          </motion.button>

          {/* Change Serve Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white rounded-full"></div>
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              Change
            </span>
            <span className="text-xs font-medium text-center leading-tight">
              Serve
            </span>
          </motion.button>

          {/* Reset Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={resetCurrentGame}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
          >
            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Reset
            </span>
          </motion.button>

          {/* Super Tiebreak Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
          >
            <Flag className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Super
            </span>
            <span className="text-xs font-medium text-center leading-tight">
              Tiebreak
            </span>
          </motion.button>

          {/* Settings Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Settings
            </span>
          </motion.button>
        </div>

        {/* Warning Buttons */}
        {/* <div className="grid grid-cols-2 gap-4 mt-6 px-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-yellow-500/30 hover:bg-yellow-500/40 border border-yellow-400/50 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-300" />
            <span className="text-xs font-medium text-yellow-200">Team 1</span>
            <span className="text-xs font-medium text-yellow-200">Warning</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-yellow-500/30 hover:bg-yellow-500/40 border border-yellow-400/50 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-300" />
            <span className="text-xs font-medium text-yellow-200">Team 2</span>
            <span className="text-xs font-medium text-yellow-200">Warning</span>
          </motion.button>
        </div> */}

        {/* Score Buttons */}
        {/* <div className="mt-8 space-y-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => updatePoints("teamA", 1)}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl p-6 shadow-lg border border-blue-500 transition-all duration-200"
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-1 text-white">
                {match.teamA.name}
              </div>
              <div className="text-sm text-blue-100">Tap to add point</div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => updatePoints("teamB", 1)}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl p-6 shadow-lg border border-red-500 transition-all duration-200"
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-1 text-white">
                {match.teamB.name}
              </div>
              <div className="text-sm text-red-100">Tap to add point</div>
            </div>
          </motion.button>
        </div> */}
      </div>

      {/* Match Complete Notification */}
      {isMatchComplete() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-4 top-20 bg-green-600 rounded-xl p-4 z-50"
        >
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-1">
              Match Complete!
            </h3>
            <p className="text-green-100">
              {getMatchWinner() === "teamA"
                ? match.teamA.name
                : match.teamB.name}{" "}
              wins!
            </p>
          </div>
        </motion.div>
      )}

      {/* End Match Modal */}
      {showEndMatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              End Match
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to end this match?
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndMatchModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleEndMatch}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                End Match
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ScoreUpload;
