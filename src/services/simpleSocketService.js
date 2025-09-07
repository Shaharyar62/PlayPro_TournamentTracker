import { io } from "socket.io-client";

class SimpleSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.tournamentId = null;
    this.matchId = null;
    this.userType = null;
    this.listeners = new Map();
  }

  connect(serverUrl = "http://localhost:3001") {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to relay server");
      this.isConnected = true;
      this.emit("connection", { status: "connected" });
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from relay server");
      this.isConnected = false;
      this.emit("connection", { status: "disconnected" });
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      this.emit("error", error);
    });

    // Match events
    this.socket.on("matchJoined", (data) => {
      console.log("Joined match:", data.tournamentId, data.matchId);
      this.emit("matchJoined", data);
    });

    this.socket.on("scoreUpdate", (data) => {
      console.log("Score updated:", data.scoreData);
      this.emit("scoreUpdate", data);
    });

    this.socket.on("viewerJoined", (data) => {
      this.emit("viewerJoined", data);
    });

    this.socket.on("viewerLeft", (data) => {
      this.emit("viewerLeft", data);
    });

    return this;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.tournamentId = null;
      this.matchId = null;
      this.userType = null;
    }
  }

  joinMatch(tournamentId, matchId, userType) {
    if (!this.isConnected) {
      throw new Error("Not connected to server");
    }

    this.tournamentId = tournamentId;
    this.matchId = matchId;
    this.userType = userType;

    this.socket.emit("joinMatch", {
      tournamentId,
      matchId,
      userType,
    });
  }

  leaveMatch() {
    if (!this.isConnected || !this.tournamentId || !this.matchId) return;

    this.socket.emit("leaveMatch", {
      tournamentId: this.tournamentId,
      matchId: this.matchId,
    });

    this.tournamentId = null;
    this.matchId = null;
    this.userType = null;
  }

  updateScore(scoreData) {
    if (!this.isConnected) {
      throw new Error("Not connected to server");
    }

    if (this.userType !== "umpire") {
      throw new Error("Only umpires can update scores");
    }

    this.socket.emit("updateScore", {
      tournamentId: this.tournamentId,
      matchId: this.matchId,
      scoreData,
    });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }
}

export default new SimpleSocketService();
