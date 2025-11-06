/**
 * Transform API match data to UI format
 * Maps GetUmpireMasterTournamentCourtsSchedule response to match UI structure
 */

/**
 * Map playStatus to UI status
 * @param {number|null} playStatus - API playStatus enum (0=Pending, 1=InProgress, 2=Completed, null/undefined=upcoming)
 * @returns {string} UI status ('upcoming', 'live', 'completed')
 */
const mapPlayStatusToUIStatus = (playStatus) => {
  if (playStatus === 0) return "upcoming"; // Pending
  if (playStatus === 1) return "live"; // In_Progress
  if (playStatus === 2) return "completed"; // Completed
  return "upcoming"; // null or undefined fallback
};

/**
 * Map stageType to readable format
 * @param {number} stageType - API stageType
 * @returns {string} Stage type label
 */
const mapStageType = (stageType) => {
  const stageTypeMap = {
    1: "Group Match",
    2: "Quarter Final",
    3: "Semi Final",
    4: "Final",
  };
  return stageTypeMap[stageType] || "Match";
};

/**
 * Map matchResult to readable format
 * @param {number} matchResult - API matchResult
 * @returns {string} Match result label
 */
const mapMatchResult = (matchResult) => {
  const resultMap = {
    1: "Team A Won",
    2: "Team B Won",
    3: "Tied",
    4: "No Result",
  };
  return resultMap[matchResult] || null;
};

/**
 * Extract player names from players array
 * @param {Array} players - Array of player objects with playerName
 * @returns {Array} Array of player names
 */
const extractPlayerNames = (players) => {
  if (!players || !Array.isArray(players)) return [];
  return players
    .map((player) => player.playerName || player.name || "")
    .filter(Boolean);
};

/**
 * Transform a single match from API format to UI format
 * @param {Object} apiMatch - Match object from API
 * @param {Object} tournament - Tournament object with name
 * @returns {Object} Transformed match object for UI
 */
const transformMatch = (apiMatch, tournament = null) => {
  if (!apiMatch) return null;

  const status = mapPlayStatusToUIStatus(apiMatch.playStatus);

  // Extract team data
  const teamA = apiMatch.teamA || {};
  const teamB = apiMatch.teamB || {};

  // Get tournament name from match or tournament object
  const tournamentName =
    tournament?.name || apiMatch.tournament?.name || "Tournament";

  // Extract round/group information
  const round = apiMatch.group || mapStageType(apiMatch.stageType) || "Match";
  const stageType = mapStageType(apiMatch.stageType);
  const matchResult = mapMatchResult(apiMatch.matchResult);

  // Parse results to extract set scores
  let setScores = {
    teamA: { sets: [0, 0, 0], games: [0, 0, 0], points: 0 },
    teamB: { sets: [0, 0, 0], games: [0, 0, 0], points: 0 },
  };
  let setsWonA = 0;
  let setsWonB = 0;

  if (apiMatch.results) {
    try {
      const results =
        typeof apiMatch.results === "string"
          ? JSON.parse(apiMatch.results)
          : apiMatch.results;

      if (Array.isArray(results)) {
        // Group results by round (set) and side
        // Each round has multiple entries (one per player), so we need to get the unique points value
        const setData = {};

        results.forEach((result) => {
          if (
            result.side &&
            result.round &&
            typeof result.points === "number"
          ) {
            const roundKey = result.round;
            if (!setData[roundKey]) {
              setData[roundKey] = { A: new Set(), B: new Set() };
            }
            // Collect all points for each side (multiple players may have same points)
            setData[roundKey][result.side].add(result.points);
          }
        });

        // Convert to array format and calculate sets won
        Object.keys(setData).forEach((roundKey) => {
          const roundIndex = parseInt(roundKey) - 1; // round is 1-based, array is 0-based
          if (roundIndex >= 0 && roundIndex < 3) {
            // Get the maximum points value for each side (should be same for all players in a team)
            const gamesA =
              setData[roundKey].A.size > 0
                ? Math.max(...Array.from(setData[roundKey].A))
                : 0;
            const gamesB =
              setData[roundKey].B.size > 0
                ? Math.max(...Array.from(setData[roundKey].B))
                : 0;

            setScores.teamA.games[roundIndex] = gamesA;
            setScores.teamB.games[roundIndex] = gamesB;
            setScores.teamA.sets[roundIndex] = gamesA;
            setScores.teamB.sets[roundIndex] = gamesB;

            // Determine set winner (whoever has more games won)
            if (gamesA > gamesB) {
              setsWonA++;
            } else if (gamesB > gamesA) {
              setsWonB++;
            }
            // If tied, no set is won (both remain at current count)
          }
        });
      }
    } catch (error) {
      console.error("Error parsing match results:", error);
    }
  }

  // Transform to UI format
  return {
    id: apiMatch.id,
    tournamentId: apiMatch.tournamentId,
    status: status,
    tournament: tournamentName,
    round: round,
    stageType: stageType,
    stageTypeValue: apiMatch.stageType,
    scheduledTime: apiMatch.matchStartDateTime || apiMatch.scheduledTime,
    matchEndDateTime: apiMatch.matchEndDateTime,
    matchResult: matchResult,
    matchResultValue: apiMatch.matchResult,
    teamA: {
      id: teamA.id,
      name: teamA.teamName || teamA.name || "Team A",
      players: extractPlayerNames(teamA.players),
      logo: teamA.logo,
    },
    teamB: {
      id: teamB.id,
      name: teamB.teamName || teamB.name || "Team B",
      players: extractPlayerNames(teamB.players),
      logo: teamB.logo,
    },
    scores: setScores,
    setsWon: {
      teamA: setsWonA,
      teamB: setsWonB,
    },
    // Preserve API data for reference
    _apiData: {
      playStatus: apiMatch.playStatus,
      matchResult: apiMatch.matchResult,
      isResultUploaded: apiMatch.isResultUploaded,
      isPlayed: apiMatch.isPlayed,
      results: apiMatch.results,
      tiebreak_results: apiMatch.tiebreak_results,
      stageType: apiMatch.stageType,
      playstatus_completed_on: apiMatch.playstatus_completed_on,
    },
  };
};

/**
 * Transform API courts schedule response to UI match list format
 * @param {Object} apiResponse - Response from GetUmpireMasterTournamentCourtsSchedule
 * @param {Object} tournament - Tournament object (optional, for name)
 * @returns {Array} Array of transformed match objects
 */
export const transformCourtsScheduleToMatches = (
  apiResponse,
  tournament = null
) => {
  if (!apiResponse || !apiResponse.data || !apiResponse.data.courts) {
    return [];
  }

  const matches = [];
  const courts = apiResponse.data.courts || [];

  courts.forEach((court) => {
    // Add current match if exists
    if (court.currentMatch) {
      const transformedMatch = transformMatch(court.currentMatch, tournament);
      if (transformedMatch) {
        matches.push({
          ...transformedMatch,
          courtId: court.courtId,
          courtName: court.courtName,
        });
      }
    }

    // Add upcoming match if exists
    if (court.upcomingMatch) {
      const transformedMatch = transformMatch(court.upcomingMatch, tournament);
      if (transformedMatch) {
        matches.push({
          ...transformedMatch,
          courtId: court.courtId,
          courtName: court.courtName,
        });
      }
    }
  });

  // Sort by scheduled time
  matches.sort((a, b) => {
    const timeA = new Date(a.scheduledTime || 0);
    const timeB = new Date(b.scheduledTime || 0);
    return timeA - timeB;
  });

  return matches;
};

/**
 * Transform single match from API to UI format
 * @param {Object} apiMatch - Match object from API
 * @param {Object} tournament - Tournament object (optional)
 * @returns {Object} Transformed match object
 */
export const transformMatchToUIFormat = (apiMatch, tournament = null) => {
  return transformMatch(apiMatch, tournament);
};

export default {
  transformCourtsScheduleToMatches,
  transformMatchToUIFormat,
  mapPlayStatusToUIStatus,
  mapStageType,
  mapMatchResult,
};
