/**
 * Helper functions for match state transformations and validation
 */

/**
 * Initialize empty match state
 * @param {Array} team1Players - Array of Player objects
 * @param {Array} team2Players - Array of Player objects
 * @returns {Object} Initial MatchState object
 */
export function initializeMatchState(team1Players, team2Players) {
  return {
    team1: {
      score: 0,
      games: 0,
      sets: 0,
      tiebreakScore: 0,
      advantageCount: 0,
      players: team1Players || [],
      warnings: [],
      servingOrder: 0,
    },
    team2: {
      score: 0,
      games: 0,
      sets: 0,
      tiebreakScore: 0,
      advantageCount: 0,
      players: team2Players || [],
      warnings: [],
      servingOrder: 0,
    },
    sets: {},
    isInTiebreak: false,
    isInSuperTiebreak: false,
    currentServe: {
      servingPlayer: team1Players?.[0]?.name || "",
      isServingTeam1: true,
    },
    totalGamesPlayed: 0,
    status: "active",
  };
}

/**
 * Initialize sets data structure
 * @param {number} numberOfSets - Number of sets in match
 * @returns {Record<string, SetData>} Empty sets object
 */
export function initializeSetsData(numberOfSets) {
  const sets = {};
  for (let i = 0; i < numberOfSets; i++) {
    sets[i.toString()] = {
      team1Games: 0,
      team2Games: 0,
    };
  }
  return sets;
}

/**
 * Convert legacy score format to MatchState format
 * @param {Object} legacyScores - Old format: { teamA: {...}, teamB: {...} }
 * @param {Array} team1Players - Team 1 players
 * @param {Array} team2Players - Team 2 players
 * @returns {Object} MatchState format
 */
export function convertLegacyScoresToMatchState(
  legacyScores,
  team1Players,
  team2Players
) {
  if (!legacyScores) {
    return initializeMatchState(team1Players, team2Players);
  }

  const teamA = legacyScores.teamA || {
    sets: [0, 0, 0],
    games: [0, 0, 0],
    points: 0,
  };
  const teamB = legacyScores.teamB || {
    sets: [0, 0, 0],
    games: [0, 0, 0],
    points: 0,
  };

  // Calculate total sets won
  const setsWonA = teamA.sets.filter((set) => set >= 6).length;
  const setsWonB = teamB.sets.filter((set) => set >= 6).length;

  // Find current set index (first incomplete set)
  let currentSetIndex = 0;
  for (let i = 0; i < 3; i++) {
    if (teamA.sets[i] < 6 && teamB.sets[i] < 6) {
      currentSetIndex = i;
      break;
    }
  }

  // Populate sets object from legacy format
  const sets = {};
  for (let i = 0; i < 3; i++) {
    sets[i.toString()] = {
      team1Games: teamA.games[i] || 0,
      team2Games: teamB.games[i] || 0,
    };
  }

  // Get current set games from the active set
  const currentSetGames = sets[currentSetIndex.toString()] || {
    team1Games: 0,
    team2Games: 0,
  };

  return {
    team1: {
      score: teamA.points || 0,
      games: currentSetGames.team1Games || 0,
      sets: setsWonA,
      tiebreakScore: 0, // Legacy format doesn't have tiebreak scores
      advantageCount: 0,
      players: team1Players || [],
      warnings: [],
      servingOrder: 0,
    },
    team2: {
      score: teamB.points || 0,
      games: currentSetGames.team2Games || 0,
      sets: setsWonB,
      tiebreakScore: 0,
      advantageCount: 0,
      players: team2Players || [],
      warnings: [],
      servingOrder: 0,
    },
    sets: sets,
    isInTiebreak: false,
    isInSuperTiebreak: false,
    currentServe: {
      servingPlayer: team1Players?.[0]?.name || "",
      isServingTeam1: true,
    },
    totalGamesPlayed: 0,
    status: "active",
  };
}

/**
 * Validate match state structure
 * @param {Object} matchState - MatchState to validate
 * @returns {boolean} True if valid
 */
export function validateMatchState(matchState) {
  if (!matchState) return false;
  if (!matchState.team1 || !matchState.team2) return false;
  if (typeof matchState.team1.score !== "number") return false;
  if (typeof matchState.team2.score !== "number") return false;
  if (typeof matchState.team1.sets !== "number") return false;
  if (typeof matchState.team2.sets !== "number") return false;
  return true;
}

/**
 * Create update data object for WebSocket update_match_state event
 * @param {Object} matchState - Updated match state
 * @param {Record<string, SetData>} setsData - Updated sets data
 * @returns {Record<string, any>} Update data for WebSocket
 */
export function createUpdateData(matchState, setsData) {
  const updateData = {
    "team1.score": matchState.team1.score,
    "team2.score": matchState.team2.score,
    "team1.games": matchState.team1.games || 0,
    "team2.games": matchState.team2.games || 0,
    "team1.sets": matchState.team1.sets,
    "team2.sets": matchState.team2.sets,
    "team1.tiebreakScore": matchState.team1.tiebreakScore,
    "team2.tiebreakScore": matchState.team2.tiebreakScore,
    isInTiebreak: matchState.isInTiebreak,
    isInSuperTiebreak: matchState.isInSuperTiebreak,
    sets: setsData,
  };

  // Always include status and winnerTeam, not just when completed
  updateData.status = matchState.status || "active";
  if (matchState.status === "completed" && matchState.winnerTeam) {
    updateData.winnerTeam = matchState.winnerTeam;
  } else {
    // Explicitly clear winnerTeam when status is active
    updateData.winnerTeam = "";
  }

  if (matchState.currentServe) {
    updateData["currentServe.servingPlayer"] =
      matchState.currentServe.servingPlayer;
    updateData["currentServe.isServingTeam1"] =
      matchState.currentServe.isServingTeam1;
    console.log("[createUpdateData] Including serve in update:", {
      servingPlayer: updateData["currentServe.servingPlayer"],
      isServingTeam1: updateData["currentServe.isServingTeam1"],
    });
  } else {
    console.warn(
      "[createUpdateData] WARNING: No currentServe in matchState, serve not included in update!"
    );
  }

  return updateData;
}

/**
 * Merge server state with local state (conflict resolution)
 * @param {Object} localState - Local match state
 * @param {Object} serverState - Server match state
 * @returns {Object} Merged state (server takes precedence)
 */
export function mergeMatchStates(localState, serverState) {
  if (!serverState) return localState;
  if (!localState) return serverState;

  console.log("[mergeMatchStates] Merging states:", {
    localTeam1Score: localState.team1?.score,
    localTeam2Score: localState.team2?.score,
    serverTeam1Score: serverState.team1?.score,
    serverTeam2Score: serverState.team2?.score,
    localServe: localState.currentServe,
    serverServe: serverState.currentServe,
  });

  // Determine score merge logic:
  // - If local scores are 0 (reset) and server scores are > 0, preserve the reset (0)
  // - If server scores are 0 (reset), use server (0)
  // - Otherwise, use server score if provided, else keep local
  const shouldPreserveReset =
    localState.team1?.score === 0 &&
    localState.team2?.score === 0 &&
    (serverState.team1?.score ?? 0) > 0 &&
    (serverState.team2?.score ?? 0) > 0 &&
    !localState.isInTiebreak &&
    !serverState.isInTiebreak;

  console.log("[mergeMatchStates] Should preserve reset:", shouldPreserveReset);

  // Server state takes precedence
  const merged = {
    ...localState,
    ...serverState,
    team1: {
      ...localState.team1,
      ...serverState.team1,
      // Preserve reset scores (0) if local has reset and server has old values
      score: shouldPreserveReset
        ? 0
        : serverState.team1?.score !== undefined
        ? serverState.team1.score
        : localState.team1?.score,
      advantageCount:
        serverState.team1?.advantageCount ??
        localState.team1?.advantageCount ??
        0,
      games: serverState.team1?.games ?? localState.team1?.games ?? 0,
    },
    team2: {
      ...localState.team2,
      ...serverState.team2,
      // Preserve reset scores (0) if local has reset and server has old values
      score: shouldPreserveReset
        ? 0
        : serverState.team2?.score !== undefined
        ? serverState.team2.score
        : localState.team2?.score,
      advantageCount:
        serverState.team2?.advantageCount ??
        localState.team2?.advantageCount ??
        0,
      games: serverState.team2?.games ?? localState.team2?.games ?? 0,
    },
    sets: serverState.sets || localState.sets || {},
  };

  // Handle serve state: prefer server if it exists, otherwise preserve local
  if (serverState.currentServe) {
    merged.currentServe = serverState.currentServe;
    console.log(
      "[mergeMatchStates] Using server serve:",
      serverState.currentServe
    );
  } else if (localState.currentServe) {
    merged.currentServe = localState.currentServe;
    console.log(
      "[mergeMatchStates] Preserving local serve:",
      localState.currentServe
    );
  } else {
    console.warn(
      "[mergeMatchStates] WARNING: No serve state in either local or server!"
    );
  }

  console.log("[mergeMatchStates] Merged scores:", {
    team1Score: merged.team1?.score,
    team2Score: merged.team2?.score,
    mergedServe: merged.currentServe,
  });

  return merged;
}
