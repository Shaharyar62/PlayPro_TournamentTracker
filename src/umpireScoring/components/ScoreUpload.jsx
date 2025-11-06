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
} from "lucide-react";
import { useUmpire } from "../context/UmpireContext";
import { useMatchState } from "../hooks/useMatchState.js";
import { getScoreString } from "../utils/scoringRules.js";
import TimerHeader from "./TimerHeader.jsx";
import SettingsPanel from "./SettingsPanel.jsx";

const ScoreUpload = ({ match, onSave, onEndMatch, onBack }) => {
  const { updateScore } = useUmpire();
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangeServeModal, setShowChangeServeModal] = useState(false);
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
    addWarning,
    updateServe,
    undo,
    resetMatch,
    completeMatch,
    loadMatchState,
    loadMatchSettings,
    initializeMatch,
    updateMatchSettings,
    startSuperTiebreak,
    getMatchWinner,
    isMatchComplete,
  } = useMatchState(tournamentId, matchId);

  // Lock screen orientation to landscape on mount
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // Check if screen orientation API is available
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape").catch((err) => {
            console.log("Orientation lock not supported or failed:", err);
          });
        }
      } catch (error) {
        console.log("Screen orientation lock error:", error);
      }
    };

    lockOrientation();

    // Unlock orientation when component unmounts
    return () => {
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (error) {
        console.log("Screen orientation unlock error:", error);
      }
    };
  }, []);

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
    const activeSetIndex = Math.max(
      matchState.team1?.sets || 0,
      matchState.team2?.sets || 0
    );

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
        "Are you sure you want to reset the match? This will clear all scores."
      )
    ) {
      await resetMatch(match, matchSettings);
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
    const activeSetIndex = Math.max(
      matchState.team1?.sets || 0,
      matchState.team2?.sets || 0
    );
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
      players: team?.players || matchTeam?.players || [],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      {/* Header with Timer */}
      <TimerHeader
        matchSettings={matchSettings}
        matchState={matchState}
        setsData={setsData}
        onBack={onBack}
        onEndMatch={() => setShowEndMatchModal(true)}
      />

      {/* Main Score Display */}
      <div className="px-4 py-6">
        {/* Scoreboard Table */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-6">
          {/* Header Row */}
          <div className="bg-[#17626c] text-white py-4">
            <div
              className="grid gap-4 items-center px-4"
              style={{
                gridTemplateColumns: `2fr ${Array(
                  matchSettings?.numberOfSets || 3
                )
                  .fill("1fr")
                  .join(" ")} 1fr`,
              }}
            >
              <div className="text-center">
                <h2 className="text-2xl sm:text-4xl font-bold">PLAYERS</h2>
              </div>
              {Array.from(
                { length: matchSettings?.numberOfSets || 3 },
                (_, index) => (
                  <div key={index} className="text-center">
                    <h2 className="text-2xl sm:text-4xl font-bold">
                      SET {index + 1}
                    </h2>
                  </div>
                )
              )}
              <div className="text-center">
                <h2 className="text-2xl sm:text-4xl font-bold">
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
              className="grid gap-4 items-center border-b border-gray-200 px-4 py-6"
              style={{
                gridTemplateColumns: `2fr ${Array(
                  matchSettings?.numberOfSets || 3
                )
                  .fill("1fr")
                  .join(" ")} 1fr`,
              }}
            >
              {/* PLAYERS Column - Team 1 */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-semibold text-blue-300">
                    {team1Data?.name?.split(" ")[0] ||
                      match.teamA?.name?.split(" ")[0] ||
                      "Team 1"}
                  </h2>
                  {matchState.currentServe?.isServingTeam1 && (
                    <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
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
                <p className="text-gray-700 text-sm">
                  {team1Data?.players?.[0]?.name ||
                    match.teamA?.players?.[0] ||
                    "Player 1"}
                  {team1Data?.players?.length > 1 && (
                    <>
                      {" "}
                      / {team1Data.players[1].name || match.teamA?.players?.[1]}
                    </>
                  )}
                </p>
              </div>

              {/* SET Columns - Team 1 */}
              {Array.from(
                { length: matchSettings?.numberOfSets || 3 },
                (_, index) => {
                  const setKey = index.toString();
                  const setData = setsData?.[setKey] || {
                    team1Games: 0,
                    team2Games: 0,
                  };
                  return (
                    <div key={index} className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-gray-800">
                        {setData.team1Games || 0}
                      </div>
                    </div>
                  );
                }
              )}

              {/* SCORE Column - Team 1 */}
              <div className="text-center">
                {isInTiebreak ? (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    onClick={() => incrementScore("Team 1")}
                    className="bg-blue-500 hover:bg-blue-600/90 active:bg-blue-700 rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] cursor-pointer transition-colors inline-block"
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {team1Data?.tiebreakScore || 0}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    onClick={() => incrementScore("Team 1")}
                    className="bg-blue-500 hover:bg-blue-600/90 active:bg-blue-700 rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] cursor-pointer transition-colors inline-block"
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {getScoreString(team1Data?.score || 0, false)}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Team 2 Row */}
            <div
              className="grid gap-4 items-center px-4 py-6"
              style={{
                gridTemplateColumns: `2fr ${Array(
                  matchSettings?.numberOfSets || 3
                )
                  .fill("1fr")
                  .join(" ")} 1fr`,
              }}
            >
              {/* PLAYERS Column - Team 2 */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h2 className="text-xl font-semibold text-red-300">
                    {team2Data?.name?.split(" ")[0] ||
                      match.teamB?.name?.split(" ")[0] ||
                      "Team 2"}
                  </h2>
                  {!matchState.currentServe?.isServingTeam1 && (
                    <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-red-900">S</span>
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
                <p className="text-gray-700 text-sm">
                  {team2Data?.players?.[0]?.name ||
                    match.teamB?.players?.[0] ||
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
              {Array.from(
                { length: matchSettings?.numberOfSets || 3 },
                (_, index) => {
                  const setKey = index.toString();
                  const setData = setsData?.[setKey] || {
                    team1Games: 0,
                    team2Games: 0,
                  };
                  return (
                    <div key={index} className="text-center">
                      <div className="text-3xl sm:text-4xl font-bold text-gray-800">
                        {setData.team2Games || 0}
                      </div>
                    </div>
                  );
                }
              )}

              {/* SCORE Column - Team 2 */}
              <div className="text-center">
                {isInTiebreak ? (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    onClick={() => incrementScore("Team 2")}
                    className="bg-red-500 hover:bg-red-600/90 active:bg-red-700 rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] cursor-pointer transition-colors inline-block"
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {team2Data?.tiebreakScore || 0}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    onClick={() => incrementScore("Team 2")}
                    className="bg-red-500 hover:bg-red-600/90 active:bg-red-700 rounded-lg px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] cursor-pointer transition-colors inline-block"
                  >
                    <div className="text-xl sm:text-2xl font-bold text-white">
                      {getScoreString(team2Data?.score || 0, false)}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

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
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChangeServeModal(true)}
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
            onClick={handleReset}
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
            onClick={async () => {
              if (
                matchSettings?.matchFormat === 2 &&
                matchState?.team1?.sets === 1 &&
                matchState?.team2?.sets === 1 &&
                !matchState.isInSuperTiebreak
              ) {
                await startSuperTiebreak();
              } else {
                console.warn(
                  "Super tiebreak can only be started at 1-1 sets in 2 Sets format"
                );
              }
            }}
            disabled={
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
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-colors"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs font-medium text-center leading-tight">
              Settings
            </span>
          </motion.button>

          {/* Placeholder for 6th button */}
          <div className="bg-transparent"></div>
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
              {getMatchWinner() === "Team 1"
                ? team1Data?.name || match.teamA?.name
                : team2Data?.name || match.teamB?.name}{" "}
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
