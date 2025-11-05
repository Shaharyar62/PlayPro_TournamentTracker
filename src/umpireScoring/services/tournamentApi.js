import Common from "../../helper/common.js";
import { DEFAULT_MATCH_SETTINGS } from "../utils/constants.js";

/**
 * Tournament API Service
 * Handles loading match settings from API
 * Following REACT_IMPLEMENTATION_GUIDE.md specification
 */
class TournamentApiService {
  /**
   * Load match settings from API
   * @param {string} tournamentId - Tournament ID
   * @param {string} stageTypeId - Stage type ID (optional)
   * @returns {Promise<Object>} MatchSettings object
   */
  async loadMatchSettings(tournamentId, stageTypeId = null) {
    try {
      // Try to fetch settings from API if endpoint exists
      // This is a placeholder - adjust API endpoint based on your backend
      let settings = null;

      if (tournamentId && stageTypeId) {
        try {
          const response = await Common.ApiService.getInstance().request(
            `GetTournamentRules?tournamentId=${tournamentId}&stageTypeId=${stageTypeId}`
          );

          if (response?.data) {
            settings = this.normalizeMatchSettings(response.data[0]);
          }
        } catch (error) {
          console.warn(
            "Failed to load match settings from API, using defaults:",
            error
          );
        }
      }

      // Fallback to default settings if API call fails or no response
      if (!settings) {
        console.log("Using default match settings");
        settings = { ...DEFAULT_MATCH_SETTINGS };
      }

      return settings;
    } catch (error) {
      console.error("Error loading match settings:", error);
      // Return default settings on error
      return { ...DEFAULT_MATCH_SETTINGS };
    }
  }

  /**
   * Normalize match settings from API response to MatchSettings format
   * @param {Object} apiData - Raw API response data
   * @returns {Object} Normalized MatchSettings object
   */
  normalizeMatchSettings(apiData) {
    return {
      autoStartTime:
        apiData.autoStartTime ?? DEFAULT_MATCH_SETTINGS.autoStartTime,
      pointTimerMinutes:
        apiData.pointTimerMinutes ?? DEFAULT_MATCH_SETTINGS.pointTimerMinutes,
      pointTimerSeconds:
        apiData.pointTimerSeconds ?? DEFAULT_MATCH_SETTINGS.pointTimerSeconds,
      changeSide1_Minutes:
        apiData.changeSide1_Minutes ??
        DEFAULT_MATCH_SETTINGS.changeSide1_Minutes,
      changeSide1_Seconds:
        apiData.changeSide1_Seconds ??
        DEFAULT_MATCH_SETTINGS.changeSide1_Seconds,
      changeSideMinutes:
        apiData.changeSideMinutes ?? DEFAULT_MATCH_SETTINGS.changeSideMinutes,
      changeSideSeconds:
        apiData.changeSideSeconds ?? DEFAULT_MATCH_SETTINGS.changeSideSeconds,
      setTimerMinutes:
        apiData.setTimerMinutes ?? DEFAULT_MATCH_SETTINGS.setTimerMinutes,
      setTimerSeconds:
        apiData.setTimerSeconds ?? DEFAULT_MATCH_SETTINGS.setTimerSeconds,
      numberOfSets: apiData.numberOfSets ?? DEFAULT_MATCH_SETTINGS.numberOfSets,
      numberOfGames:
        apiData.numberOfGames ?? DEFAULT_MATCH_SETTINGS.numberOfGames,
      autoChangeSide:
        apiData.autoChangeSide ?? DEFAULT_MATCH_SETTINGS.autoChangeSide,
      goldenPoint: apiData.goldenPoint ?? DEFAULT_MATCH_SETTINGS.goldenPoint,
      goldenPointInTiebreak:
        apiData.goldenPointInTiebreak ??
        DEFAULT_MATCH_SETTINGS.goldenPointInTiebreak,
      advantagesWithGoldenPoint:
        apiData.advantagesWithGoldenPoint ??
        DEFAULT_MATCH_SETTINGS.advantagesWithGoldenPoint,
      tiebreakOnLastSet:
        apiData.tiebreakOnLastSet ?? DEFAULT_MATCH_SETTINGS.tiebreakOnLastSet,
      pointsInTiebreak:
        apiData.pointsInTiebreak ?? DEFAULT_MATCH_SETTINGS.pointsInTiebreak,
      superTieBreakPoints:
        apiData.superTieBreakPoints ??
        DEFAULT_MATCH_SETTINGS.superTieBreakPoints,
      gamesToStartTiebreak:
        apiData.gamesToStartTiebreak ??
        DEFAULT_MATCH_SETTINGS.gamesToStartTiebreak,
      matchFormat: apiData.matchFormat ?? DEFAULT_MATCH_SETTINGS.matchFormat,
    };
  }
}

// Create singleton instance
const tournamentApiService = new TournamentApiService();

export default tournamentApiService;
