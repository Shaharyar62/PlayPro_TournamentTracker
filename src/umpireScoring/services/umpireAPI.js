import AppConstant, {
  TournamentMatchPlayStatusEnum,
} from "../../const/appConstant";
import { ResultStatus } from "../../const/appConstant";
import { baseUrl } from "../../const/Constants";
import { getUmpireToken } from "../helpers/tokenHelper";

/**
 * API service for umpire scoring operations
 * Handles all communication with the backend API
 */
class UmpireAPIService {
  constructor() {
    // Use UmpireTournament base URL
    // AppConstant.baseUrl already includes trailing slash (https://localhost:7094/)
    this.baseUrl = `${AppConstant.baseUrl}api/UmpireTournament`;
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Generic API request handler
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;

    // Get JWT token if available
    const token = getUmpireToken();

    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: this.timeout,
    };

    // Add Authorization header if token exists
    if (token) {
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.handleAPIResponse(data);
    } catch (error) {
      console.error("API Request failed:", error);

      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }

  /**
   * Handle API response format
   * API returns: {status: 0|1|2, message: string, data: any}
   * status: 0=Unauthorized, 1=Success, 2=Error
   */
  handleAPIResponse(data) {
    if (data.status === 1) {
      // Success
      return {
        success: true,
        data: data.data,
        message: data.message,
        status: data.status,
      };
    } else {
      // Error or Unauthorized
      return {
        success: false,
        error: data.message || "Unknown error occurred",
        status: data.status, // 0=Unauthorized, 2=Error
      };
    }
  }

  /**
   * Simulate API responses for development
   */
  async simulateAPIResponse(endpoint, options) {
    // Add artificial delay to simulate network
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    // Mock responses based on endpoint
    if (endpoint.includes("authenticate-court")) {
      return {
        status: ResultStatus.Success,
        data: {
          courtId: "COURT001",
          courtName: "Court 1",
          location: "Main Arena",
          token: "mock-jwt-token",
        },
        message: "Authentication successful",
      };
    }

    if (endpoint.includes("matches")) {
      return {
        status: ResultStatus.Success,
        data: [], // Matches are handled by context mock data
        message: "Matches retrieved successfully",
      };
    }

    if (endpoint.includes("start-match")) {
      return {
        status: ResultStatus.Success,
        data: { matchId: options.body?.matchId },
        message: "Match started successfully",
      };
    }

    if (endpoint.includes("update-score")) {
      return {
        status: ResultStatus.Success,
        data: { updated: true },
        message: "Score updated successfully",
      };
    }

    if (endpoint.includes("end-match")) {
      return {
        status: ResultStatus.Success,
        data: { matchId: options.body?.matchId },
        message: "Match ended successfully",
      };
    }

    // Default success response
    return {
      status: ResultStatus.Success,
      data: null,
      message: "Operation completed successfully",
    };
  }

  /**
   * Umpire Sign In
   * POST /UmpireSignIn
   * @param {string} phone - Phone number
   * @param {string} password - Password
   * @returns {Promise} Response with token and umpire data
   */
  async umpireSignIn(phone, password) {
    return await this.makeRequest("UmpireSignIn", {
      method: "POST",
      body: JSON.stringify({
        emailorphone: phone,
        password: password,
        signupType: 0, // EmailorPhone
      }),
    });
  }

  /**
   * Get Umpire Master Tournaments
   * GET /GetUmpireMasterTournaments
   * Requires JWT token
   * @returns {Promise} Response with tournaments array
   */
  async getUmpireMasterTournaments() {
    return await this.makeRequest("GetUmpireMasterTournaments", {
      method: "GET",
    });
  }

  /**
   * Get Umpire Master Tournament Courts Schedule
   * GET /GetUmpireMasterTournamentCourtsSchedule?masterTournamentId={id}
   * @param {number} masterTournamentId - Master Tournament ID
   * @returns {Promise} Response with courts schedule data
   */
  async getUmpireMasterTournamentCourtsSchedule(masterTournamentId) {
    return await this.makeRequest(
      `GetUmpireMasterTournamentCourtsSchedule?masterTournamentId=${masterTournamentId}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get Umpire Courts
   * GET /GetUmpireCourts?masterTournamentId={id}
   * @param {number} masterTournamentId - Optional Master Tournament ID
   * @returns {Promise} Response with courts array
   */
  async getUmpireCourts(masterTournamentId = null) {
    let endpoint = "GetUmpireCourts";
    if (masterTournamentId) {
      endpoint += `?masterTournamentId=${masterTournamentId}`;
    }
    return await this.makeRequest(endpoint, {
      method: "GET",
    });
  }

  /**
   * Update Umpire Tournament Match Result
   * POST /UpdateUmpireTournamentMatchResult
   * @param {Object} matchData - Match result data
   * @returns {Promise} Response with update status
   */
  async updateUmpireTournamentMatchResult(matchData) {
    return await this.makeRequest("UpdateUmpireTournamentMatchResult", {
      method: "POST",
      body: JSON.stringify(matchData),
    });
  }

  /**
   * Authenticate court umpire (legacy - kept for backward compatibility)
   */
  async authenticateCourt(courtId) {
    return await this.makeRequest("umpire/authenticate-court", {
      method: "POST",
      body: JSON.stringify({ courtId }),
    });
  }

  /**
   * Get matches for a specific court
   */
  async getMatchesForCourt(courtId, date = null) {
    const params = new URLSearchParams({ courtId });
    if (date) {
      params.append("date", date);
    }

    return await this.makeRequest(`umpire/matches?${params.toString()}`);
  }

  /**
   * Start a match
   */
  async startMatch(matchId) {
    return await this.makeRequest("umpire/start-match", {
      method: "POST",
      body: JSON.stringify({
        matchId,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Update match score
   */
  async updateMatchScore(matchId, scores) {
    return await this.makeRequest("umpire/update-score", {
      method: "PUT",
      body: JSON.stringify({
        matchId,
        scores,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * End a match
   */
  async endMatch(matchId, finalScores) {
    return await this.makeRequest("umpire/end-match", {
      method: "POST",
      body: JSON.stringify({
        matchId,
        finalScores,
        endTime: new Date().toISOString(),
      }),
    });
  }

  /**
   * Get match details
   */
  async getMatchDetails(matchId) {
    return await this.makeRequest(`umpire/match/${matchId}`);
  }

  /**
   * Upload match result
   */
  async uploadMatchResult(matchId, result) {
    return await this.makeRequest("umpire/upload-result", {
      method: "POST",
      body: JSON.stringify({
        matchId,
        result,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Get court schedule
   */
  async getCourtSchedule(courtId, startDate, endDate) {
    const params = new URLSearchParams({
      courtId,
      startDate,
      endDate,
    });

    return await this.makeRequest(`umpire/schedule?${params.toString()}`);
  }

  /**
   * Submit incident report
   */
  async submitIncidentReport(matchId, incident) {
    return await this.makeRequest("umpire/incident-report", {
      method: "POST",
      body: JSON.stringify({
        matchId,
        incident,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Get tournament rules
   */
  async getTournamentRules(tournamentId) {
    return await this.makeRequest(`umpire/tournament-rules/${tournamentId}`);
  }

  /**
   * Validate score update
   */
  async validateScore(matchId, scores) {
    return await this.makeRequest("umpire/validate-score", {
      method: "POST",
      body: JSON.stringify({
        matchId,
        scores,
      }),
    });
  }

  /**
   * Get live match statistics
   */
  async getLiveStats(matchId) {
    return await this.makeRequest(`umpire/live-stats/${matchId}`);
  }

  /**
   * Ping server for connectivity check
   */
  async ping() {
    try {
      const response = await this.makeRequest("umpire/ping");
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sync offline data
   */
  async syncOfflineData(offlineData) {
    return await this.makeRequest("umpire/sync-offline", {
      method: "POST",
      body: JSON.stringify({
        data: offlineData,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Update Tournament Match Status
   * POST /UpdateTournamentMatchStatus (general service API, not UmpireTournament)
   * @param {number|string} tournamentScheduleId - Tournament Schedule ID (match ID)
   * @param {number} playStatus - Play status enum value (0=Pending, 1=In_Progress, 2=Completed)
   * @returns {Promise} Response with update status
   */
  async updateTournamentMatchStatus(tournamentScheduleId, playStatus) {
    const url = `${baseUrl}/UpdateTournamentMatchStatus`;
    const token = getUmpireToken();

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        tournamentScheduleId: tournamentScheduleId,
        playStatus: playStatus,
      }),
    };

    // Add Authorization header if token exists
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.handleAPIResponse(data);
    } catch (error) {
      console.error("UpdateTournamentMatchStatus API Request failed:", error);

      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }

  /**
   * Update Tournament Match Result
   * POST /UpdateTournamentMatchResult (general service API, not UmpireTournament)
   * @param {Object} payload - Match result payload from prepareMatchResults()
   * @param {string} payload.results - JSON stringified array of result objects
   * @param {number} payload.matchResult - Match result (1=Team A won, 2=Team B won)
   * @param {string} payload.tiebreak_results - JSON stringified tiebreak results (optional)
   * @param {number} payload.tournamentScheduleId - Tournament Schedule ID (match ID)
   * @param {number} payload.playStatus - Play status (2=Completed)
   * @param {boolean} payload.isReUploadResult - Whether this is a re-upload
   * @returns {Promise} Response with update status
   */
  async updateTournamentMatchResult(payload) {
    const url = `${this.baseUrl}/UpdateUmpireTournamentMatchResult`;
    const token = getUmpireToken();

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    };

    // Add Authorization header if token exists
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.handleAPIResponse(data);
    } catch (error) {
      console.error("UpdateTournamentMatchResult API Request failed:", error);

      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }
}

// Create singleton instance
export const umpireAPI = new UmpireAPIService();

// Export class for testing
export default UmpireAPIService;
