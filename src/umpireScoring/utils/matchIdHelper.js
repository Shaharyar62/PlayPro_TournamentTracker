import { EnviromentTypeEnum, envType } from "../../const/appConstant.js";

/**
 * MatchIdHelper Utility
 * Handles environment-based prefixing of match and tournament IDs
 * - Development environments (Local, QA, Dev): prefix with "dev_"
 * - Production environments (Production, Demo): no prefix
 */
class MatchIdHelper {
  /**
   * Get environment prefix based on envType from appConstant.js
   * @returns {string} "dev_" for development environments, "" for production
   */
  static getEnvPrefix() {
    // Production environments: Production (4) and Demo (5) - no prefix
    if (
      envType === EnviromentTypeEnum.Production ||
      envType === EnviromentTypeEnum.Demo
    ) {
      return "";
    }
    // Development environments: Local (1), QA (2), Dev (3) - use "dev_" prefix
    return "dev_";
  }

  /**
   * Prefix match ID based on current environment
   * @param {string|number} matchId - Match ID to prefix
   * @returns {string} Prefixed match ID or original if already prefixed/invalid
   */
  static prefixMatchId(matchId) {
    if (!matchId) return matchId;

    const matchIdStr = String(matchId);
    const prefix = this.getEnvPrefix();

    // If already prefixed with dev_ or prod_, return as is
    if (matchIdStr.startsWith("dev_") || matchIdStr.startsWith("prod_")) {
      return matchIdStr;
    }

    // Add prefix if in development environment
    return prefix ? `${prefix}${matchIdStr}` : matchIdStr;
  }

  /**
   * Prefix tournament ID based on current environment
   * @param {string|number} tournamentId - Tournament ID to prefix
   * @returns {string} Prefixed tournament ID or original if already prefixed/invalid
   */
  static prefixTournamentId(tournamentId) {
    return this.prefixMatchId(tournamentId);
  }

  /**
   * Check if a match ID belongs to the current environment
   * @param {string|number} matchId - Match ID to check
   * @returns {boolean} True if match belongs to current environment
   */
  static isMatchForCurrentEnv(matchId) {
    if (!matchId) return false;

    const matchIdStr = String(matchId);
    const prefix = this.getEnvPrefix();

    if (prefix) {
      // Development: only accept dev_ prefixed matches
      return matchIdStr.startsWith(prefix);
    } else {
      // Production: only accept matches without dev_ prefix
      return !matchIdStr.startsWith("dev_");
    }
  }

  /**
   * Filter array of matches/tournaments by current environment
   * @param {Array} matches - Array of match or tournament objects
   * @returns {Array} Filtered array containing only matches for current environment
   */
  static filterMatchesByEnv(matches) {
    if (!Array.isArray(matches)) return [];

    return matches.filter((match) => {
      // Try to find match ID from various possible properties
      const matchId =
        match.id ||
        match.matchId ||
        match.tournamentId ||
        match.tournamentScheduleId;
      return this.isMatchForCurrentEnv(matchId);
    });
  }
}

export default MatchIdHelper;
