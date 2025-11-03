import { io } from "socket.io-client";
import { SERVER_URL, SOCKET_PATH, MATCH_STATE_TIMEOUT } from "../utils/constants.js";

/**
 * Socket Match Service
 * Manages WebSocket connection and all match-related events
 * Following the REACT_IMPLEMENTATION_GUIDE.md specification
 */
class SocketMatchService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnected) return;

    this.socket = io(SERVER_URL, {
      transports: ["websocket"],
      autoConnect: true,
      path: SOCKET_PATH,
    });

    return new Promise((resolve, reject) => {
      this.socket.on("connect", () => {
        this.isConnected = true;
        console.log("Socket connected successfully");
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        this.isConnected = false;
        console.error("Socket connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", () => {
        this.isConnected = false;
        console.log("Socket disconnected");
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Create a new match
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   * @param {Array<{id: string|number, name: string}>} params.team1Players
   * @param {Array<{id: string|number, name: string}>} params.team2Players
   * @param {string} params.groupTitle
   * @param {Object} params.matchSettings - MatchSettings object
   */
  async createMatch(params) {
    await this.connect();

    this.socket.emit("create_match", {
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      team1: params.team1Players,
      team2: params.team2Players,
      groupTitle: params.groupTitle || "",
      matchSettings: params.matchSettings,
      timestamp: Date.now(),
    });
  }

  /**
   * Get current match state from server
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   * @returns {Promise<Object|null>} MatchState or null if timeout/error
   */
  async getMatchState(params) {
    await this.connect();

    return new Promise((resolve) => {
      const responseEvent = "get_match_state_response";

      const timeout = setTimeout(() => {
        this.socket.off(responseEvent);
        console.warn("Match state request timeout");
        resolve(null);
      }, MATCH_STATE_TIMEOUT);

      this.socket.once(responseEvent, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      this.socket.emit("get_match_state", {
        tournamentId: params.tournamentId,
        matchId: params.matchId,
      });
    });
  }

  /**
   * Update match state
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   * @param {string} params.callBy - Action type: 'score', 'tie_break_score', 'set_win', 'undo', etc.
   * @param {Record<string, any>} params.updateData - Update data object
   * @param {Object} params.historyEntry - History entry for undo stack
   */
  async updateMatchState(params) {
    await this.connect();

    this.socket.emit("update_match_state", {
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      callBy: params.callBy,
      updateData: params.updateData,
      historyEntry: {
        ...params.historyEntry,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Add warning to a team
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   * @param {string} params.team - 'team1' or 'team2'
   * @param {string} params.warningLevel - 'W1', 'W2', or 'W3'
   * @param {Object} params.previousState - Previous match state
   */
  async addWarning(params) {
    await this.connect();

    this.socket.emit("add_warning", {
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      team: params.team,
      warningLevel: params.warningLevel,
      previousState: params.previousState,
      timestamp: Date.now(),
    });
  }

  /**
   * Update serving player
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   * @param {string} params.newServingPlayer - Name of new serving player
   * @param {boolean} params.isServingTeam1 - Whether team 1 is serving
   */
  async updateServe(params) {
    await this.connect();

    this.socket.emit("update_serve", {
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      newServingPlayer: params.newServingPlayer,
      isServingTeam1: params.isServingTeam1,
      timestamp: Date.now(),
    });
  }

  /**
   * Complete the match
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   * @param {string} params.winnerTeam - 'Team 1' or 'Team 2'
   */
  async completeMatch(params) {
    await this.connect();

    this.socket.emit("complete_match", {
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      winnerTeam: params.winnerTeam,
      timestamp: Date.now(),
    });
  }

  /**
   * Reset match to initial state
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   * @param {Record<string, any>} params.resetData - Reset data object
   */
  async resetMatch(params) {
    await this.connect();

    this.socket.emit("reset_match", {
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      resetData: params.resetData,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete match
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   */
  async deleteMatch(params) {
    await this.connect();

    this.socket.emit("delete_match", {
      tournamentId: params.tournamentId,
      matchId: params.matchId,
      timestamp: Date.now(),
    });
  }

  /**
   * Listen to match updates
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {string} params.matchId
   * @param {Function} params.onUpdate - Callback when update received
   */
  async listenToMatchUpdates(params) {
    await this.connect();

    const eventName = `match_update_${params.matchId}`;

    this.socket.on(eventName, (data) => {
      console.log("Received match update:", data);
      params.onUpdate(data);
    });
  }

  /**
   * Stop listening to match updates
   * @param {string} matchId
   */
  stopListeningToMatchUpdates(matchId) {
    if (this.socket) {
      const eventName = `match_update_${matchId}`;
      this.socket.off(eventName);
    }
  }

  /**
   * Listen to tournament updates
   * @param {Object} params
   * @param {string} params.tournamentId
   * @param {Function} params.onUpdate - Callback when update received
   */
  async listenToTournamentUpdates(params) {
    await this.connect();

    const eventName = `tournament_update_${params.tournamentId}`;

    this.socket.on(eventName, (data) => {
      console.log("Received tournament update:", data);
      params.onUpdate(data);
    });
  }

  /**
   * Stop listening to tournament updates
   * @param {string} tournamentId
   */
  stopListeningToTournamentUpdates(tournamentId) {
    if (this.socket) {
      const eventName = `tournament_update_${tournamentId}`;
      this.socket.off(eventName);
    }
  }
}

// Create singleton instance
const socketMatchService = new SocketMatchService();

export default socketMatchService;

