import AppConstant from "../../const/appConstant";
import { ResultStatus } from "../../const/appConstant";

/**
 * API service for umpire scoring operations
 * Handles all communication with the backend API
 */
class UmpireAPIService {
  constructor() {
    this.baseUrl = AppConstant.serviceUrl;
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Generic API request handler
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;

    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: this.timeout,
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      // For development, simulate API responses
      if (process.env.NODE_ENV === "development") {
        return await this.simulateAPIResponse(endpoint, requestOptions);
      }

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
   */
  handleAPIResponse(data) {
    if (data.status === ResultStatus.Success) {
      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } else {
      return {
        success: false,
        error: data.message || "Unknown error occurred",
        status: data.status,
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
   * Authenticate court umpire
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
}

// Create singleton instance
export const umpireAPI = new UmpireAPIService();

// Export class for testing
export default UmpireAPIService;
