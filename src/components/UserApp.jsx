import React, { useState, useEffect } from "react";
import simpleSocketService from "../services/simpleSocketService";
import "./UserApp.css";

const UserApp = ({ tournamentId, matchId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [score, setScore] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    // Connect to WebSocket
    simpleSocketService.connect(import.meta.env.VITE_SOCKET_URL);

    // Set up event listeners
    simpleSocketService.on("connection", (data) => {
      setIsConnected(data.status === "connected");
      if (data.status === "connected" && tournamentId && matchId) {
        simpleSocketService.joinMatch(tournamentId, matchId, "viewer");
      }
    });

    simpleSocketService.on("matchJoined", (data) => {
      console.log("Joined as viewer:", data);
      if (data.currentState) {
        setScore(data.currentState);
      }
      setViewerCount(data.viewerCount || 0);
    });

    simpleSocketService.on("scoreUpdate", (data) => {
      setScore(data.scoreData);
    });

    simpleSocketService.on("viewerJoined", (data) => {
      setViewerCount(data.viewerCount);
    });

    simpleSocketService.on("viewerLeft", (data) => {
      setViewerCount(data.viewerCount);
    });

    simpleSocketService.on("error", (error) => {
      setError(error.message);
    });

    return () => {
      simpleSocketService.leaveMatch();
      simpleSocketService.disconnect();
    };
  }, [tournamentId, matchId]);

  const formatPoints = (points) => {
    if (points === 0) return "0";
    if (points === 1) return "15";
    if (points === 2) return "30";
    if (points === 3) return "40";
    if (points === 4) return "AD";
    return points.toString();
  };

  if (!isConnected) {
    return (
      <div className="user-app">
        <div className="connection-status">
          <h2>🔌 Connecting to relay server...</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we establish connection.</p>
        </div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="user-app">
        <div className="loading-state">
          <h2>📺 Live Score Display</h2>
          <div className="loading-spinner"></div>
          <p>Waiting for match to start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-app">
      <div className="display-header">
        <h1>🏓 Live Score</h1>
        <div className="match-info">
          <span className="viewers">👥 {viewerCount} viewers</span>
          <span className="tournament">Tournament: {tournamentId}</span>
          <span className="match">Match: {matchId}</span>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="main-scoreboard">
        <div className="team-display team1">
          <div className="team-info">
            <h2>Team 1</h2>
          </div>
          <div className="score-display">
            <div className="score-item">
              <div className="score-label">Sets</div>
              <div className="score-value large">{score.team1Score.sets}</div>
            </div>
            <div className="score-item">
              <div className="score-label">Games</div>
              <div className="score-value">{score.team1Score.games}</div>
            </div>
            <div className="score-item">
              <div className="score-label">Points</div>
              <div className="score-value">{formatPoints(score.team1Score.points)}</div>
            </div>
          </div>
        </div>

        <div className="vs-section">
          <div className="vs-text">VS</div>
          <div className="set-indicator">Set {score.currentSet}</div>
          <div className="serving-indicator">
            Serving: {score.servingTeam}
          </div>
        </div>

        <div className="team-display team2">
          <div className="team-info">
            <h2>Team 2</h2>
          </div>
          <div className="score-display">
            <div className="score-item">
              <div className="score-label">Sets</div>
              <div className="score-value large">{score.team2Score.sets}</div>
            </div>
            <div className="score-item">
              <div className="score-label">Games</div>
              <div className="score-value">{score.team2Score.games}</div>
            </div>
            <div className="score-item">
              <div className="score-label">Points</div>
              <div className="score-value">{formatPoints(score.team2Score.points)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="match-details">
        <div className="detail-item">
          <span>Tournament ID:</span>
          <span>{tournamentId}</span>
        </div>
        <div className="detail-item">
          <span>Match ID:</span>
          <span>{matchId}</span>
        </div>
        <div className="detail-item">
          <span>Current Set:</span>
          <span>{score.currentSet}</span>
        </div>
        <div className="detail-item">
          <span>Serving:</span>
          <span>{score.servingTeam}</span>
        </div>
      </div>
    </div>
  );
};

export default UserApp;
