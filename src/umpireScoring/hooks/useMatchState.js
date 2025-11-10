import { useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "./useSocket.js";
import {
  DEFAULT_MATCH_SETTINGS,
  MAX_UNDO_STACK_SIZE,
} from "../utils/constants.js";
import { MatchFormat } from "../types/match.types.js";
import {
  hasWonGame,
  hasWonTiebreak,
  hasWonSet,
  shouldStartTiebreak,
  shouldStartSuperTiebreak,
  hasWonMatch,
} from "../utils/scoringRules.js";
import {
  initializeMatchState,
  initializeSetsData,
  convertLegacyScoresToMatchState,
  createUpdateData,
  mergeMatchStates,
} from "../utils/matchLogic.js";
import tournamentApiService from "../services/tournamentApi.js";
import { prepareMatchResults } from "../utils/matchResultsHelper.js";
import { umpireAPI } from "../services/umpireAPI.js";
import MatchIdHelper from "../utils/matchIdHelper.js";
import { useUmpire } from "../context/UmpireContext.jsx";

/**
 * Custom hook for managing match state with WebSocket integration
 * @param {string} tournamentId - Tournament ID
 * @param {string} matchId - Match ID
 * @returns {Object} Match state and actions
 */
export function useMatchState(tournamentId, matchId) {
  const { socketService } = useSocket();
  const [matchState, setMatchState] = useState(null);
  const [matchSettings, setMatchSettings] = useState(DEFAULT_MATCH_SETTINGS);
  const [setsData, setSetsData] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const isInitializedRef = useRef(false);
  const originalMatchRef = useRef(null);
  const { currentMatch } = useUmpire();

  // Initialize sets data structure
  const initializeSets = useCallback((settings) => {
    const sets = initializeSetsData(settings.numberOfSets);
    setSetsData(sets);
    return sets;
  }, []);

  // Load match settings from API
  const loadMatchSettings = useCallback(
    async (stageTypeId = null) => {
      try {
        const settings = await tournamentApiService.loadMatchSettings(
          tournamentId,
          stageTypeId
        );
        setMatchSettings(settings);
        return settings;
      } catch (error) {
        console.error("Error loading match settings:", error);
        // Fallback to defaults
        setMatchSettings(DEFAULT_MATCH_SETTINGS);
        return DEFAULT_MATCH_SETTINGS;
      }
    },
    [tournamentId]
  );

  // Load match state from server
  const loadMatchState = useCallback(async () => {
    if (!tournamentId || !matchId) {
      setLoadError("Missing tournamentId or matchId");
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const state = await socketService.getMatchState({
        tournamentId,
        matchId,
      });

      if (state) {
        // Ensure sets property exists and is in sync
        if (!state.sets) {
          state.sets = {};
        }
        // Ensure advantageCount is initialized
        if (typeof state.team1?.advantageCount !== "number") {
          state.team1.advantageCount = 0;
        }
        if (typeof state.team2?.advantageCount !== "number") {
          state.team2.advantageCount = 0;
        }
        setMatchState(state);
        setSetsData(state.sets);
      }

      setIsLoading(false);
      return state;
    } catch (error) {
      console.error("Error loading match state:", error);
      setLoadError(error.message);
      setIsLoading(false);
      return null;
    }
  }, [tournamentId, matchId, socketService]);

  // Initialize new match
  const initializeMatch = useCallback(
    async (match, settings = DEFAULT_MATCH_SETTINGS) => {
      if (!tournamentId || !matchId) {
        console.error(
          "Missing tournamentId or matchId for match initialization"
        );
        return;
      }

      setMatchSettings(settings);
      const initialSets = initializeSets(settings);

      // Try to get players with IDs first (from transformer), then fallback to regular players
      const team1Players = match.team1?.players || match.teamA?.players || [];
      // const team1Players = team1PlayersRaw.map((player, index) => {
      //   if (typeof player === "string") {
      //     return {
      //       id: index + 1,
      //       playerId: index + 1,
      //       name: player,
      //     };
      //   }
      //   const playerId = player.playerId || player.id;
      //   return {
      //     id:
      //       playerId !== undefined && playerId !== null
      //         ? typeof playerId === "number"
      //           ? playerId
      //           : parseInt(playerId)
      //         : index + 1,
      //     playerId:
      //       playerId !== undefined && playerId !== null
      //         ? typeof playerId === "number"
      //           ? playerId
      //           : parseInt(playerId)
      //         : index + 1,
      //     name: player.name || player.playerName || `Player ${index + 1}`,
      //   };
      // });

      const team2Players = match.team2?.players || match.teamB?.players || [];
      // const team2Players = team2PlayersRaw.map((player, index) => {
      //   if (typeof player === "string") {
      //     return {
      //       id: index + 1,
      //       playerId: index + 1,
      //       name: player,
      //     };
      //   }
      //   const playerId = player.playerId || player.id;
      //   return {
      //     id:
      //       playerId !== undefined && playerId !== null
      //         ? typeof playerId === "number"
      //           ? playerId
      //           : parseInt(playerId)
      //         : index + 1,
      //     playerId:
      //       playerId !== undefined && playerId !== null
      //         ? typeof playerId === "number"
      //           ? playerId
      //           : parseInt(playerId)
      //         : index + 1,
      //     name: player.name || player.playerName || `Player ${index + 1}`,
      //   };
      // });

      const initialState = initializeMatchState(team1Players, team2Players);

      // Ensure sets property exists
      initialState.sets = initialSets;

      // Convert legacy scores if they exist
      if (match.scores) {
        const convertedState = convertLegacyScoresToMatchState(
          match.scores,
          team1Players,
          team2Players
        );
        Object.assign(initialState, convertedState);
        initialState.sets = initialSets; // Maintain sets reference
      }

      setMatchState(initialState);
      setSetsData(initialSets);

      // Store original match for later use (e.g., getting player IDs)
      originalMatchRef.current = match;

      try {
        await socketService.createMatch({
          tournamentId: MatchIdHelper.prefixTournamentId(tournamentId),
          matchId: MatchIdHelper.prefixMatchId(matchId),
          team1Players,
          team2Players,
          groupTitle: match.groupTitle || match.round || "",
          matchSettings: settings,
        });
      } catch (error) {
        console.error("Error creating match:", error);
      }
    },
    [tournamentId, matchId, socketService, initializeSets]
  );

  // Set up real-time listeners
  useEffect(() => {
    if (!tournamentId || !matchId || !socketService) return;

    // Prefix IDs for socket listeners
    const prefixedTournamentId = MatchIdHelper.prefixTournamentId(tournamentId);
    const prefixedMatchId = MatchIdHelper.prefixMatchId(matchId);

    socketService.listenToMatchUpdates({
      tournamentId: prefixedTournamentId,
      matchId: prefixedMatchId,
      onUpdate: (data) => {
        // Filter by environment - ignore matches from other environments
        if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
          return; // Ignore matches from other environment
        }

        // Ensure sets property exists
        if (!data.sets) {
          data.sets = {};
        }

        setMatchState((prevState) => {
          if (prevState) {
            const merged = mergeMatchStates(prevState, data);
            // Ensure sets property is synced
            merged.sets = data.sets || prevState.sets || {};
            return merged;
          }
          return data;
        });

        // Sync setsData with updated sets
        setSetsData(data.sets);
      },
    });

    socketService.listenToTournamentUpdates({
      tournamentId: prefixedTournamentId,
      onUpdate: (data) => {
        // Filter by environment - ignore tournaments from other environments
        if (
          data.tournamentId &&
          !MatchIdHelper.isMatchForCurrentEnv(data.tournamentId)
        ) {
          return; // Ignore tournaments from other environment
        }
        console.log("Tournament update:", data);
      },
    });

    return () => {
      socketService.stopListeningToMatchUpdates(matchId);
      socketService.stopListeningToTournamentUpdates(tournamentId);
    };
  }, [tournamentId, matchId, socketService]);

  // Increment score
  const incrementScore = useCallback(
    async (team) => {
      if (!matchState || !matchSettings || !tournamentId || !matchId) return;

      // Save state for undo - ensure sets property is included
      const stateForUndo = JSON.parse(JSON.stringify(matchState));
      stateForUndo.sets = JSON.parse(JSON.stringify(setsData)); // Ensure sets data is included
      setUndoStack((prev) => {
        const newStack = [...prev, stateForUndo];
        return newStack.slice(-MAX_UNDO_STACK_SIZE);
      });

      const isTeam1 = team === "Team 1" || team === "team1" || team === "teamA";
      let newState = JSON.parse(JSON.stringify(matchState)); // Deep clone
      let newSetsData = JSON.parse(JSON.stringify(setsData)); // Deep clone

      // Store previous state for potential rollback
      const previousState = JSON.parse(JSON.stringify(matchState));
      const previousSetsData = JSON.parse(JSON.stringify(setsData));

      // Calculate active set index based on completed sets
      // Total completed sets = active set index (sets are 0-indexed)
      const totalCompletedSets =
        (matchState.team1.sets || 0) + (matchState.team2.sets || 0);
      // Ensure we don't exceed the number of sets in the match
      const activeSetIndex = Math.min(
        totalCompletedSets,
        (matchSettings.numberOfSets || 3) - 1
      );
      const activeSetKey = activeSetIndex.toString();

      // Ensure active set exists in sets data
      if (!newSetsData[activeSetKey]) {
        newSetsData[activeSetKey] = {
          team1Games: 0,
          team2Games: 0,
        };
      }

      if (matchState.isInTiebreak) {
        // Handle tiebreak scoring
        const newTiebreakScore = isTeam1
          ? matchState.team1.tiebreakScore + 1
          : matchState.team2.tiebreakScore + 1;

        if (isTeam1) {
          newState.team1.tiebreakScore = newTiebreakScore;
        } else {
          newState.team2.tiebreakScore = newTiebreakScore;
        }

        // Check tiebreak win
        const won = hasWonTiebreak(
          newTiebreakScore,
          isTeam1
            ? matchState.team2.tiebreakScore
            : matchState.team1.tiebreakScore,
          matchState.isInSuperTiebreak,
          matchSettings
        );

        if (won) {
          // Team won the tiebreak set
          if (isTeam1) {
            newState.team1.sets += 1;
            // Increment games count to 7 for the winning team (6-6 -> 7-6)
            newSetsData[activeSetKey].team1Games += 1;
          } else {
            newState.team2.sets += 1;
            // Increment games count to 7 for the winning team (6-6 -> 6-7)
            newSetsData[activeSetKey].team2Games += 1;
          }

          // Update completed set with tiebreak data
          newSetsData[activeSetKey] = {
            ...newSetsData[activeSetKey],
            isTiebreak: true,
            isSuperTiebreak: newState.isInSuperTiebreak,
            superTieBreakScore1: newState.isInSuperTiebreak
              ? newState.team1.tiebreakScore
              : 0,
            superTieBreakScore2: newState.isInSuperTiebreak
              ? newState.team2.tiebreakScore
              : 0,
            tiebreakScore1: !newState.isInSuperTiebreak
              ? newState.team1.tiebreakScore
              : 0,
            tiebreakScore2: !newState.isInSuperTiebreak
              ? newState.team2.tiebreakScore
              : 0,
          };

          // Reset for next set
          newState.team1.score = 0;
          newState.team2.score = 0;
          newState.team1.tiebreakScore = 0;
          newState.team2.tiebreakScore = 0;
          newState.team1.advantageCount = 0;
          newState.team2.advantageCount = 0;
          newState.isInTiebreak = false;
          newState.isInSuperTiebreak = false;

          // Initialize next set if match continues
          // Total completed sets = next set index (sets are 0-indexed)
          const totalCompletedSets =
            (newState.team1.sets || 0) + (newState.team2.sets || 0);
          // Ensure we don't exceed the number of sets in the match
          const nextSetIndex = Math.min(
            totalCompletedSets,
            (matchSettings.numberOfSets || 3) - 1
          );
          const nextSetKey = nextSetIndex.toString();
          if (!newSetsData[nextSetKey]) {
            newSetsData[nextSetKey] = {
              team1Games: 0,
              team2Games: 0,
            };
          }

          // Check match win
          const matchWin = hasWonMatch(
            newState.team1.sets,
            newState.team2.sets,
            matchSettings,
            false
          );

          if (matchWin.won) {
            newState.status = "completed";
            newState.winnerTeam = matchWin.winner;
          } else if (
            shouldStartSuperTiebreak(
              newState.team1.sets,
              newState.team2.sets,
              matchSettings
            )
          ) {
            // Start super tiebreak
            newState.isInTiebreak = true;
            newState.isInSuperTiebreak = true;
            newState.team1.tiebreakScore = 0;
            newState.team2.tiebreakScore = 0;
          }
        }
      } else {
        // Regular scoring
        const newScore = isTeam1
          ? matchState.team1.score + 1
          : matchState.team2.score + 1;
        const opponentScore = isTeam1
          ? matchState.team2.score
          : matchState.team1.score;

        if (isTeam1) {
          newState.team1.score = newScore;
          // Track advantage: if team reaches 4 while opponent is at 3, increment advantage count
          if (newScore >= 4 && opponentScore === 3) {
            newState.team1.advantageCount =
              (matchState.team1.advantageCount || 0) + 1;
          }
          // Handle advantage when both teams are at 4 or higher (deuce/advantage situations)
          // When scoring team scores and both are >= 4, scoring team gains/maintains advantage
          if (opponentScore >= 4 && newScore >= 4) {
            // If coming from deuce (both at exactly 4), increment advantage count for golden point tracking
            if (matchState.team1.score === 4 && matchState.team2.score === 4) {
              newState.team1.advantageCount =
                (matchState.team1.advantageCount || 0) + 1;
            }
            // Reset opponent's advantage count when scoring team gains advantage
            if (newScore > opponentScore) {
              newState.team2.advantageCount = 0;
            }
          }
        } else {
          newState.team2.score = newScore;
          // Track advantage: if team reaches 4 while opponent is at 3, increment advantage count
          if (newScore >= 4 && opponentScore === 3) {
            newState.team2.advantageCount =
              (matchState.team2.advantageCount || 0) + 1;
          }
          // Handle advantage when both teams are at 4 or higher (deuce/advantage situations)
          // When scoring team scores and both are >= 4, scoring team gains/maintains advantage
          if (opponentScore >= 4 && newScore >= 4) {
            // If coming from deuce (both at exactly 4), increment advantage count for golden point tracking
            if (matchState.team2.score === 4 && matchState.team1.score === 4) {
              newState.team2.advantageCount =
                (matchState.team2.advantageCount || 0) + 1;
            }
            // Reset opponent's advantage count when scoring team gains advantage
            if (newScore > opponentScore) {
              newState.team1.advantageCount = 0;
            }
          }
        }

        // Get current advantage count for winning check
        const currentAdvantageCount = isTeam1
          ? newState.team1.advantageCount || 0
          : newState.team2.advantageCount || 0;

        // Check game win
        const won = hasWonGame(
          newScore,
          opponentScore,
          currentAdvantageCount,
          matchSettings
        );

        if (won) {
          // Team won the game - update active set's games count
          if (isTeam1) {
            newSetsData[activeSetKey].team1Games += 1;
          } else {
            newSetsData[activeSetKey].team2Games += 1;
          }

          // Reset scores and advantage counts for next game
          newState.team1.score = 0;
          newState.team2.score = 0;
          newState.team1.advantageCount = 0;
          newState.team2.advantageCount = 0;

          // Check set win or tiebreak using games from active set
          const team1Games = newSetsData[activeSetKey].team1Games;
          const team2Games = newSetsData[activeSetKey].team2Games;
          const setWin = hasWonSet(
            isTeam1 ? team1Games : team2Games,
            isTeam1 ? team2Games : team1Games,
            matchSettings
          );

          if (setWin) {
            // Team won the set
            if (isTeam1) {
              newState.team1.sets += 1;
            } else {
              newState.team2.sets += 1;
            }

            // Reset advantage counts
            newState.team1.advantageCount = 0;
            newState.team2.advantageCount = 0;

            // Initialize next set if match continues
            // Total completed sets = next set index (sets are 0-indexed)
            const totalCompletedSets =
              (newState.team1.sets || 0) + (newState.team2.sets || 0);
            // Ensure we don't exceed the number of sets in the match
            const nextSetIndex = Math.min(
              totalCompletedSets,
              (matchSettings.numberOfSets || 3) - 1
            );
            const nextSetKey = nextSetIndex.toString();
            if (!newSetsData[nextSetKey]) {
              newSetsData[nextSetKey] = {
                team1Games: 0,
                team2Games: 0,
              };
            }

            // Check match win
            const matchWin = hasWonMatch(
              newState.team1.sets,
              newState.team2.sets,
              matchSettings,
              false
            );

            if (matchWin.won) {
              newState.status = "completed";
              newState.winnerTeam = matchWin.winner;
            } else if (
              shouldStartSuperTiebreak(
                newState.team1.sets,
                newState.team2.sets,
                matchSettings
              )
            ) {
              // Start super tiebreak
              newState.isInTiebreak = true;
              newState.isInSuperTiebreak = true;
            }
          } else if (
            shouldStartTiebreak(team1Games, team2Games, matchSettings)
          ) {
            // Start tiebreak
            newState.isInTiebreak = true;
            newState.isInSuperTiebreak = false;
            newState.team1.tiebreakScore = 0;
            newState.team2.tiebreakScore = 0;
          }
        }
      }

      // Sync sets property with setsData
      newState.sets = newSetsData;

      // Update state optimistically
      setMatchState(newState);
      setSetsData(newSetsData);

      // Update via WebSocket with rollback on error
      const updateData = createUpdateData(newState, newSetsData);

      try {
        await socketService.updateMatchState({
          tournamentId,
          matchId,
          callBy: matchState.isInTiebreak ? "tie_break_score" : "score",
          updateData,
          historyEntry: {
            type: "score",
            team: isTeam1 ? "Team 1" : "Team 2",
            action: "increment",
          },
        });
      } catch (error) {
        console.error("Error updating match state, rolling back:", error);
        // Rollback to previous state on error
        setMatchState(previousState);
        setSetsData(previousSetsData);
        // Remove the failed state from undo stack
        setUndoStack((prev) => prev.slice(0, -1));
        // Optionally show error to user
        throw error; // Re-throw to allow caller to handle if needed
      }
    },
    [matchState, matchSettings, setsData, tournamentId, matchId, socketService]
  );

  // Increment tiebreak score (specific function for tiebreak)
  const incrementTiebreakScore = useCallback(
    async (team) => {
      // Reuse incrementScore logic which handles tiebreak automatically
      await incrementScore(team);
    },
    [incrementScore]
  );

  // Add warning
  const addWarning = useCallback(
    async (team) => {
      if (!matchState || !matchSettings || !tournamentId || !matchId) return;

      const isTeam1 = team === "Team 1" || team === "team1" || team === "teamA";
      const teamKey = isTeam1 ? "team1" : "team2";
      const currentWarnings = matchState[teamKey].warnings.length;

      if (currentWarnings >= 3) return;

      const warningLevel = `W${currentWarnings + 1}`;

      try {
        await socketService.addWarning({
          tournamentId,
          matchId,
          team: teamKey,
          warningLevel,
          previousState: matchState,
        });

        // Handle consequences
        if (currentWarnings === 1) {
          // W2: Award point to opposing team
          const opposingTeam = isTeam1 ? "Team 2" : "Team 1";
          await incrementScore(opposingTeam);
        } else if (currentWarnings === 2) {
          // W3: Match ends
          setTimeout(() => {
            const winnerTeam = isTeam1 ? "Team 2" : "Team 1";
            completeMatch(winnerTeam);
          }, 1000);
        }
      } catch (error) {
        console.error("Error adding warning:", error);
      }
    },
    [
      matchState,
      matchSettings,
      tournamentId,
      matchId,
      socketService,
      incrementScore,
    ]
  );

  // Update serve
  const updateServe = useCallback(
    async (newServingPlayer, isServingTeam1) => {
      if (!tournamentId || !matchId) return;

      try {
        await socketService.updateServe({
          tournamentId,
          matchId,
          newServingPlayer,
          isServingTeam1,
        });

        // Update local state
        setMatchState((prev) => ({
          ...prev,
          currentServe: {
            servingPlayer: newServingPlayer,
            isServingTeam1,
          },
        }));
      } catch (error) {
        console.error("Error updating serve:", error);
      }
    },
    [tournamentId, matchId, socketService]
  );

  // Undo
  const undo = useCallback(async () => {
    if (undoStack.length === 0 || !tournamentId || !matchId) return;

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    // Ensure sets property exists and restore setsData
    const previousSets = previousState.sets || {};
    previousState.sets = previousSets;

    // Ensure advantageCount is initialized
    if (typeof previousState.team1.advantageCount !== "number") {
      previousState.team1.advantageCount = 0;
    }
    if (typeof previousState.team2.advantageCount !== "number") {
      previousState.team2.advantageCount = 0;
    }

    // Ensure status is properly restored - if previous state had completed status but
    // match shouldn't be completed based on current sets, reset to active
    if (previousState.status === "completed" && matchSettings) {
      const shouldBeCompleted = hasWonMatch(
        previousState.team1.sets,
        previousState.team2.sets,
        matchSettings,
        previousState.isInSuperTiebreak || false
      );
      if (!shouldBeCompleted.won) {
        // Reset to active if match shouldn't be completed based on current sets
        previousState.status = "active";
        previousState.winnerTeam = undefined;
      }
    }

    // Ensure status exists, default to active if missing
    if (!previousState.status) {
      previousState.status = "active";
    }

    setMatchState(previousState);
    setSetsData(previousSets);

    const updateData = createUpdateData(previousState, previousSets);

    try {
      await socketService.updateMatchState({
        tournamentId,
        matchId,
        callBy: "undo",
        updateData,
        historyEntry: {
          type: "undo",
          action: "restore_state",
        },
      });
    } catch (error) {
      console.error("Error undoing:", error);
    }
  }, [undoStack, tournamentId, matchId, socketService]);

  // Complete match
  const completeMatch = useCallback(
    async (winnerTeam) => {
      if (!tournamentId || !matchId) return;

      try {
        // Complete match via socket service
        await socketService.completeMatch({
          tournamentId,
          matchId,
          winnerTeam:
            winnerTeam === "Team 1" || winnerTeam === "team1"
              ? "Team 1"
              : "Team 2",
        });

        // Update local state
        setMatchState((prev) => ({
          ...prev,
          status: "completed",
          winnerTeam:
            winnerTeam === "Team 1" || winnerTeam === "team1"
              ? "Team 1"
              : "Team 2",
        }));

        // Upload match results to API (non-blocking, graceful degradation)
        try {
          if (matchState && setsData) {
            // Try to get original match for player IDs, fallback to matchState
            // const originalMatch = originalMatchRef.current;

            // Prepare match data for API upload
            // Prefer original match data for player IDs if available
            console.log("matchState", originalMatchRef.current);
            let team1Players = currentMatch.teamA?.players || [];
            let team2Players = currentMatch.teamB?.players || [];
            console.log("team1Players", team1Players);

            const matchDataForUpload = {
              id: matchId,
              tournamentScheduleId: matchId,
              team1: {
                players: team1Players,
              },
              team2: {
                players: team2Players,
              },
            };

            // Prepare results payload
            const resultsPayload = prepareMatchResults(
              matchDataForUpload,
              winnerTeam === "Team 1" || winnerTeam === "team1"
                ? "Team 1"
                : "Team 2",
              setsData
            );

            // Upload to API
            const uploadResponse = await umpireAPI.updateTournamentMatchResult(
              resultsPayload
            );

            if (uploadResponse.success) {
              console.log(
                "Match results uploaded successfully:",
                uploadResponse.message
              );
            } else {
              console.warn(
                "Match results upload failed:",
                uploadResponse.error || uploadResponse.message
              );
            }
          } else {
            console.warn(
              "Cannot upload match results: matchState or setsData is missing"
            );
          }
        } catch (uploadError) {
          // Log error but don't block match completion
          console.error("Error uploading match results to API:", uploadError);
        }
      } catch (error) {
        console.error("Error completing match:", error);
      }
    },
    [tournamentId, matchId, socketService, matchState, setsData]
  );

  // Reset match
  const resetMatch = useCallback(
    async (match, settings) => {
      if (!tournamentId || !matchId) return;

      const resetData = {
        "team1.score": 0,
        "team2.score": 0,
        "team1.sets": 0,
        "team2.sets": 0,
        "team1.tiebreakScore": 0,
        "team2.tiebreakScore": 0,
        isInTiebreak: false,
        isInSuperTiebreak: false,
        status: "active",
        winnerTeam: "",
        "team1.warnings": [],
        "team2.warnings": [],
        totalGamesPlayed: 0,
        sets: {},
      };

      const newState = initializeMatchState(
        match?.team1?.players || match?.teamA?.players || [],
        match?.team2?.players || match?.teamB?.players || []
      );

      const resetSets = initializeSetsData(settings?.numberOfSets || 3);
      newState.sets = resetSets;

      setMatchState(newState);
      setSetsData(resetSets);
      setUndoStack([]);

      try {
        await socketService.resetMatch({
          tournamentId,
          matchId,
          resetData,
        });
      } catch (error) {
        console.error("Error resetting match:", error);
      }
    },
    [tournamentId, matchId, socketService]
  );

  // Get match winner (helper)
  const getMatchWinner = useCallback(() => {
    if (!matchState) return null;
    if (matchState.status === "completed" && matchState.winnerTeam) {
      return matchState.winnerTeam;
    }
    return null;
  }, [matchState]);

  // Check if match is complete
  const isMatchComplete = useCallback(() => {
    if (!matchState) return false;
    return matchState.status === "completed";
  }, [matchState]);

  // Start super tiebreak manually
  const startSuperTiebreak = useCallback(async () => {
    if (!matchState || !matchSettings || !tournamentId || !matchId) return;

    // Only allow if match format supports it
    if (matchSettings.matchFormat !== MatchFormat.TWO_SETS_SUPER_TIEBREAK) {
      console.warn("Super tiebreak not supported for this match format");
      return;
    }

    // Only allow if sets are 1-1
    if (matchState.team1.sets !== 1 || matchState.team2.sets !== 1) {
      console.warn("Super tiebreak can only start at 1-1 sets");
      return;
    }

    const newState = JSON.parse(JSON.stringify(matchState));
    newState.isInTiebreak = true;
    newState.isInSuperTiebreak = true;
    newState.team1.tiebreakScore = 0;
    newState.team2.tiebreakScore = 0;

    setMatchState(newState);

    try {
      await socketService.updateMatchState({
        tournamentId,
        matchId,
        callBy: "start_super_tiebreak",
        updateData: {
          isInTiebreak: true,
          isInSuperTiebreak: true,
          "team1.tiebreakScore": 0,
          "team2.tiebreakScore": 0,
        },
        historyEntry: {
          type: "super_tiebreak",
          action: "start",
        },
      });
    } catch (error) {
      console.error("Error starting super tiebreak:", error);
      // Rollback on error
      setMatchState(matchState);
    }
  }, [matchState, matchSettings, tournamentId, matchId, socketService]);

  // Increment set score directly
  const incrementSetScore = useCallback(
    async (setIndex, team) => {
      if (!matchState || !matchSettings || !tournamentId || !matchId) return;

      // Save state for undo - ensure sets property is included
      const stateForUndo = JSON.parse(JSON.stringify(matchState));
      stateForUndo.sets = JSON.parse(JSON.stringify(setsData)); // Ensure sets data is included
      setUndoStack((prev) => {
        const newStack = [...prev, stateForUndo];
        return newStack.slice(-MAX_UNDO_STACK_SIZE);
      });

      const isTeam1 = team === "Team 1" || team === "team1" || team === "teamA";
      let newState = JSON.parse(JSON.stringify(matchState)); // Deep clone
      let newSetsData = JSON.parse(JSON.stringify(setsData)); // Deep clone

      // Store previous state for potential rollback
      const previousState = JSON.parse(JSON.stringify(matchState));
      const previousSetsData = JSON.parse(JSON.stringify(setsData));

      const setKey = setIndex.toString();

      // Ensure set exists in sets data
      if (!newSetsData[setKey]) {
        newSetsData[setKey] = {
          team1Games: 0,
          team2Games: 0,
        };
      }

      // Increment the appropriate team's games in the specified set
      if (isTeam1) {
        newSetsData[setKey].team1Games =
          (newSetsData[setKey].team1Games || 0) + 1;
      } else {
        newSetsData[setKey].team2Games =
          (newSetsData[setKey].team2Games || 0) + 1;
      }

      // Check if this increment completes a set
      const team1Games = newSetsData[setKey].team1Games || 0;
      const team2Games = newSetsData[setKey].team2Games || 0;

      // Check if the incrementing team won the set
      const setWin = isTeam1
        ? hasWonSet(team1Games, team2Games, matchSettings)
        : hasWonSet(team2Games, team1Games, matchSettings);

      if (setWin) {
        // Team won the set - update set wins
        if (isTeam1) {
          newState.team1.sets = (newState.team1.sets || 0) + 1;
        } else {
          newState.team2.sets = (newState.team2.sets || 0) + 1;
        }

        // Check match win
        const matchWin = hasWonMatch(
          newState.team1.sets,
          newState.team2.sets,
          matchSettings,
          false
        );

        if (matchWin.won) {
          newState.status = "completed";
          newState.winnerTeam = matchWin.winner;
        } else if (
          shouldStartSuperTiebreak(
            newState.team1.sets,
            newState.team2.sets,
            matchSettings
          )
        ) {
          // Start super tiebreak
          newState.isInTiebreak = true;
          newState.isInSuperTiebreak = true;
          newState.team1.tiebreakScore = 0;
          newState.team2.tiebreakScore = 0;
        }
      }

      // Sync sets property with setsData
      newState.sets = newSetsData;

      // Update state optimistically
      setMatchState(newState);
      setSetsData(newSetsData);

      // Update via WebSocket with rollback on error
      const updateData = createUpdateData(newState, newSetsData);

      try {
        await socketService.updateMatchState({
          tournamentId,
          matchId,
          callBy: "set_score",
          updateData,
          historyEntry: {
            type: "set_score",
            team: isTeam1 ? "Team 1" : "Team 2",
            setIndex: setIndex,
            action: "increment",
          },
        });
      } catch (error) {
        console.error("Error updating set score, rolling back:", error);
        // Rollback to previous state on error
        setMatchState(previousState);
        setSetsData(previousSetsData);
        // Remove the failed state from undo stack
        setUndoStack((prev) => prev.slice(0, -1));
        // Optionally show error to user
        throw error; // Re-throw to allow caller to handle if needed
      }
    },
    [matchState, matchSettings, setsData, tournamentId, matchId, socketService]
  );

  // Update match settings
  const updateMatchSettings = useCallback(
    async (newSettings) => {
      setMatchSettings(newSettings);
      // Reinitialize sets data if numberOfSets changed
      if (newSettings.numberOfSets !== matchSettings?.numberOfSets) {
        const newSets = initializeSets(newSettings);
        setSetsData(newSets);
        // Update matchState sets property
        if (matchState) {
          setMatchState((prev) => ({
            ...prev,
            sets: newSets,
          }));
        }
      }
    },
    [matchSettings, matchState, initializeSets]
  );

  return {
    matchState,
    matchSettings,
    setsData,
    isLoading,
    loadError,
    incrementScore,
    incrementTiebreakScore,
    incrementSetScore,
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
  };
}
