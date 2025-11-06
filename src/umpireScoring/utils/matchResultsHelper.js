/**
 * Match Results Helper
 * Prepares match results data for API upload according to MATCH_RESULTS_API_GUIDE.md
 */

// Constants matching the API guide
export const TOURNAMENT_MATCH_RESULT = {
  NOT_UPLOADED: 0,
  TEAM_A_WON: 1,
  TEAM_B_WON: 2,
  TIED: 3,
  NO_RESULT: 4,
};

export const TOURNAMENT_MATCH_PLAY_STATUS = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
};

/**
 * Extract player ID from player object or string
 * @param {Object|string} player - Player object with id/name or string name
 * @param {number} index - Fallback index if no ID found
 * @returns {number} Player ID
 */
function extractPlayerId(player, index) {
  if (typeof player === "object" && player !== null) {
    // If player has an id property, use it
    if (typeof player.id === "number") {
      return player.id;
    }
    // If player has an id as string, convert to number
    if (typeof player.id === "string" && !isNaN(parseInt(player.id))) {
      return parseInt(player.id);
    }
  }
  // Fallback to index (0-based, but we'll use 1-based for safety)
  return index + 1;
}

/**
 * Get team players from match data (handles both teamA/teamB and team1/team2 formats)
 * @param {Object} matchData - Match data object
 * @param {string} teamKey - "team1" or "team2"
 * @returns {Array} Array of player objects/strings
 */
function getTeamPlayers(matchData, teamKey) {
  // Try team1/team2 first (from matchState)
  if (matchData.team1 && teamKey === "team1") {
    return matchData.team1.players || [];
  }
  if (matchData.team2 && teamKey === "team2") {
    return matchData.team2.players || [];
  }

  // Try teamA/teamB (from match object)
  if (matchData.teamA && teamKey === "team1") {
    return matchData.teamA.players || [];
  }
  if (matchData.teamB && teamKey === "team2") {
    return matchData.teamB.players || [];
  }

  return [];
}

/**
 * Validate input data
 * @param {Object} matchData - Match data
 * @param {string} winnerTeam - Winner team ("Team 1" or "Team 2")
 * @param {Object} sets - Sets data
 * @throws {Error} If validation fails
 */
function validateInputs(matchData, winnerTeam, sets) {
  if (!matchData) {
    throw new Error("Invalid match data: matchData is required");
  }

  const team1Players = getTeamPlayers(matchData, "team1");
  const team2Players = getTeamPlayers(matchData, "team2");

  if (!team1Players || team1Players.length === 0) {
    throw new Error("Invalid match data: Team 1 players are required");
  }

  if (!team2Players || team2Players.length === 0) {
    throw new Error("Invalid match data: Team 2 players are required");
  }

  if (!winnerTeam || (winnerTeam !== "Team 1" && winnerTeam !== "Team 2")) {
    throw new Error('Invalid winner team: must be "Team 1" or "Team 2"');
  }

  if (!sets || typeof sets !== "object") {
    throw new Error("Invalid sets data: sets must be an object");
  }

  // Validate match ID
  const matchId = matchData.id || matchData.tournamentScheduleId;
  if (!matchId) {
    throw new Error("Invalid match data: match ID is required");
  }
}

/**
 * Get set data with defaults
 * @param {Object} sets - Sets data object
 * @param {number} round - Round number (0-based)
 * @returns {Object} Set data with defaults
 */
function getSetData(sets, round) {
  const setKey = round.toString();
  const setData = sets[setKey] || {};

  return {
    team1Games: setData.team1Games || 0,
    team2Games: setData.team2Games || 0,
    isTiebreak: setData.isTiebreak || false,
    isSuperTiebreak: setData.isSuperTiebreak || false,
    superTieBreakScore1: setData.superTieBreakScore1 || 0,
    superTieBreakScore2: setData.superTieBreakScore2 || 0,
    tiebreakScore1: setData.tiebreakScore1 || 0,
    tiebreakScore2: setData.tiebreakScore2 || 0,
  };
}

/**
 * Prepares match results data structure for API upload
 * @param {Object} matchData - Match data containing teams and sets information
 * @param {string} winnerTeam - "Team 1" or "Team 2"
 * @param {Object} sets - Sets data object with set indices as keys
 * @returns {Object} Formatted results object ready for API
 */
export function prepareMatchResults(matchData, winnerTeam, sets) {
  // Validate inputs
  validateInputs(matchData, winnerTeam, sets);

  const results = [];
  const team1Players = getTeamPlayers(matchData, "team1");
  const team2Players = getTeamPlayers(matchData, "team2");

  const isTeam1Winner = winnerTeam === "Team 1";
  const resultType = isTeam1Winner
    ? TOURNAMENT_MATCH_RESULT.TEAM_A_WON
    : TOURNAMENT_MATCH_RESULT.TEAM_B_WON;

  // Process Team 1 players (Side A)
  team1Players.forEach((player, playerIndex) => {
    // For each set (round 1, 2, 3)
    for (let round = 0; round <= 2; round++) {
      const setsData = getSetData(sets, round);

      // For super tie-break sets, use tiebreak scores instead of games
      let team1Points = setsData.team1Games || 0;
      if (setsData.isSuperTiebreak === true) {
        team1Points = setsData.superTieBreakScore1 || 0;
      }

      results.push({
        bookingResultTmpId: 0,
        playerId: extractPlayerId(player, playerIndex),
        side: "A",
        round: round + 1,
        points: team1Points,
        gameType: 1,
        resultType: resultType,
      });
    }
  });

  // Process Team 2 players (Side B)
  team2Players.forEach((player, playerIndex) => {
    // For each set (round 1, 2, 3)
    for (let round = 0; round <= 2; round++) {
      const setsData = getSetData(sets, round);

      // For super tie-break sets, use tiebreak scores instead of games
      let team2Points = setsData.team2Games || 0;
      if (setsData.isSuperTiebreak === true) {
        team2Points = setsData.superTieBreakScore2 || 0;
      }

      results.push({
        bookingResultTmpId: 0,
        playerId: extractPlayerId(player, playerIndex),
        side: "B",
        round: round + 1,
        points: team2Points,
        gameType: 1,
        resultType: resultType,
      });
    }
  });

  // Get match ID
  const tournamentScheduleId = matchData.id || matchData.tournamentScheduleId;

  return {
    results: JSON.stringify(results),
    matchResult: resultType,
    tiebreak_results: "",
    tournamentScheduleId: parseInt(tournamentScheduleId.toString()),
    playStatus: TOURNAMENT_MATCH_PLAY_STATUS.COMPLETED,
    isReUploadResult: false,
  };
}
