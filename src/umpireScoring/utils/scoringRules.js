import { SCORE_STRINGS } from "./constants.js";
import { MatchFormat } from "../types/match.types.js";

/**
 * Get score string representation for display
 * @param {number} score - Current point score
 * @param {boolean} inTiebreak - Whether currently in tiebreak
 * @returns {string} Score string (0, 15, 30, 40, AD, or numeric for tiebreak)
 */
export function getScoreString(score, inTiebreak) {
  if (inTiebreak) {
    return score.toString();
  }

  if (score < SCORE_STRINGS.length) {
    return SCORE_STRINGS[score];
  }
  return "AD";
}

/**
 * Check if team has won the game
 * @param {number} teamScore - Team's current point score
 * @param {number} opponentScore - Opponent's current point score
 * @param {number} teamAdvantageCount - Number of advantages the team has had
 * @param {Object} settings - MatchSettings object
 * @returns {boolean} True if team has won the game
 */
export function hasWonGame(
  teamScore,
  opponentScore,
  teamAdvantageCount,
  settings
) {
  // Direct win conditions (40-0, 40-15, 40-30)
  if (teamScore === 4 && opponentScore <= 2) {
    return true;
  }

  // Golden point logic
  if (settings.goldenPoint) {
    // Direct golden point without advantages
    if (settings.advantagesWithGoldenPoint === 0 && teamScore === 4) {
      return true;
    }

    // Golden point after specified advantages
    if (settings.advantagesWithGoldenPoint > 0) {
      // Win after reaching advantage limit
      if (
        teamScore >= 4 &&
        opponentScore === 3 &&
        teamAdvantageCount >= settings.advantagesWithGoldenPoint
      ) {
        return true;
      }
      // Win after advantage (score >= 5)
      if (teamScore >= 5) {
        return true;
      }
    }
  } else {
    // Traditional scoring - win by 2 points
    if (teamScore >= 4 && teamScore >= opponentScore + 2) {
      return true;
    }
  }

  return false;
}

/**
 * Check if team has won the tiebreak
 * @param {number} teamScore - Team's tiebreak score
 * @param {number} opponentScore - Opponent's tiebreak score
 * @param {boolean} inSuperTieBreak - Whether in super tiebreak
 * @param {Object} settings - MatchSettings object
 * @returns {boolean} True if team has won the tiebreak
 */
export function hasWonTiebreak(
  teamScore,
  opponentScore,
  inSuperTieBreak,
  settings
) {
  const tiebreakTarget = inSuperTieBreak
    ? settings.superTieBreakPoints
    : settings.pointsInTiebreak;

  // Normal win condition: reach target and win by 2
  const condition1 =
    teamScore >= tiebreakTarget && teamScore >= opponentScore + 2;

  // Golden point condition
  const condition2 =
    settings.goldenPointInTiebreak &&
    teamScore === tiebreakTarget &&
    teamScore > opponentScore;

  return condition1 || condition2;
}

/**
 * Check if team has won the set
 * @param {number} teamGames - Team's games in current set
 * @param {number} opponentGames - Opponent's games in current set
 * @param {Object} settings - MatchSettings object
 * @returns {boolean} True if team has won the set
 */
export function hasWonSet(teamGames, opponentGames, settings) {
  return teamGames >= settings.numberOfGames && teamGames >= opponentGames + 2;
}

/**
 * Check if tiebreak should start
 * @param {number} team1Games - Team 1's games
 * @param {number} team2Games - Team 2's games
 * @param {Object} settings - MatchSettings object
 * @returns {boolean} True if tiebreak should start
 */
export function shouldStartTiebreak(team1Games, team2Games, settings) {
  const tiebreakStartGames = settings.gamesToStartTiebreak.includes("-")
    ? parseInt(settings.gamesToStartTiebreak.split("-")[0].trim())
    : settings.numberOfGames;

  return team1Games === tiebreakStartGames && team2Games === tiebreakStartGames;
}

/**
 * Check if super tiebreak should start
 * @param {number} team1Sets - Team 1's sets won
 * @param {number} team2Sets - Team 2's sets won
 * @param {Object} settings - MatchSettings object
 * @returns {boolean} True if super tiebreak should start
 */
export function shouldStartSuperTiebreak(team1Sets, team2Sets, settings) {
  return (
    settings.matchFormat === MatchFormat.TWO_SETS_SUPER_TIEBREAK &&
    settings.numberOfSets === 2 &&
    team1Sets === 1 &&
    team2Sets === 1
  );
}

/**
 * Check if team has won the match
 * @param {number} team1Sets - Team 1's sets won
 * @param {number} team2Sets - Team 2's sets won
 * @param {Object} settings - MatchSettings object
 * @param {boolean} inSuperTieBreak - Whether currently in super tiebreak
 * @returns {{won: boolean, winner?: 'Team 1'|'Team 2'}} Match win result
 */
export function hasWonMatch(team1Sets, team2Sets, settings, inSuperTieBreak) {
  // Super tie break ends the match immediately
  if (inSuperTieBreak) {
    if (team1Sets > team2Sets) {
      return { won: true, winner: "Team 1" };
    } else if (team2Sets > team1Sets) {
      return { won: true, winner: "Team 2" };
    }
    return { won: false };
  }

  const setsToWin = Math.ceil(settings.numberOfSets / 2);

  // For 2 sets format, check if we need super tie break
  if (settings.matchFormat === MatchFormat.TWO_SETS_SUPER_TIEBREAK) {
    if (team1Sets === 1 && team2Sets === 1) {
      return { won: false }; // Need super tiebreak
    }
    // In 2 sets format, winning 2 sets or winning super tie break ends match
    if (team1Sets >= 2) {
      return { won: true, winner: "Team 1" };
    } else if (team2Sets >= 2) {
      return { won: true, winner: "Team 2" };
    }
    return { won: false };
  }

  // Standard format - win majority of sets
  if (team1Sets >= setsToWin) {
    return { won: true, winner: "Team 1" };
  } else if (team2Sets >= setsToWin) {
    return { won: true, winner: "Team 2" };
  }

  return { won: false };
}

/**
 * Get warning consequence information
 * @param {number} currentWarnings - Current number of warnings
 * @returns {{level: string, consequence: string}} Warning info
 */
export function getWarningConsequence(currentWarnings) {
  if (currentWarnings === 0) {
    return {
      level: "W1",
      consequence: "This will show a yellow card.",
    };
  } else if (currentWarnings === 1) {
    return {
      level: "W2",
      consequence: "This will award 1 point to the opposing team.",
    };
  } else {
    return {
      level: "W3",
      consequence: "This will result in match loss.",
    };
  }
}
