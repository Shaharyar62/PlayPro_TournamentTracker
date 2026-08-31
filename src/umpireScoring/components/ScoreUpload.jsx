import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RotateCcw,
  Trash2,
  Flag,
  Settings,
  AlertTriangle,
  ChevronDown,
  CheckCircle,
  Pause,
  Play,
  MapPin,
  Trophy,
} from "lucide-react";
import { useUmpire } from "../context/UmpireContext";
import { useMatchState } from "../hooks/useMatchState.js";
import { useMatchTimer } from "../hooks/useMatchTimer.js";
import { getScoreDisplayString } from "../utils/scoringRules.js";
import TimerHeader from "./TimerHeader.jsx";
import SettingsPanel from "./SettingsPanel.jsx";

const ScoreUpload = ({ match, onSave, onEndMatch, onBack }) => {
  const { updateScore } = useUmpire();
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangeServeModal, setShowChangeServeModal] = useState(false);
  const [isSetScoreEditingMode, setIsSetScoreEditingMode] = useState(false);
  const [showSetScoreConfirmation, setShowSetScoreConfirmation] =
    useState(false);
  const [pendingSetScoreEdit, setPendingSetScoreEdit] = useState(null);
  const [showSubmitResultsModal, setShowSubmitResultsModal] = useState(false);
  const [hasShownSubmitModal, setHasShownSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualCompleteModal, setShowManualCompleteModal] = useState(false);
  console.log("ScoreUpload match", match);

  // Get tournamentId from match or use default
  const tournamentId =
    match?.tournamentId || `tournament-${match?.id || "default"}`;
  const matchId = match?.id?.toString() || "default";
  console.log("ScoreUpload tournamentId", tournamentId);
  console.log("ScoreUpload matchId", matchId);

  // Use match state hook with WebSocket integration
  const {
    matchState,
    matchSettings,
    setsData,
    isLoading,
    loadError,
    incrementScore,
    incrementSetScore,
    addWarning,
    updateServe,
    undo,
    resetMatch,
    resetScores,
    completeMatch,
    loadMatchState,
    loadMatchSettings,
    initializeMatch,
    updateMatchSettings,
    startSuperTiebreak,
    getMatchWinner,
    isMatchComplete,
  } = useMatchState(tournamentId, matchId);

  const {
    formattedTime,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = useMatchTimer(
    matchId,
    tournamentId,
    matchState?.matchTimer,
    isMatchComplete(),
  );

  // Initialize match on mount - following guide's initialization flow
  useEffect(() => {
    if (!match) return;

    const initialize = async () => {
      try {
        // Load match settings from API first (per guide)
        const stageTypeId = match.stageTypeValue || null;

        const settings = await loadMatchSettings(stageTypeId);
        console.log("ScoreUpload settings", settings);

        // Then load existing match state
        const existingState = await loadMatchState();

        if (!existingState) {
          // Initialize new match if no existing state
          await initializeMatch(match, settings);
        }
      } catch (error) {
        console.error("Error initializing match:", error);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id, tournamentId, matchId]);

  // Legacy compatibility: update UmpireContext scores
  // Use refs to track previous values and prevent infinite loops
  const prevMatchStateRef = useRef();
  const prevSetsDataRef = useRef();
  const updateScoreRef = useRef(updateScore);
  const onSaveRef = useRef(onSave);

  // Keep refs updated
  useEffect(() => {
    updateScoreRef.current = updateScore;
    onSaveRef.current = onSave;
  }, [updateScore, onSave]);

  useEffect(() => {
    if (!matchState || !match?.id) return;

    // Check if scores actually changed
    const scoresChanged =
      !prevMatchStateRef.current ||
      prevMatchStateRef.current?.team1?.score !== matchState.team1?.score ||
      prevMatchStateRef.current?.team2?.score !== matchState.team2?.score ||
      prevMatchStateRef.current?.team1?.sets !== matchState.team1?.sets ||
      prevMatchStateRef.current?.team2?.sets !== matchState.team2?.sets ||
      JSON.stringify(prevSetsDataRef.current) !== JSON.stringify(setsData);

    if (!scoresChanged) {
      return; // Skip update if nothing changed
    }

    // Convert new format back to legacy for context compatibility
    const legacyScores = {
      teamA: {
        sets: [0, 0, 0],
        games: [0, 0, 0],
        points: matchState.team1?.score || 0,
      },
      teamB: {
        sets: [0, 0, 0],
        games: [0, 0, 0],
        points: matchState.team2?.score || 0,
      },
    };

    // Update sets and games from setsData
    // Calculate active set index based on completed sets
    // Total completed sets = active set index (sets are 0-indexed)
    const totalCompletedSets =
      (matchState.team1?.sets || 0) + (matchState.team2?.sets || 0);
    const activeSetIndex = totalCompletedSets;

    Object.keys(setsData || {}).forEach((setIndex) => {
      const set = setsData[setIndex];
      const idx = parseInt(setIndex);
      if (idx < 3) {
        legacyScores.teamA.sets[idx] = set.team1Games || 0;
        legacyScores.teamB.sets[idx] = set.team2Games || 0;
        legacyScores.teamA.games[idx] = set.team1Games || 0;
        legacyScores.teamB.games[idx] = set.team2Games || 0;
      }
    });

    // Update refs before dispatching to prevent re-triggering
    prevMatchStateRef.current = {
      team1: { ...matchState.team1 },
      team2: { ...matchState.team2 },
    };
    prevSetsDataRef.current = JSON.parse(JSON.stringify(setsData || {}));

    // Use refs to avoid dependency issues
    updateScoreRef.current(match.id, legacyScores);
    onSaveRef.current?.(legacyScores);
  }, [matchState, setsData, match?.id]);

  // Reset hasShownSubmitModal when match status changes from completed to active
  // This handles cases where user edits scores after clicking "Not Now"
  useEffect(() => {
    if (matchState?.status === "active" || !matchState?.winnerTeam) {
      setHasShownSubmitModal(false);
      setShowSubmitResultsModal(false);
    }
  }, [matchState?.status, matchState?.winnerTeam]);

  const handleSubmitResults = async () => {
    if (!isMatchComplete() || !matchState) return;

    setIsSubmitting(true);
    try {
      const winner = getMatchWinner();
      if (winner) {
        await completeMatch(winner);
        // Convert to legacy format for onEndMatch callback
        const legacyScores = {
          teamA: {
            sets: [0, 0, 0],
            games: [0, 0, 0],
            points: matchState.team1?.score || 0,
          },
          teamB: {
            sets: [0, 0, 0],
            games: [0, 0, 0],
            points: matchState.team2?.score || 0,
          },
        };
        onEndMatch?.(match.id, legacyScores);
      }
      setShowSubmitResultsModal(false);
    } catch (error) {
      console.error("Error submitting match results:", error);
      // Keep modal open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowSubmitResultsModal(false);
  };

  const handleCompleteMatchClick = () => {
    // Show confirmation dialog when button is clicked
    if (matchState?.status === "completed" && matchState?.winnerTeam) {
      setShowSubmitResultsModal(true);
    }
  };

  const handleEndMatch = async () => {
    if (isMatchComplete() && matchState) {
      const winner = getMatchWinner();
      if (winner) {
        await completeMatch(winner);
        // Convert to legacy format for onEndMatch callback
        const legacyScores = {
          teamA: {
            sets: [0, 0, 0],
            games: [0, 0, 0],
            points: matchState.team1?.score || 0,
          },
          teamB: {
            sets: [0, 0, 0],
            games: [0, 0, 0],
            points: matchState.team2?.score || 0,
          },
        };
        onEndMatch?.(match.id, legacyScores);
      }
      setShowEndMatchModal(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the match? This will clear all scores.",
      )
    ) {
      await resetTimer();
      await resetMatch(match, matchSettings);
      // Reset the modal state so completion can be detected again after reset
      setHasShownSubmitModal(false);
      setShowSubmitResultsModal(false);
    }
  };

  const handleChangeServe = async (newServingPlayer, isServingTeam1) => {
    await updateServe(newServingPlayer, isServingTeam1);
    setShowChangeServeModal(false);
  };

  const handleWarning = async (team) => {
    const teamName = team === "teamA" || team === "team1" ? "Team 1" : "Team 2";
    await addWarning(teamName);
  };

  const handleSetScoreClick = (setIndex, team) => {
    if (isSetScoreEditingMode) {
      // In editing mode, directly increment
      incrementSetScore(setIndex, team);
    } else {
      // Not in editing mode, show confirmation
      setPendingSetScoreEdit({ setIndex, team });
      setShowSetScoreConfirmation(true);
    }
  };

  const handleConfirmSetScoreEditing = async () => {
    console.log("[handleConfirmSetScoreEditing] Function called");
    console.log(
      "[handleConfirmSetScoreEditing] resetScores available:",
      typeof resetScores,
    );

    if (!matchState) {
      console.log(
        "[handleConfirmSetScoreEditing] Early return - no matchState",
      );
      return;
    }

    if (!resetScores) {
      console.error(
        "[handleConfirmSetScoreEditing] resetScores is not available!",
      );
      // Still enter editing mode even if reset fails
      setIsSetScoreEditingMode(true);
      setShowSetScoreConfirmation(false);
      if (pendingSetScoreEdit) {
        incrementSetScore(
          pendingSetScoreEdit.setIndex,
          pendingSetScoreEdit.team,
        );
        setPendingSetScoreEdit(null);
      }
      return;
    }

    console.log("[handleConfirmSetScoreEditing] Current scores:", {
      team1Score: matchState.team1?.score,
      team2Score: matchState.team2?.score,
    });

    try {
      // Reset scores to 0 for both teams before entering editing mode
      console.log("[handleConfirmSetScoreEditing] Calling resetScores...");
      await resetScores();
      console.log("[handleConfirmSetScoreEditing] resetScores completed");
    } catch (error) {
      console.error(
        "[handleConfirmSetScoreEditing] Error resetting scores:",
        error,
      );
      // Optionally show error to user
      return;
    }

    // Enter editing mode after successful reset
    console.log("[handleConfirmSetScoreEditing] Entering editing mode");
    setIsSetScoreEditingMode(true);
    setShowSetScoreConfirmation(false);
    // Optionally increment the score that was tapped
    if (pendingSetScoreEdit) {
      incrementSetScore(pendingSetScoreEdit.setIndex, pendingSetScoreEdit.team);
      setPendingSetScoreEdit(null);
    }
  };

  const handleCancelSetScoreEditing = () => {
    setShowSetScoreConfirmation(false);
    setPendingSetScoreEdit(null);
  };

  const handleDoneEditing = () => {
    setIsSetScoreEditingMode(false);
  };

  // Helper function to determine current winner based on scores
  const getCurrentWinner = () => {
    if (!matchState) return null;

    const team1Sets = matchState.team1?.sets || 0;
    const team2Sets = matchState.team2?.sets || 0;

    // Compare sets first
    if (team1Sets > team2Sets) {
      return "Team 1";
    } else if (team2Sets > team1Sets) {
      return "Team 2";
    }

    // If sets are tied, compare games in current set
    const totalCompletedSets = team1Sets + team2Sets;
    const activeSetIndex = totalCompletedSets.toString();
    const activeSet = setsData?.[activeSetIndex] || {
      team1Games: 0,
      team2Games: 0,
    };

    const team1Games = activeSet.team1Games || 0;
    const team2Games = activeSet.team2Games || 0;

    if (team1Games > team2Games) {
      return "Team 1";
    } else if (team2Games > team1Games) {
      return "Team 2";
    }

    // If games are also tied, compare current point score
    const team1Score = matchState.team1?.score || 0;
    const team2Score = matchState.team2?.score || 0;

    if (team1Score > team2Score) {
      return "Team 1";
    } else if (team2Score > team1Score) {
      return "Team 2";
    }

    // If everything is tied, default to Team 1 (edge case)
    return "Team 1";
  };

  // Handle manual complete button click
  const handleManualCompleteClick = () => {
    if (matchState?.status === "active") {
      setShowManualCompleteModal(true);
    }
  };

  // Handle confirmation of manual completion
  const handleConfirmManualComplete = async () => {
    if (!matchState) return;

    setIsSubmitting(true);
    try {
      const winner = getCurrentWinner();
      if (winner) {
        await completeMatch(winner);
        // Convert to legacy format for onEndMatch callback
        const legacyScores = {
          teamA: {
            sets: [0, 0, 0],
            games: [0, 0, 0],
            points: matchState.team1?.score || 0,
          },
          teamB: {
            sets: [0, 0, 0],
            games: [0, 0, 0],
            points: matchState.team2?.score || 0,
          },
        };

        // Update sets and games from setsData
        Object.keys(setsData || {}).forEach((setIndex) => {
          const set = setsData[setIndex];
          const idx = parseInt(setIndex);
          if (idx < 3) {
            legacyScores.teamA.sets[idx] = set.team1Games || 0;
            legacyScores.teamB.sets[idx] = set.team2Games || 0;
            legacyScores.teamA.games[idx] = set.team1Games || 0;
            legacyScores.teamB.games[idx] = set.team2Games || 0;
          }
        });

        onEndMatch?.(match.id, legacyScores);
      }
      setShowManualCompleteModal(false);
    } catch (error) {
      console.error("Error completing match manually:", error);
      // Keep modal open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel manual completion
  const handleCancelManualComplete = () => {
    setShowManualCompleteModal(false);
  };

  // Get team display data
  const getTeamData = (teamKey) => {
    if (!matchState) return null;

    const team =
      teamKey === "teamA" || teamKey === "team1"
        ? matchState.team1
        : matchState.team2;

    const matchTeam =
      teamKey === "teamA" || teamKey === "team1" ? match.teamA : match.teamB;

    // Calculate active set index and get games from sets
    // Total completed sets = active set index (sets are 0-indexed)
    const totalCompletedSets =
      (matchState.team1?.sets || 0) + (matchState.team2?.sets || 0);
    const activeSetIndex = totalCompletedSets;
    const activeSetKey = activeSetIndex.toString();
    const activeSet = setsData?.[activeSetKey] || {
      team1Games: 0,
      team2Games: 0,
    };
    const games =
      teamKey === "teamA" || teamKey === "team1"
        ? activeSet.team1Games || 0
        : activeSet.team2Games || 0;

    return {
      name: matchTeam?.name || "Team",
      players: team?.players,
      score: team?.score || 0,
      games: games,
      sets: team?.sets || 0,
      tiebreakScore: team?.tiebreakScore || 0,
      warnings: team?.warnings || [],
    };
  };

  const team1Data = getTeamData("team1");
  const team2Data = getTeamData("team2");

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading match...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Error Loading Match
          </h2>
          <p className="text-white/70 mb-4">{loadError}</p>
          <button
            onClick={() => loadMatchState()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!matchState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-white/60 mx-auto mb-4" />
          <p className="text-white/70">Initializing match...</p>
        </div>
      </div>
    );
  }

  const isInTiebreak = matchState.isInTiebreak || false;
  const isInSuperTiebreak = matchState.isInSuperTiebreak || false;
  const isCompleted = isMatchComplete();
  // For 2-sets + super tiebreak: show 2 columns until super tiebreak; then 3
  const displaySetCount =
    matchSettings?.matchFormat === 2
      ? isInSuperTiebreak || isCompleted
        ? 3
        : 2
      : matchSettings?.numberOfSets || 3;

  // Calculate total advantage exchanges for golden point display
  const totalAdvantageExchanges =
    (matchState.team1?.advantageCount || 0) +
    (matchState.team2?.advantageCount || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      {/* Header: Back -> Timer -> Complete */}
      <div className="flex items-center px-4 py-3 bg-blue-900/50 backdrop-blur-sm gap-2">
        {onBack && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.div
            whileTap={{
              scale: isRunning || isPaused || isCompleted ? 1 : 0.95,
            }}
            onClick={() =>
              !isRunning && !isPaused && !isCompleted && startTimer()
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
              isRunning || isPaused || isCompleted
                ? "bg-gray-800 cursor-default"
                : "bg-gray-800 hover:bg-gray-700 cursor-pointer active:bg-gray-600"
            }`}
          >
            <span className="text-white">{formattedTime}</span>
            {isRunning && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
            {isPaused && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            {!isRunning && !isPaused && !isCompleted && (
              <span className="text-xs text-white/70">Tap to start</span>
            )}
          </motion.div>
          {!isCompleted && (isRunning || isPaused) && (
            <>
              {isRunning ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={pauseTimer}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Pause"
                >
                  <Pause className="w-5 h-5 text-white" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={resumeTimer}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Resume"
                >
                  <Play className="w-5 h-5 text-white" />
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={resetTimer}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </motion.button>
            </>
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-center gap-3 flex-wrap px-2">
          {match?.courtName && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-white/80 flex-shrink-0" />
              <span className="font-medium text-white text-sm truncate">
                {match.courtName}
              </span>
            </div>
          )}
          {(match?.tournamentName || match?.tournament) && (
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="font-medium text-white/90 text-sm truncate">
                {match.tournamentName || match.tournament}
              </span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          {matchState?.status === "completed" && matchState?.winnerTeam && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCompleteMatchClick}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 border border-green-400 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-colors shadow-md text-sm font-semibold whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Match
            </motion.button>
          )}
          {matchState?.status === "active" && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleManualCompleteClick}
              className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 border border-amber-400 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-colors shadow-md text-sm font-semibold whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Complete Match Manually</span>
              <span className="sm:hidden">Complete</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Score Display */}
      <div className="px-4 py-2">
        {/* Scoreboard Table */}
        <div className="text-white  overflow-hidden mb-6">
          {/* Header Row */}
          <div className="  text-white py-2">
            <div
              className="grid gap-2 items-center px-2"
              style={{
                gridTemplateColumns: `2fr ${Array(displaySetCount)
                  .fill("1fr")
                  .join(" ")} 1fr`,
              }}
            >
              <div className="text-center">
                <h2 className="font-bold">PLAYERS</h2>
              </div>
              {Array.from({ length: displaySetCount }, (_, index) => (
                <div key={index} className="text-center">
                  <h2 className=" font-bold">
                    {matchSettings?.matchFormat === 2 &&
                    index === 2 &&
                    isCompleted
                      ? "STB"
                      : `SET ${index + 1}`}
                  </h2>
                </div>
              ))}
              <div className="text-center">
                <h2 className="  font-bold">
                  {isInSuperTiebreak
                    ? "SUPER TIEBREAK"
                    : isInTiebreak
                      ? "TIEBREAK"
                      : "SCORE"}
                </h2>
              </div>
            </div>
          </div>

          {/* Score Content Rows */}
          <div className="p-0">
            {/* Team 1 Row */}
            <div
              className="grid gap-2 items-center   px-2 py-3"
              style={{
                gridTemplateColumns: `2fr ${Array(displaySetCount)
                  .fill("1fr")
                  .join(" ")} 1fr`,
              }}
            >
              {/* PLAYERS Column - Team 1 */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  {/* <h2 className="text-xl font-semibold text-blue-300">
                    {team1Data?.name?.split(" ")[0] ||
                      match.teamA?.name?.split(" ")[0] ||
                      "Team 1"}
                  </h2> */}
                  {matchState.currentServe?.isServingTeam1 && (
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-900">S</span>
                    </div>
                  )}
                  {(matchState?.team1?.warnings?.length > 0 ||
                    team1Data?.warnings?.length > 0) && (
                    <div className="flex gap-1">
                      {(
                        matchState?.team1?.warnings ||
                        team1Data?.warnings ||
                        []
                      ).map((w, i) => (
                        <AlertTriangle
                          key={i}
                          className="w-4 h-4 text-yellow-400"
                          title={w.level || `W${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-green-500 text-sm">{team1Data?.name}</p>
                <p className="text-white text-lg">
                  {team1Data?.players?.[0]?.name ||
                    match.teamA?.players?.[0]?.name ||
                    "Player 1"}
                  {team1Data?.players?.length > 1 && (
                    <> / {team1Data.players[1].name}</>
                  )}
                </p>
              </div>

              {/* SET Columns - Team 1 */}
              {Array.from({ length: displaySetCount }, (_, index) => {
                const setKey = index.toString();
                const setData = setsData?.[setKey] || {
                  team1Games: 0,
                  team2Games: 0,
                };
                return (
                  <div key={index} className="text-center">
                    <motion.div
                      whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                      onClick={() =>
                        !isCompleted && handleSetScoreClick(index, "Team 1")
                      }
                      className={`rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] transition-colors inline-block ${
                        isCompleted
                          ? "bg-blue-500/50 cursor-not-allowed opacity-60"
                          : isSetScoreEditingMode
                            ? "bg-blue-600 hover:bg-blue-700/90 active:bg-blue-800 border-2 border-blue-300 cursor-pointer"
                            : "bg-blue-500 hover:bg-blue-600/90 active:bg-blue-700 cursor-pointer"
                      }`}
                    >
                      <div className="text-2xl sm:text-2xl font-bold text-white">
                        {setData.team1Games || 0}
                      </div>
                    </motion.div>
                  </div>
                );
              })}

              {/* SCORE Column - Team 1 */}
              <div className="text-center">
                {isInTiebreak ? (
                  <motion.div
                    whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                    onClick={() => !isCompleted && incrementScore("Team 1")}
                    className={`rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] transition-colors inline-block ${
                      isCompleted
                        ? "bg-blue-500/50 cursor-not-allowed opacity-60"
                        : "bg-blue-500 hover:bg-blue-600/90 active:bg-blue-700 cursor-pointer"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {team1Data?.tiebreakScore || 0}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                    onClick={() => !isCompleted && incrementScore("Team 1")}
                    className={`rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] transition-colors inline-block ${
                      isCompleted
                        ? "bg-blue-500/50 cursor-not-allowed opacity-60"
                        : "bg-blue-500 hover:bg-blue-600/90 active:bg-blue-700 cursor-pointer"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {getScoreDisplayString(
                        team1Data?.score || 0,
                        team2Data?.score || 0,
                        {
                          isInTiebreak,
                          matchSettings,
                          teamAdvantageCount:
                            matchState.team1?.advantageCount || 0,
                          totalAdvantageExchanges,
                        },
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Team 2 Row */}
            <div
              className="grid gap-2 items-center border-b border-gray-200 px-2 py-3"
              style={{
                gridTemplateColumns: `2fr ${Array(displaySetCount)
                  .fill("1fr")
                  .join(" ")} 1fr`,
              }}
            >
              {/* PLAYERS Column - Team 2 */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  {/* <h2 className="text-xl font-semibold text-red-300">
                    {team2Data?.name?.split(" ")[0] ||
                      match.teamB?.name?.split(" ")[0] ||
                      "Team 2"}
                  </h2> */}
                  {!matchState.currentServe?.isServingTeam1 && (
                    <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">S</span>
                    </div>
                  )}
                  {(matchState?.team2?.warnings?.length > 0 ||
                    team2Data?.warnings?.length > 0) && (
                    <div className="flex gap-1">
                      {(
                        matchState?.team2?.warnings ||
                        team2Data?.warnings ||
                        []
                      ).map((w, i) => (
                        <AlertTriangle
                          key={i}
                          className="w-4 h-4 text-yellow-400"
                          title={w.level || `W${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-red-500 text-sm">{team2Data?.name}</p>
                <p className="text-white text-lg">
                  {team2Data?.players?.[0]?.name ||
                    match.teamB?.players?.[0]?.name ||
                    "Player 2"}
                  {team2Data?.players?.length > 1 && (
                    <>
                      {" "}
                      / {team2Data.players[1].name || match.teamB?.players?.[1]}
                    </>
                  )}
                </p>
              </div>

              {/* SET Columns - Team 2 */}
              {Array.from({ length: displaySetCount }, (_, index) => {
                const setKey = index.toString();
                const setData = setsData?.[setKey] || {
                  team1Games: 0,
                  team2Games: 0,
                };
                return (
                  <div key={index} className="text-center">
                    <motion.div
                      whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                      onClick={() =>
                        !isCompleted && handleSetScoreClick(index, "Team 2")
                      }
                      className={`rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] transition-colors inline-block ${
                        isCompleted
                          ? "bg-red-500/50 cursor-not-allowed opacity-60"
                          : isSetScoreEditingMode
                            ? "bg-red-600 hover:bg-red-700/90 active:bg-red-800 border-2 border-red-300 cursor-pointer"
                            : "bg-red-500 hover:bg-red-600/90 active:bg-red-700 cursor-pointer"
                      }`}
                    >
                      <div className="text-2xl sm:text-2xl font-bold text-white">
                        {setData.team2Games || 0}
                      </div>
                    </motion.div>
                  </div>
                );
              })}

              {/* SCORE Column - Team 2 */}
              <div className="text-center">
                {isInTiebreak ? (
                  <motion.div
                    whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                    onClick={() => !isCompleted && incrementScore("Team 2")}
                    className={`rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] transition-colors inline-block ${
                      isCompleted
                        ? "bg-red-500/50 cursor-not-allowed opacity-60"
                        : "bg-red-500 hover:bg-red-600/90 active:bg-red-700 cursor-pointer"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {team2Data?.tiebreakScore || 0}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                    onClick={() => !isCompleted && incrementScore("Team 2")}
                    className={`rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] transition-colors inline-block ${
                      isCompleted
                        ? "bg-red-500/50 cursor-not-allowed opacity-60"
                        : "bg-red-500 hover:bg-red-600/90 active:bg-red-700 cursor-pointer"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {getScoreDisplayString(
                        team2Data?.score || 0,
                        team1Data?.score || 0,
                        {
                          isInTiebreak,
                          matchSettings,
                          teamAdvantageCount:
                            matchState.team2?.advantageCount || 0,
                          totalAdvantageExchanges,
                        },
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Set Score Editing Mode Banner */}
        {isSetScoreEditingMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 mx-4"
          >
            <div className="bg-yellow-500 text-yellow-900 border-2 border-yellow-400 rounded-xl px-4 py-3 text-center shadow-lg">
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold text-base">
                  Set Score Editing Mode Active
                </span>
              </div>
              <p className="text-xs mt-1 text-yellow-800">
                Tap set scores to modify them. Tap "Done" when finished.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tiebreak Indicator - More Prominent */}
        {isInTiebreak && (
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block"
            >
              <span
                className={`px-6 py-3 rounded-xl text-base font-bold shadow-lg ${
                  isInSuperTiebreak
                    ? "bg-purple-600 text-white border-2 border-purple-400"
                    : "bg-yellow-500 text-yellow-900 border-2 border-yellow-400"
                }`}
              >
                {isInSuperTiebreak ? "🔥 SUPER TIEBREAK" : "⚡ TIEBREAK"}
              </span>
            </motion.div>
            <div className="mt-2 text-xs text-yellow-200">
              {isInSuperTiebreak
                ? `First to ${
                    matchSettings?.superTieBreakPoints || 10
                  } points (win by 2)`
                : `First to ${
                    matchSettings?.pointsInTiebreak || 7
                  } points (win by 2)`}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-6 gap-2 sm:gap-3 px-2">
          {/* Undo Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={undo}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Undo
            </span>
          </motion.button>

          {/* Change Serve Button */}
          <motion.button
            whileTap={{ scale: isCompleted ? 1 : 0.95 }}
            onClick={() => !isCompleted && setShowChangeServeModal(true)}
            disabled={isCompleted}
            className={`border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors ${
              isCompleted
                ? "bg-white/5 opacity-50 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20"
            }`}
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
            whileTap={{ scale: isCompleted ? 1 : 0.95 }}
            onClick={() => handleReset()}
            className={`border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors ${"bg-white/10 hover:bg-white/20"}`}
          >
            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Reset
            </span>
          </motion.button>

          {/* Super Tiebreak Button */}
          <motion.button
            whileTap={{ scale: isCompleted ? 1 : 0.95 }}
            onClick={async () => {
              if (
                !isCompleted &&
                matchSettings?.matchFormat === 2 &&
                matchState?.team1?.sets === 1 &&
                matchState?.team2?.sets === 1 &&
                !matchState.isInSuperTiebreak
              ) {
                await startSuperTiebreak();
              } else {
                console.warn(
                  "Super tiebreak can only be started at 1-1 sets in 2 Sets format",
                );
              }
            }}
            disabled={
              isCompleted ||
              !matchState ||
              matchSettings?.matchFormat !== 2 ||
              matchState?.team1?.sets !== 1 ||
              matchState?.team2?.sets !== 1 ||
              matchState.isInSuperTiebreak
            }
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            whileTap={{ scale: isCompleted ? 1 : 0.95 }}
            onClick={() => !isCompleted && setShowSettings(true)}
            disabled={isCompleted}
            className={`border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors ${
              isCompleted
                ? "bg-white/5 opacity-50 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Settings
            </span>
          </motion.button>

          {/* Done Button (when in editing mode) or Placeholder */}
          {isSetScoreEditingMode ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDoneEditing}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 border-2 border-green-400 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
              <span className="text-xs font-medium text-center leading-tight text-white">
                Done
              </span>
            </motion.button>
          ) : (
            <div className="bg-transparent"></div>
          )}
        </div>

        {/* Warning Buttons */}
        {/* <div className="grid grid-cols-2 gap-4 mt-6 px-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleWarning("team1")}
            className="bg-yellow-500/30 hover:bg-yellow-500/40 border border-yellow-400/50 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-300" />
            <span className="text-xs font-medium text-yellow-200">
              {team1Data?.name || "Team 1"}
            </span>
            <span className="text-xs font-medium text-yellow-200">Warning</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleWarning("team2")}
            className="bg-yellow-500/30 hover:bg-yellow-500/40 border border-yellow-400/50 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-300" />
            <span className="text-xs font-medium text-yellow-200">
              {team2Data?.name || "Team 2"}
            </span>
            <span className="text-xs font-medium text-yellow-200">Warning</span>
          </motion.button>
        </div> */}
      </div>

      {/* Submit Results Confirmation Modal */}
      {showSubmitResultsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Submit match results?
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              This will finalize the match and submit the scores.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResults}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Complete Match Confirmation Modal */}
      {showManualCompleteModal && matchState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Complete Match Manually?
            </h3>
            <p className="text-gray-600 mb-4 text-center">
              Are you sure you want to complete this match with the current
              scores? This will submit the results as-is.
            </p>

            {/* Display current scores */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Current Scores:
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {team1Data?.name || "Team 1"}:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {matchState.team1?.sets || 0} sets
                    {(() => {
                      const totalCompletedSets =
                        (matchState.team1?.sets || 0) +
                        (matchState.team2?.sets || 0);
                      const activeSetIndex = totalCompletedSets.toString();
                      const activeSet = setsData?.[activeSetIndex];
                      if (activeSet) {
                        return `, ${activeSet.team1Games || 0} games`;
                      }
                      return "";
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {team2Data?.name || "Team 2"}:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {matchState.team2?.sets || 0} sets
                    {(() => {
                      const totalCompletedSets =
                        (matchState.team1?.sets || 0) +
                        (matchState.team2?.sets || 0);
                      const activeSetIndex = totalCompletedSets.toString();
                      const activeSet = setsData?.[activeSetIndex];
                      if (activeSet) {
                        return `, ${activeSet.team2Games || 0} games`;
                      }
                      return "";
                    })()}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-center">
                  Winner will be:{" "}
                  <span className="font-semibold text-gray-700">
                    {getCurrentWinner() === "Team 1"
                      ? team1Data?.name || "Team 1"
                      : team2Data?.name || "Team 2"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelManualComplete}
                disabled={isSubmitting}
                className="flex-1 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmManualComplete}
                disabled={isSubmitting}
                className="flex-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-amber-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Complete Match"
                )}
              </button>
            </div>
          </motion.div>
        </div>
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

      {/* Change Serve Modal */}
      {showChangeServeModal && matchState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Change Serve
            </h3>
            <div className="space-y-2 mb-6">
              {team1Data?.players?.map((player, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChangeServe(player.name || player, true)}
                  className="w-full text-left bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition-colors"
                >
                  {typeof player === "string" ? player : player.name} (Team 1)
                </button>
              ))}
              {team2Data?.players?.map((player, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    handleChangeServe(player.name || player, false)
                  }
                  className="w-full text-left bg-red-50 hover:bg-red-100 p-3 rounded-lg transition-colors"
                >
                  {typeof player === "string" ? player : player.name} (Team 2)
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowChangeServeModal(false)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* Set Score Editing Confirmation Modal */}
      {showSetScoreConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Enter Set Score Editing Mode?
            </h3>
            <p className="text-gray-600 mb-6">
              This will allow you to directly modify set scores. Tap "Done" when
              finished editing.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelSetScoreEditing}
                className="flex-1 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log("[Button] Enter Editing Mode button clicked");
                  handleConfirmSetScoreEditing();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                Enter Editing Mode
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          settings={matchSettings}
          onClose={() => setShowSettings(false)}
          onSave={async (newSettings) => {
            await updateMatchSettings(newSettings);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
};

export default ScoreUpload;
