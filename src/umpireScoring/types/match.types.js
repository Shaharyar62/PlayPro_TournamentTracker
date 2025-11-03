/**
 * Match Format Enum
 */
export const MatchFormat = {
  RACE_TO_SIX: 1,
  TWO_SETS_SUPER_TIEBREAK: 2,
  THREE_SETS: 3,
};

/**
 * @typedef {Object} MatchSettings
 * @property {boolean} autoStartTime
 * @property {number} pointTimerMinutes
 * @property {number} pointTimerSeconds
 * @property {number} changeSide1_Minutes
 * @property {number} changeSide1_Seconds
 * @property {number} changeSideMinutes
 * @property {number} changeSideSeconds
 * @property {number} setTimerMinutes
 * @property {number} setTimerSeconds
 * @property {number} numberOfSets
 * @property {number} numberOfGames
 * @property {boolean} autoChangeSide
 * @property {boolean} goldenPoint
 * @property {boolean} goldenPointInTiebreak
 * @property {number} advantagesWithGoldenPoint
 * @property {boolean} tiebreakOnLastSet
 * @property {number} pointsInTiebreak
 * @property {number} superTieBreakPoints
 * @property {string} gamesToStartTiebreak - e.g., "6 - 6"
 * @property {number} matchFormat - MatchFormat enum value
 */

/**
 * @typedef {Object} SetData
 * @property {number} team1Games
 * @property {number} team2Games
 * @property {boolean} [isTiebreak]
 * @property {boolean} [isSuperTiebreak]
 * @property {number} [tiebreakScore1]
 * @property {number} [tiebreakScore2]
 * @property {number} [superTieBreakScore1]
 * @property {number} [superTieBreakScore2]
 */

/**
 * @typedef {Object} Player
 * @property {string|number} id
 * @property {string} name
 */

/**
 * @typedef {Object} TeamData
 * @property {number} score - Current game points (0-4+)
 * @property {number} games - Current set games
 * @property {number} sets - Number of sets won
 * @property {number} tiebreakScore - Current tiebreak points
 * @property {number} advantageCount - Number of advantages the team has had in current game
 * @property {Player[]} players
 * @property {Array<{level: string}>} warnings - Array of warning objects
 * @property {number} servingOrder - Current serving order index
 */

/**
 * @typedef {Object} CurrentServe
 * @property {string} servingPlayer - Name of serving player
 * @property {boolean} isServingTeam1
 */

/**
 * @typedef {Object} MatchState
 * @property {TeamData} team1
 * @property {TeamData} team2
 * @property {Record<string, SetData>} sets - Key is set index as string: "0", "1", "2"
 * @property {boolean} isInTiebreak
 * @property {boolean} isInSuperTiebreak
 * @property {CurrentServe} currentServe
 * @property {number} totalGamesPlayed
 * @property {'active'|'completed'} status
 * @property {string} [winnerTeam] - 'Team 1' or 'Team 2'
 */

/**
 * @typedef {Object} Match
 * @property {string} id
 * @property {Player[]} team1
 * @property {Player[]} team2
 * @property {string} [tournamentId]
 * @property {string} [stageTypeId]
 * @property {string} [groupTitle]
 */

// Export types for JSDoc usage
export {};

