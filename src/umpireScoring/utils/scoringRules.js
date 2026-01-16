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
 * Get score display string with golden point support
 * Centralized helper method for consistent score formatting across all components
 * @param {number} teamScore - Current team's point score
 * @param {number} opponentScore - Opponent's point score
 * @param {Object} options - Optional configuration object
 * @param {boolean} options.isInTiebreak - Whether currently in tiebreak mode
 * @param {Object} options.matchSettings - Match settings object with goldenPoint and advantagesWithGoldenPoint
 * @param {number} options.teamAdvantageCount - Current team's advantage count
 * @param {number} options.totalAdvantageExchanges - Sum of both teams' advantage counts
 * @returns {string} Formatted score string
 */
export function getScoreDisplayString(teamScore, opponentScore, options = {}) {
  const {
    isInTiebreak = false,
    matchSettings = null,
    teamAdvantageCount: _teamAdvantageCount = 0,
    totalAdvantageExchanges = 0,
  } = options;

  // If in tiebreak, return numeric score
  if (isInTiebreak) {
    return teamScore.toString();
  }

  // Always handle deuce/advantage logic regardless of matchSettings
  // Both teams at 4 (deuce)
  if (teamScore === 4 && opponentScore === 4) {
    // Only show golden point if matchSettings is available and golden point is enabled
    if (
      matchSettings &&
      matchSettings.goldenPoint &&
      matchSettings.advantagesWithGoldenPoint > 0 &&
      totalAdvantageExchanges >= matchSettings.advantagesWithGoldenPoint
    ) {
      return "40 (Golden Point)";
    }
    return "40";
  }

  // Team has advantage (score >= 5, opponent === 4)
  if (teamScore >= 5 && opponentScore === 4) {
    return "ADV";
  }

  // Opponent has advantage (opponent >= 5, team === 4) - team is at 40
  if (opponentScore >= 5 && teamScore === 4) {
    return "40";
  }

  // Standard scoring for non-deuce situations (0, 15, 30, 40)
  if (teamScore < SCORE_STRINGS.length) {
    return SCORE_STRINGS[teamScore];
  }

  // Fallback to AD for scores >= 5 when not in advantage situation
  return "AD";
}

/**
 * Check if team has won the game
 * @param {number} teamScore - Team's current point score
 * @param {number} opponentScore - Opponent's current point score
 * @param {number} teamAdvantageCount - Total number of advantage exchanges (sum of both teams' advantageCounts)
 * @param {Object} settings - MatchSettings object
 * @returns {boolean} True if team has won the game
 */
export function hasWonGame(
  teamScore,
  opponentScore,
  teamAdvantageCount,
  settings
) {
  console.log("[hasWonGame] Checking win conditions:", {
    teamScore,
    opponentScore,
    teamAdvantageCount,
    goldenPoint: settings.goldenPoint,
    advantagesWithGoldenPoint: settings.advantagesWithGoldenPoint,
  });

  // Direct win conditions (40-0, 40-15, 40-30)
  if (teamScore === 4 && opponentScore <= 2) {
    console.log(
      "[hasWonGame] Won by direct win condition (40-0, 40-15, 40-30)"
    );
    return true;
  }

  // Golden point logic
  if (settings.goldenPoint) {
    // Direct golden point without advantages
    if (settings.advantagesWithGoldenPoint === 0 && teamScore === 4) {
      console.log("[hasWonGame] Won by direct golden point (no advantages)");
      return true;
    }

    // Golden point after specified advantages
    if (settings.advantagesWithGoldenPoint > 0) {
      // Win after reaching advantage limit (when at advantage after threshold)
      const condition1 =
        teamScore >= 5 &&
        opponentScore === 4 &&
        teamAdvantageCount >= settings.advantagesWithGoldenPoint;
      console.log("[hasWonGame] Condition 1 (advantage win):", {
        teamScore,
        opponentScore,
        teamAdvantageCount,
        threshold: settings.advantagesWithGoldenPoint,
        result: condition1,
        checks: {
          "teamScore >= 5": teamScore >= 5,
          "opponentScore === 4": opponentScore === 4,
          "teamAdvantageCount >= threshold":
            teamAdvantageCount >= settings.advantagesWithGoldenPoint,
        },
      });
      if (condition1) {
        console.log("[hasWonGame] Won by advantage after threshold");
        return true;
      }

      // Win by 2 points - always allowed (traditional tennis rule)
      // The threshold only applies to advantage wins, not win-by-2
      const condition2 = teamScore >= 4 && teamScore >= opponentScore + 2;
      console.log("[hasWonGame] Condition 2 (win by 2 after threshold):", {
        teamScore,
        opponentScore,
        teamAdvantageCount,
        threshold: settings.advantagesWithGoldenPoint,
        result: condition2,
        checks: {
          "teamScore >= 4": teamScore >= 4,
          "teamScore >= opponentScore + 2": teamScore >= opponentScore + 2,
          "teamAdvantageCount >= threshold":
            teamAdvantageCount >= settings.advantagesWithGoldenPoint,
        },
      });
      if (condition2) {
        console.log("[hasWonGame] Won by 2 points after threshold");
        return true;
      }
    }
  } else {
    // Traditional scoring - win by 2 points
    if (teamScore >= 4 && teamScore >= opponentScore + 2) {
      console.log("[hasWonGame] Won by traditional scoring (win by 2)");
      return true;
    }
  }

  console.log("[hasWonGame] No win condition met - returning false");
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
  // Validate inputs
  if (!settings || typeof settings.numberOfGames !== "number") {
    return false;
  }
  if (typeof teamGames !== "number" || typeof opponentGames !== "number") {
    return false;
  }

  const minGames = settings.numberOfGames;
  // Must reach minimum games AND win by 2
  return teamGames >= minGames && teamGames >= opponentGames + 2;
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
 * Check if a set score is valid based on standard scoring rules
 * @param {number} team1Games - Team 1's games in the set
 * @param {number} team2Games - Team 2's games in the set
 * @param {Object} settings - MatchSettings object
 * @param {Object} setData - Optional set data object (for checking tiebreak status)
 * @returns {boolean} True if the set score is valid
 */
export function isValidSetScore(team1Games, team2Games, settings, setData = null) {
  // Validate inputs
  if (!settings || typeof settings.numberOfGames !== "number") {
    console.log(`[isValidSetScore] Invalid settings:`, settings);
    return false;
  }
  if (typeof team1Games !== "number" || typeof team2Games !== "number") {
    console.log(`[isValidSetScore] Invalid scores: ${team1Games}, ${team2Games}`);
    return false;
  }

  const numberOfGames = settings.numberOfGames;
  const minGames = numberOfGames;
  const tiebreakStartGames = settings.gamesToStartTiebreak?.includes("-")
    ? parseInt(settings.gamesToStartTiebreak.split("-")[0].trim())
    : numberOfGames;

  console.log(`[isValidSetScore] Checking score ${team1Games}-${team2Games}, minGames=${minGames}, tiebreakStart=${tiebreakStartGames}`);

  // Check if one team has won the set
  const team1Won = hasWonSet(team1Games, team2Games, settings);
  const team2Won = hasWonSet(team2Games, team1Games, settings);

  console.log(`[isValidSetScore] Team1 won: ${team1Won}, Team2 won: ${team2Won}`);

  // If a team has won, the score is valid
  if (team1Won || team2Won) {
    console.log(`[isValidSetScore] Set won - valid`);
    return true;
  }

  // Case 1: Set still in progress - both teams below minGames (e.g., 5-5, 4-3, 3-2)
  if (team1Games < minGames && team2Games < minGames) {
    console.log(`[isValidSetScore] Set in progress (both < ${minGames}) - valid`);
    return true;
  }

  // Case 2: One team has reached minGames, other hasn't
  // This is valid if:
  // - The leading team has won (win by 2) - e.g., 6-4, 7-5
  // - OR the opponent is within 1 game (can tie for tiebreak) - e.g., 6-5, 5-6
  // Invalid: scores where leading team is >= minGames+2 but hasn't won - e.g., 8-5 (should be 8-6 or better)
  if (team1Games >= minGames && team2Games < minGames) {
    // Check if team1 has won
    if (team1Won) {
      console.log(`[isValidSetScore] Team1 won with ${team1Games}-${team2Games} - valid`);
      return true;
    }
    // If team1 hasn't won, check if opponent is within 1 game (can reach tiebreak)
    // e.g., 6-5 is valid (can go to 6-6), but 7-4 is invalid (should be 7-5 or better)
    if (team2Games >= minGames - 1) {
      console.log(`[isValidSetScore] Team1 at ${team1Games}, Team2 at ${team2Games} (within 1 game) - valid (can tie)`);
      return true;
    }
    // Opponent is too far behind and team1 hasn't won - invalid
    console.log(`[isValidSetScore] Team1 at ${team1Games} but hasn't won and opponent ${team2Games} too far - invalid`);
    return false;
  }

  if (team2Games >= minGames && team1Games < minGames) {
    // Check if team2 has won
    if (team2Won) {
      console.log(`[isValidSetScore] Team2 won with ${team2Games}-${team1Games} - valid`);
      return true;
    }
    // If team2 hasn't won, check if opponent is within 1 game (can reach tiebreak)
    // e.g., 5-6 is valid (can go to 6-6), but 4-7 is invalid (should be 5-7 or better)
    if (team1Games >= minGames - 1) {
      console.log(`[isValidSetScore] Team2 at ${team2Games}, Team1 at ${team1Games} (within 1 game) - valid (can tie)`);
      return true;
    }
    // Opponent is too far behind and team2 hasn't won - invalid
    console.log(`[isValidSetScore] Team2 at ${team2Games} but hasn't won and opponent ${team1Games} too far - invalid`);
    return false;
  }

  // Case 3: Both teams have reached minGames
  // Valid scenarios:
  // - Tiebreak start: both at tiebreakStartGames (e.g., 6-6)
  // - Tiebreak completed: one team at tiebreakStartGames+1, other at tiebreakStartGames (e.g., 7-6)
  // Invalid: scores where neither team has won and it's not a tiebreak (e.g., 6-5, 7-4, 8-7)
  if (team1Games >= minGames && team2Games >= minGames) {
    // Check if it's a tiebreak start (e.g., 6-6)
    if (team1Games === tiebreakStartGames && team2Games === tiebreakStartGames) {
      console.log(`[isValidSetScore] Tiebreak start (${team1Games}-${team2Games}) - valid`);
      return true;
    }

    // Check if it's a tiebreak completed score (e.g., 7-6, 6-7)
    if (
      (team1Games === tiebreakStartGames + 1 && team2Games === tiebreakStartGames) ||
      (team2Games === tiebreakStartGames + 1 && team1Games === tiebreakStartGames)
    ) {
      console.log(`[isValidSetScore] Tiebreak completed (${team1Games}-${team2Games}) - valid`);
      return true;
    }

    // If it's a tiebreak set (already in tiebreak), allow tiebreak scores
    const isTiebreakSet = setData?.isTiebreak || setData?.isSuperTiebreak;
    if (isTiebreakSet) {
      console.log(`[isValidSetScore] Tiebreak set - valid`);
      return true;
    }

    // Otherwise invalid (e.g., 6-5, 7-4, 8-7 where neither team has won and not tiebreak)
    console.log(`[isValidSetScore] Both teams >= ${minGames} but invalid score (${team1Games}-${team2Games}) - invalid`);
    return false;
  }

  // Should not reach here, but safe fallback
  console.log(`[isValidSetScore] Fallback - allowing score`);
  return true;
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
