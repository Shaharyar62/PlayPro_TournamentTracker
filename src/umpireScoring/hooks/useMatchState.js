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
  isValidSetScore,
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
        console.log("[SERVE] loadMatchState loaded state:", {
          loadedServe: state.currentServe,
          hasCurrentServe: !!state.currentServe,
        });

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
        // Ensure games property is initialized from current set
        const totalCompletedSets =
          (state.team1?.sets || 0) + (state.team2?.sets || 0);
        const activeSetIndex = Math.min(
          totalCompletedSets,
          (matchSettings?.numberOfSets || 3) - 1
        );
        const activeSetKey = activeSetIndex.toString();
        const activeSet = state.sets[activeSetKey] || {
          team1Games: 0,
          team2Games: 0,
        };
        if (typeof state.team1?.games !== "number") {
          state.team1.games = activeSet.team1Games || 0;
        }
        if (typeof state.team2?.games !== "number") {
          state.team2.games = activeSet.team2Games || 0;
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

        console.log("[websocket listener] Received match update:", {
          team1Score: data.team1?.score,
          team2Score: data.team2?.score,
          hasTeam1: !!data.team1,
          hasTeam2: !!data.team2,
          incomingServe: data.currentServe,
          hasCurrentServe: !!data.currentServe,
        });

        // Ensure sets property exists
        if (!data.sets) {
          data.sets = {};
        }

        setMatchState((prevState) => {
          if (prevState) {
            console.log(
              "[websocket listener] Merging state - prevState scores:",
              {
                team1Score: prevState.team1?.score,
                team2Score: prevState.team2?.score,
                prevServe: prevState.currentServe,
              }
            );
            console.log(
              "[websocket listener] Merging state - incoming data scores:",
              {
                team1Score: data.team1?.score,
                team2Score: data.team2?.score,
                incomingServe: data.currentServe,
              }
            );

            const merged = mergeMatchStates(prevState, data);
            console.log("[websocket listener] Merged state scores:", {
              team1Score: merged.team1?.score,
              team2Score: merged.team2?.score,
            });

            // Log serve state changes from websocket
            if (data.currentServe) {
              console.log("[SERVE] Websocket update changing serve:", {
                prevServe: prevState.currentServe,
                incomingServe: data.currentServe,
                mergedServe: merged.currentServe,
              });
              // Preserve serve from incoming data if it exists
              merged.currentServe = data.currentServe;
            } else if (prevState.currentServe && !data.currentServe) {
              console.warn(
                "[SERVE] WARNING: Incoming websocket data has no serve, preserving previous:",
                {
                  prevServe: prevState.currentServe,
                  mergedServe: merged.currentServe,
                }
              );
              // Preserve previous serve if incoming doesn't have one
              merged.currentServe = prevState.currentServe;
            }

            // Ensure sets property is synced
            merged.sets = data.sets || prevState.sets || {};
            // Always sync games property from current set (not just when missing)
            // This handles cases where backend sends stale games values
            const totalCompletedSets =
              (merged.team1?.sets || 0) + (merged.team2?.sets || 0);
            const activeSetIndex = Math.min(
              totalCompletedSets,
              (matchSettings?.numberOfSets || 3) - 1
            );
            const activeSetKey = activeSetIndex.toString();
            const activeSet = merged.sets[activeSetKey] || {
              team1Games: 0,
              team2Games: 0,
            };
            // Always sync from current set to ensure consistency
            if (merged.team1) {
              merged.team1.games = activeSet.team1Games || 0;
            }
            if (merged.team2) {
              merged.team2.games = activeSet.team2Games || 0;
            }
            return merged;
          }
          // For new state, always sync games property from current set
          if (data) {
            const totalCompletedSets =
              (data.team1?.sets || 0) + (data.team2?.sets || 0);
            const activeSetIndex = Math.min(
              totalCompletedSets,
              (matchSettings?.numberOfSets || 3) - 1
            );
            const activeSetKey = activeSetIndex.toString();
            const activeSet = data.sets?.[activeSetKey] || {
              team1Games: 0,
              team2Games: 0,
            };
            // Always sync from current set to ensure consistency
            if (data.team1) {
              data.team1.games = activeSet.team1Games || 0;
            }
            if (data.team2) {
              data.team2.games = activeSet.team2Games || 0;
            }
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

  // Helper function to rotate serve between teams and players
  const rotateServe = useCallback((currentState, changeTeam = true) => {
    console.log("[SERVE] rotateServe called:", {
      changeTeam,
      currentServe: currentState.currentServe,
      hasTeam1: !!currentState.team1,
      hasTeam2: !!currentState.team2,
    });

    if (!currentState.currentServe) {
      // Initialize serve if it doesn't exist
      const defaultServe = {
        servingPlayer: currentState.team1?.players?.[0]?.name || "",
        isServingTeam1: true,
      };
      console.log(
        "[SERVE] No currentServe found, initializing to default:",
        defaultServe
      );
      return defaultServe;
    }

    const currentIsServingTeam1 = currentState.currentServe.isServingTeam1;
    const currentServingPlayer = currentState.currentServe.servingPlayer || "";

    console.log("[SERVE] Current serve state:", {
      isServingTeam1: currentIsServingTeam1,
      servingPlayer: currentServingPlayer,
    });

    let newIsServingTeam1 = currentIsServingTeam1;
    let newServingPlayer = currentServingPlayer;

    if (changeTeam) {
      // Change serve to the other team
      newIsServingTeam1 = !currentIsServingTeam1;
      const newTeam = newIsServingTeam1
        ? currentState.team1
        : currentState.team2;
      const newTeamPlayers = newTeam?.players || [];

      // Get the serving order from the team (0 or 1)
      const servingOrder = newTeam?.servingOrder || 0;

      // Rotate to the other player in the team
      const newServingOrder = servingOrder === 0 ? 1 : 0;

      // Update serving order in the team
      if (newIsServingTeam1) {
        currentState.team1.servingOrder = newServingOrder;
      } else {
        currentState.team2.servingOrder = newServingOrder;
      }

      // Get the player at the new serving order
      if (newTeamPlayers.length > newServingOrder) {
        const player = newTeamPlayers[newServingOrder];
        newServingPlayer =
          typeof player === "string" ? player : player?.name || "";
      } else if (newTeamPlayers.length > 0) {
        // Fallback to first player if serving order is out of bounds
        const player = newTeamPlayers[0];
        newServingPlayer =
          typeof player === "string" ? player : player?.name || "";
      }
    } else {
      // Same team, just rotate player
      const currentTeam = currentIsServingTeam1
        ? currentState.team1
        : currentState.team2;
      const currentTeamPlayers = currentTeam?.players || [];

      if (currentTeamPlayers.length >= 2) {
        // Toggle serving order
        const currentServingOrder = currentTeam.servingOrder || 0;
        const newServingOrder = currentServingOrder === 0 ? 1 : 0;

        // Update serving order
        if (currentIsServingTeam1) {
          currentState.team1.servingOrder = newServingOrder;
        } else {
          currentState.team2.servingOrder = newServingOrder;
        }

        // Get the player at the new serving order
        const player = currentTeamPlayers[newServingOrder];
        newServingPlayer =
          typeof player === "string" ? player : player?.name || "";
      }
    }

    const newServe = {
      servingPlayer: newServingPlayer,
      isServingTeam1: newIsServingTeam1,
    };

    console.log("[SERVE] rotateServe returning new serve:", {
      from: {
        isServingTeam1: currentIsServingTeam1,
        servingPlayer: currentServingPlayer,
      },
      to: newServe,
      changeTeam,
    });

    return newServe;
  }, []);

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

        // Calculate total tiebreak points to determine serve rotation
        const totalTiebreakPoints =
          newState.team1.tiebreakScore + newState.team2.tiebreakScore;

        // In tiebreaks, serve alternates every 2 points
        // Pattern: Team A serves point 1, Team B serves points 2-3, Team A serves points 4-5, etc.
        // So we rotate serve after points 1, 3, 5, 7, etc. (odd total points)
        if (totalTiebreakPoints > 1 && totalTiebreakPoints % 2 === 1) {
          // Rotate serve between teams (but keep same player rotation within team)
          console.log("[SERVE] Tiebreak serve rotation triggered:", {
            totalTiebreakPoints,
            currentServe: newState.currentServe,
          });
          const newServe = rotateServe(newState, true);
          newState.currentServe = newServe;
          console.log("[SERVE] Tiebreak serve rotated to:", newServe);
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
            // Increment games count to 7 for the winning team (6-6 -> 7-6)
            newSetsData[activeSetKey].team1Games += 1;
            newState.team1.games = newSetsData[activeSetKey].team1Games;
            newState.team1.sets += 1;
          } else {
            // Increment games count to 7 for the winning team (6-6 -> 6-7)
            newSetsData[activeSetKey].team2Games += 1;
            newState.team2.games = newSetsData[activeSetKey].team2Games;
            newState.team2.sets += 1;
          }

          // Finalize the completed set with tiebreak data
          newSetsData[activeSetKey] = {
            ...newSetsData[activeSetKey],
            team1Games: newState.team1.games, // Final score
            team2Games: newState.team2.games, // Final score
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

          // Reset games for next set
          newState.team1.games = 0;
          newState.team2.games = 0;

          // Reset for next set
          newState.team1.score = 0;
          newState.team2.score = 0;
          newState.team1.tiebreakScore = 0;
          newState.team2.tiebreakScore = 0;
          newState.team1.advantageCount = 0;
          newState.team2.advantageCount = 0;
          newState.isInTiebreak = false;
          newState.isInSuperTiebreak = false;

          // Auto rotate serve to the other team after tiebreak set win
          console.log("[SERVE] Rotating serve after tiebreak set win:", {
            currentServe: newState.currentServe,
          });
          const newServe = rotateServe(newState, true);
          newState.currentServe = newServe;
          console.log(
            "[SERVE] Serve rotated after tiebreak set win to:",
            newServe
          );

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

            // First serve of super tiebreak goes to team that didn't serve the last game
            console.log("[SERVE] Rotating serve for super tiebreak start:", {
              currentServe: newState.currentServe,
            });
            const newServe = rotateServe(newState, true);
            newState.currentServe = newServe;
            console.log(
              "[SERVE] Serve rotated for super tiebreak start to:",
              newServe
            );
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

        console.log("[SCORING] Score increment:", {
          team: isTeam1 ? "Team 1" : "Team 2",
          oldScore: isTeam1 ? matchState.team1.score : matchState.team2.score,
          newScore,
          opponentScore,
          team1AdvantageCount: matchState.team1.advantageCount || 0,
          team2AdvantageCount: matchState.team2.advantageCount || 0,
          goldenPoint: matchSettings.goldenPoint,
          advantagesWithGoldenPoint: matchSettings.advantagesWithGoldenPoint,
        });

        // Handle returning to deuce: if opponent has advantage (>= 5) and scoring team scores, both go back to 4
        const returnedToDeuce = opponentScore >= 5 && newScore >= 4;

        if (returnedToDeuce) {
          // Both teams return to deuce (4-4)
          console.log(
            "[SCORING] Returning to deuce - resetting both scores to 4"
          );
          newState.team1.score = 4;
          newState.team2.score = 4;
          // Don't increment advantage count here - this is returning to deuce, not gaining advantage
        } else {
          // Normal scoring - update the scoring team's score
          if (isTeam1) {
            newState.team1.score = newScore;
            // Handle advantage when both teams are at 4 or higher (deuce/advantage situations)
            // When scoring team scores and both are >= 4, scoring team gains/maintains advantage
            if (opponentScore >= 4 && newScore >= 4) {
              // If coming from deuce (both at exactly 4), increment advantage count for golden point tracking
              // This is the ONLY time we increment for advantage exchanges (not when reaching 40-30, etc.)
              if (
                matchState.team1.score === 4 &&
                matchState.team2.score === 4
              ) {
                const oldCount = matchState.team1.advantageCount || 0;
                newState.team1.advantageCount = oldCount + 1;
                console.log(
                  "[SCORING] Team 1 gained advantage from deuce - advantageCount:",
                  oldCount,
                  "->",
                  newState.team1.advantageCount
                );
              }
              // Reset opponent's advantage count when scoring team gains advantage
              // BUT: Don't reset if golden point is enabled with advantages threshold (need to track total exchanges)
              if (
                newScore > opponentScore &&
                !(
                  matchSettings.goldenPoint &&
                  matchSettings.advantagesWithGoldenPoint > 0
                )
              ) {
                newState.team2.advantageCount = 0;
              }
            }
          } else {
            newState.team2.score = newScore;
            // Handle advantage when both teams are at 4 or higher (deuce/advantage situations)
            // When scoring team scores and both are >= 4, scoring team gains/maintains advantage
            if (opponentScore >= 4 && newScore >= 4) {
              // If coming from deuce (both at exactly 4), increment advantage count for golden point tracking
              // This is the ONLY time we increment for advantage exchanges (not when reaching 40-30, etc.)
              console.log(
                "[SCORING] Team 2 scoring at deuce/advantage - checking deuce condition:",
                {
                  team1OldScore: matchState.team1.score,
                  team2OldScore: matchState.team2.score,
                  isDeuce:
                    matchState.team2.score === 4 &&
                    matchState.team1.score === 4,
                }
              );
              if (
                matchState.team2.score === 4 &&
                matchState.team1.score === 4
              ) {
                const oldCount = matchState.team2.advantageCount || 0;
                newState.team2.advantageCount = oldCount + 1;
                console.log(
                  "[SCORING] Team 2 gained advantage from deuce - advantageCount:",
                  oldCount,
                  "->",
                  newState.team2.advantageCount
                );
              } else {
                console.log(
                  "[SCORING] Team 2 did NOT gain advantage from deuce - old scores were:",
                  matchState.team1.score,
                  "-",
                  matchState.team2.score
                );
              }
              // Reset opponent's advantage count when scoring team gains advantage
              // BUT: Don't reset if golden point is enabled with advantages threshold (need to track total exchanges)
              if (
                newScore > opponentScore &&
                !(
                  matchSettings.goldenPoint &&
                  matchSettings.advantagesWithGoldenPoint > 0
                )
              ) {
                newState.team1.advantageCount = 0;
              }
            }
          }
        }

        // Get current advantage count for winning check
        // Sum both teams' counts to get total advantage exchanges
        const totalAdvantageExchanges =
          (newState.team1.advantageCount || 0) +
          (newState.team2.advantageCount || 0);
        const currentAdvantageCount = isTeam1
          ? newState.team1.advantageCount || 0
          : newState.team2.advantageCount || 0;

        // Use updated scores for win check (in case we returned to deuce)
        const finalTeamScore = newState.team1.score;
        const finalOpponentScore = newState.team2.score;

        console.log("[SCORING] Win check:", {
          scoringTeam: isTeam1 ? "Team 1" : "Team 2",
          teamScore: isTeam1 ? finalTeamScore : finalOpponentScore,
          opponentScore: isTeam1 ? finalOpponentScore : finalTeamScore,
          team1AdvantageCount: newState.team1.advantageCount || 0,
          team2AdvantageCount: newState.team2.advantageCount || 0,
          totalAdvantageExchanges,
          advantagesWithGoldenPoint: matchSettings.advantagesWithGoldenPoint,
          goldenPoint: matchSettings.goldenPoint,
        });

        // Check game win - pass total exchanges for threshold checking
        const won = hasWonGame(
          isTeam1 ? finalTeamScore : finalOpponentScore,
          isTeam1 ? finalOpponentScore : finalTeamScore,
          totalAdvantageExchanges, // Use total exchanges instead of individual count
          matchSettings
        );

        console.log("[SCORING] Win check result:", won);

        if (won) {
          // Team won the game - update active set's games count
          if (isTeam1) {
            newSetsData[activeSetKey].team1Games += 1;
            newState.team1.games = newSetsData[activeSetKey].team1Games;
          } else {
            newSetsData[activeSetKey].team2Games += 1;
            newState.team2.games = newSetsData[activeSetKey].team2Games;
          }

          // Reset scores and advantage counts for next game
          newState.team1.score = 0;
          newState.team2.score = 0;
          newState.team1.advantageCount = 0;
          newState.team2.advantageCount = 0;

          // Auto rotate serve to the other team after game win
          console.log("[SERVE] Rotating serve after game win:", {
            currentServe: newState.currentServe,
            team1Games: newSetsData[activeSetKey].team1Games,
            team2Games: newSetsData[activeSetKey].team2Games,
          });
          const newServe = rotateServe(newState, true);
          newState.currentServe = newServe;
          console.log("[SERVE] Serve rotated after game win to:", newServe);

          // Check set win or tiebreak using games from active set
          const team1Games = newSetsData[activeSetKey].team1Games;
          const team2Games = newSetsData[activeSetKey].team2Games;
          const setWin = hasWonSet(
            isTeam1 ? team1Games : team2Games,
            isTeam1 ? team2Games : team1Games,
            matchSettings
          );

          if (setWin) {
            // Finalize the completed set
            newSetsData[activeSetKey] = {
              ...newSetsData[activeSetKey],
              team1Games: newState.team1.games, // Final score
              team2Games: newState.team2.games, // Final score
            };

            // Team won the set
            if (isTeam1) {
              newState.team1.sets += 1;
            } else {
              newState.team2.sets += 1;
            }

            // Reset games for next set
            newState.team1.games = 0;
            newState.team2.games = 0;

            // Reset advantage counts
            newState.team1.advantageCount = 0;
            newState.team2.advantageCount = 0;

            // Auto rotate serve to the other team after set win
            console.log("[SERVE] Rotating serve after set win:", {
              currentServe: newState.currentServe,
              team1Sets: newState.team1.sets,
              team2Sets: newState.team2.sets,
            });
            const newServe = rotateServe(newState, true);
            newState.currentServe = newServe;
            console.log("[SERVE] Serve rotated after set win to:", newServe);

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

            // First serve of tiebreak goes to team that didn't serve the last game
            console.log("[SERVE] Rotating serve for tiebreak start:", {
              currentServe: newState.currentServe,
              team1Games,
              team2Games,
            });
            const newServe = rotateServe(newState, true);
            newState.currentServe = newServe;
            console.log(
              "[SERVE] Serve rotated for tiebreak start to:",
              newServe
            );
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

      // Log serve state being sent to websocket
      console.log("[SERVE] Sending serve update to websocket:", {
        serveInUpdateData: {
          servingPlayer: updateData["currentServe.servingPlayer"],
          isServingTeam1: updateData["currentServe.isServingTeam1"],
        },
        newStateServe: newState.currentServe,
        updateDataKeys: Object.keys(updateData),
      });

      // Track if serve was rotated so we can send separate update_serve event
      const serveWasRotated =
        matchState.currentServe?.isServingTeam1 !==
          newState.currentServe?.isServingTeam1 ||
        matchState.currentServe?.servingPlayer !==
          newState.currentServe?.servingPlayer;

      try {
        // Send score update
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

        // If serve was rotated, also send separate serve update to ensure server processes it
        if (serveWasRotated && newState.currentServe) {
          console.log(
            "[SERVE] Serve was rotated, sending separate update_serve event:",
            {
              servingPlayer: newState.currentServe.servingPlayer,
              isServingTeam1: newState.currentServe.isServingTeam1,
            }
          );
          await socketService.updateServe({
            tournamentId,
            matchId,
            newServingPlayer: newState.currentServe.servingPlayer,
            isServingTeam1: newState.currentServe.isServingTeam1,
          });
        }
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
    [
      matchState,
      matchSettings,
      setsData,
      tournamentId,
      matchId,
      socketService,
      rotateServe,
    ]
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
        console.log("[SERVE] updateServe (manual) updating serve:", {
          prevServe: matchState?.currentServe,
          newServe: {
            servingPlayer: newServingPlayer,
            isServingTeam1,
          },
        });
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
    // Ensure games property is initialized from current set
    const totalCompletedSets =
      (previousState.team1?.sets || 0) + (previousState.team2?.sets || 0);
    const activeSetIndex = Math.min(
      totalCompletedSets,
      (matchSettings?.numberOfSets || 3) - 1
    );
    const activeSetKey = activeSetIndex.toString();
    const activeSet = previousSets[activeSetKey] || {
      team1Games: 0,
      team2Games: 0,
    };
    if (typeof previousState.team1?.games !== "number") {
      previousState.team1.games = activeSet.team1Games || 0;
    }
    if (typeof previousState.team2?.games !== "number") {
      previousState.team2.games = activeSet.team2Games || 0;
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

    // First serve of super tiebreak goes to team that didn't serve the last game
    console.log("[SERVE] startSuperTiebreak rotating serve:", {
      currentServe: newState.currentServe,
    });
    const newServe = rotateServe(newState, true);
    newState.currentServe = newServe;
    console.log("[SERVE] startSuperTiebreak serve rotated to:", newServe);

    setMatchState(newState);

    // Create update data with serve included
    const updateData = createUpdateData(newState, setsData);
    updateData.isInTiebreak = true;
    updateData.isInSuperTiebreak = true;
    updateData["team1.tiebreakScore"] = 0;
    updateData["team2.tiebreakScore"] = 0;

    console.log(
      "[SERVE] startSuperTiebreak sending serve update to websocket:",
      {
        serveInUpdateData: {
          servingPlayer: updateData["currentServe.servingPlayer"],
          isServingTeam1: updateData["currentServe.isServingTeam1"],
        },
        newStateServe: newState.currentServe,
      }
    );

    // Track if serve was rotated
    const serveWasRotated =
      matchState.currentServe?.isServingTeam1 !==
        newState.currentServe?.isServingTeam1 ||
      matchState.currentServe?.servingPlayer !==
        newState.currentServe?.servingPlayer;

    try {
      // Send super tiebreak update
      await socketService.updateMatchState({
        tournamentId,
        matchId,
        callBy: "start_super_tiebreak",
        updateData,
        historyEntry: {
          type: "super_tiebreak",
          action: "start",
        },
      });

      // If serve was rotated, also send separate serve update
      if (serveWasRotated && newState.currentServe) {
        console.log(
          "[SERVE] startSuperTiebreak serve was rotated, sending separate update_serve event:",
          {
            servingPlayer: newState.currentServe.servingPlayer,
            isServingTeam1: newState.currentServe.isServingTeam1,
          }
        );
        await socketService.updateServe({
          tournamentId,
          matchId,
          newServingPlayer: newState.currentServe.servingPlayer,
          isServingTeam1: newState.currentServe.isServingTeam1,
        });
      }
    } catch (error) {
      console.error("Error starting super tiebreak:", error);
      // Rollback on error
      setMatchState(matchState);
    }
  }, [
    matchState,
    matchSettings,
    tournamentId,
    matchId,
    socketService,
    rotateServe,
    setsData,
  ]);

  // Recalculate set wins based on current set scores
  const recalculateSetWins = useCallback((setsData, matchSettings) => {
    let team1Sets = 0;
    let team2Sets = 0;

    // Iterate through all sets - ensure we check all sets up to numberOfSets
    const numberOfSets = matchSettings?.numberOfSets || 3;
    for (let i = 0; i < numberOfSets; i++) {
      const setKey = i.toString();
      const set = setsData?.[setKey];

      // Skip if set doesn't exist
      if (!set) continue;

      const team1Games = set.team1Games || 0;
      const team2Games = set.team2Games || 0;

      // Check if set is won by games score (6-0, 6-1, 6-2, 6-3, 6-4, 7-5)
      const team1Won = hasWonSet(team1Games, team2Games, matchSettings);
      const team2Won = hasWonSet(team2Games, team1Games, matchSettings);

      // OR check if set is completed via tiebreak (6-6 with tiebreak = completed set)
      // If isTiebreak is true, the set is complete and the winner is determined by the final score
      // In tiebreak sets, the final score is 7-6 (one team has 7 games)
      const isTiebreakSet = set.isTiebreak || set.isSuperTiebreak;
      if (isTiebreakSet) {
        // For tiebreak sets, check games first (should be 7-6 or 6-7)
        if (team1Games > team2Games) {
          team1Sets++;
        } else if (team2Games > team1Games) {
          team2Sets++;
        } else if (team1Games === 6 && team2Games === 6) {
          // If games are still 6-6, check tiebreak scores to determine winner
          // The winner of the tiebreak gets the set, so final score is 7-6
          const tiebreakScore1 = set.isSuperTiebreak
            ? set.superTieBreakScore1 || 0
            : set.tiebreakScore1 || 0;
          const tiebreakScore2 = set.isSuperTiebreak
            ? set.superTieBreakScore2 || 0
            : set.tiebreakScore2 || 0;
          if (tiebreakScore1 > tiebreakScore2) {
            team1Sets++;
          } else if (tiebreakScore2 > tiebreakScore1) {
            team2Sets++;
          }
        }
      } else if (team1Won) {
        team1Sets++;
      } else if (team2Won) {
        team2Sets++;
      }
    }

    return { team1Sets, team2Sets };
  }, []);

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

      // Calculate active set index to determine if we're editing the current set
      const totalCompletedSets =
        (matchState.team1.sets || 0) + (matchState.team2.sets || 0);
      const activeSetIndex = Math.min(
        totalCompletedSets,
        (matchSettings.numberOfSets || 3) - 1
      );
      const isCurrentSet = setIndex === activeSetIndex;

      // Calculate what the new scores would be
      const currentTeam1Games = newSetsData[setKey].team1Games || 0;
      const currentTeam2Games = newSetsData[setKey].team2Games || 0;
      const newTeam1Games = isTeam1 ? currentTeam1Games + 1 : currentTeam1Games;
      const newTeam2Games = isTeam1 ? currentTeam2Games : currentTeam2Games + 1;

      console.log(
        `[incrementSetScore] Current score: ${currentTeam1Games}-${currentTeam2Games}, New score would be: ${newTeam1Games}-${newTeam2Games}, Team: ${team}`
      );

      // Check if the set is already won with current score
      const currentTeam1Won = hasWonSet(
        currentTeam1Games,
        currentTeam2Games,
        matchSettings
      );
      const currentTeam2Won = hasWonSet(
        currentTeam2Games,
        currentTeam1Games,
        matchSettings
      );
      const setAlreadyWon = currentTeam1Won || currentTeam2Won;

      console.log(
        `[incrementSetScore] Set already won: ${setAlreadyWon} (Team1: ${currentTeam1Won}, Team2: ${currentTeam2Won})`
      );

      // If the set is already won, prevent further increments
      if (setAlreadyWon) {
        console.log(
          `[incrementSetScore] Set already won, preventing increment. Current: ${currentTeam1Games}-${currentTeam2Games}`
        );
        return; // Prevent increments after set is won
      }

      // Validate the new set score before incrementing
      const currentSetData = newSetsData[setKey];
      const isValid = isValidSetScore(
        newTeam1Games,
        newTeam2Games,
        matchSettings,
        currentSetData
      );

      console.log(
        `[incrementSetScore] Validation result: ${isValid} for score ${newTeam1Games}-${newTeam2Games}`
      );

      // If the new score is invalid, prevent the increment
      if (!isValid) {
        console.log(
          `[incrementSetScore] Invalid set score prevented: ${newTeam1Games}-${newTeam2Games}`
        );
        return; // Silently prevent invalid increments
      }

      // Increment the appropriate team's games in the specified set
      if (isTeam1) {
        newSetsData[setKey].team1Games = newTeam1Games;
        // If this is the current set, also update team1.games
        if (isCurrentSet) {
          newState.team1.games = newSetsData[setKey].team1Games;
        }
      } else {
        newSetsData[setKey].team2Games = newTeam2Games;
        // If this is the current set, also update team2.games
        if (isCurrentSet) {
          newState.team2.games = newSetsData[setKey].team2Games;
        }
      }

      // Recalculate all set wins from scratch based on current set scores
      const { team1Sets, team2Sets } = recalculateSetWins(
        newSetsData,
        matchSettings
      );

      // Update set wins in state
      newState.team1.sets = team1Sets;
      newState.team2.sets = team2Sets;

      // Check if this increment completed a set (for resetting games if current set)
      const team1Games = newSetsData[setKey].team1Games || 0;
      const team2Games = newSetsData[setKey].team2Games || 0;
      const setWin = isTeam1
        ? hasWonSet(team1Games, team2Games, matchSettings)
        : hasWonSet(team2Games, team1Games, matchSettings);
      const isTiebreakSet =
        newSetsData[setKey].isTiebreak || newSetsData[setKey].isSuperTiebreak;
      const setCompleted = setWin || isTiebreakSet;

      if (setCompleted && isCurrentSet) {
        // If this was the current set and it's now complete, reset games for next set
        newState.team1.games = 0;
        newState.team2.games = 0;
      }

      // Check match win based on recalculated set wins
      // Important: Pass false for inSuperTieBreak since we're checking completed sets, not active super tiebreak
      const matchWin = hasWonMatch(team1Sets, team2Sets, matchSettings, false);

      if (matchWin.won) {
        newState.status = "completed";
        newState.winnerTeam = matchWin.winner;
      } else if (
        shouldStartSuperTiebreak(team1Sets, team2Sets, matchSettings)
      ) {
        // Start super tiebreak
        newState.isInTiebreak = true;
        newState.isInSuperTiebreak = true;
        newState.team1.tiebreakScore = 0;
        newState.team2.tiebreakScore = 0;
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
    [
      matchState,
      matchSettings,
      setsData,
      tournamentId,
      matchId,
      socketService,
      recalculateSetWins,
      isValidSetScore,
    ]
  );

  // Reset scores to 0 (for entering set score editing mode)
  const resetScores = useCallback(async () => {
    console.log("[resetScores] Function called");
    if (!matchState || !matchSettings || !tournamentId || !matchId) {
      console.log("[resetScores] Early return - missing dependencies", {
        matchState: !!matchState,
        matchSettings: !!matchSettings,
        tournamentId,
        matchId,
      });
      return;
    }

    console.log("[resetScores] Current scores before reset:", {
      team1Score: matchState.team1?.score,
      team2Score: matchState.team2?.score,
    });

    // Save state for undo - ensure sets property is included
    const stateForUndo = JSON.parse(JSON.stringify(matchState));
    stateForUndo.sets = JSON.parse(JSON.stringify(setsData)); // Ensure sets data is included
    setUndoStack((prev) => {
      const newStack = [...prev, stateForUndo];
      return newStack.slice(-MAX_UNDO_STACK_SIZE);
    });

    let newState = JSON.parse(JSON.stringify(matchState)); // Deep clone
    let newSetsData = JSON.parse(JSON.stringify(setsData)); // Deep clone

    // Store previous state for potential rollback
    const previousState = JSON.parse(JSON.stringify(matchState));
    const previousSetsData = JSON.parse(JSON.stringify(setsData));

    // Reset scores to 0 for both teams
    newState.team1.score = 0;
    newState.team2.score = 0;

    console.log("[resetScores] Scores reset in newState:", {
      team1Score: newState.team1.score,
      team2Score: newState.team2.score,
    });

    // Sync sets property with setsData
    newState.sets = newSetsData;

    // Update state optimistically
    console.log("[resetScores] Updating state optimistically");
    setMatchState(newState);
    setSetsData(newSetsData);

    // Update via WebSocket with rollback on error
    const updateData = createUpdateData(newState, newSetsData);
    console.log("[resetScores] WebSocket updateData:", {
      "team1.score": updateData["team1.score"],
      "team2.score": updateData["team2.score"],
      updateData,
    });

    try {
      console.log("[resetScores] Sending WebSocket update");
      await socketService.updateMatchState({
        tournamentId,
        matchId,
        callBy: "reset_score",
        updateData,
        historyEntry: {
          type: "reset_score",
          action: "reset_scores_for_editing",
        },
      });
      console.log("[resetScores] WebSocket update sent successfully");
    } catch (error) {
      console.error(
        "[resetScores] Error resetting scores, rolling back:",
        error
      );
      // Rollback to previous state on error
      setMatchState(previousState);
      setSetsData(previousSetsData);
      // Remove the failed state from undo stack
      setUndoStack((prev) => prev.slice(0, -1));
      // Optionally show error to user
      throw error; // Re-throw to allow caller to handle if needed
    }
  }, [
    matchState,
    matchSettings,
    setsData,
    tournamentId,
    matchId,
    socketService,
  ]);

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
    resetScores,
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
