import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./ScoreViewer.css";

const ScoreViewer = ({ matchId, tournamentId, onClose }) => {
  const [matchData, setMatchData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResetNotification, setShowResetNotification] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io("http://3.216.122.79", {
      transports: ["websocket"],
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setError("Failed to connect to server");
      setIsConnected(false);
    });

    // Listen for match updates
    socket.on(`match_update_${matchId}`, (data) => {
      console.log("Match update received:", data);
      setMatchData(data);
      setLoading(false);
    });

    // Listen for reset events
    socket.on(`match_reset_${matchId}`, (data) => {
      console.log("Match reset received:", data);
      setMatchData(data);
      setLoading(false);
      setShowResetNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowResetNotification(false), 3000);
    });

    // Listen for tournament updates
    socket.on(`tournament_update_${tournamentId}`, (data) => {
      console.log("Tournament update received:", data);
    });

    // Request initial match state
    socket.emit("get_match_state", {
      tournamentId: tournamentId,
      matchId: matchId,
    });

    // Handle match state response
    socket.on("get_match_state_response", (data) => {
      if (data) {
        setMatchData(data);
        setLoading(false);
      } else {
        setError("Match not found");
        setLoading(false);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [matchId, tournamentId]);

  const formatScore = (score) => {
    const scoreStrings = ["00", "15", "30", "40", "AD"];
    if (score < scoreStrings.length) {
      return scoreStrings[score];
    }
    return "AD";
  };

  const getSetScore = (teamName, setIndex) => {
    if (!matchData || !matchData.sets) return "-";

    const setKey = setIndex.toString();
    const setData = matchData.sets[setKey];

    if (!setData) return "-";

    const teamKey = teamName === "Team 1" ? "team1Games" : "team2Games";
    return setData[teamKey] || 0;
  };

  const getCurrentScore = (teamName) => {
    if (!matchData) return "00";

    const team = teamName === "Team 1" ? matchData.team1 : matchData.team2;

    if (matchData.isInTiebreak) {
      return team.tiebreakScore || 0;
    }

    return formatScore(team.score || 0);
  };

  const getCurrentGames = (teamName) => {
    if (!matchData) return 0;

    const team = teamName === "Team 1" ? matchData.team1 : matchData.team2;
    return team.games || 0;
  };

  const getCurrentSets = (teamName) => {
    if (!matchData) return 0;

    const team = teamName === "Team 1" ? matchData.team1 : matchData.team2;
    return team.sets || 0;
  };

  const getPlayerNames = (teamName) => {
    if (!matchData) return ["Player 1", "Player 2"];

    const team = teamName === "Team 1" ? matchData.team1 : matchData.team2;
    return team.players?.map((p) => p.name) || ["Player 1", "Player 2"];
  };

  const getWarnings = (teamName) => {
    if (!matchData) return [];

    const team = teamName === "Team 1" ? matchData.team1 : matchData.team2;
    return team.warnings || [];
  };

  const isServing = (teamName) => {
    if (!matchData || !matchData.currentServe) return false;

    return matchData.currentServe.isServingTeam1 === (teamName === "Team 1");
  };

  if (loading) {
    return (
      <div className="score-viewer">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading match data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="score-viewer">
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="score-viewer">
        <div className="error">
          <h3>Match Not Found</h3>
          <p>Match ID: {matchId}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const numberOfSets = matchData.matchSettings?.numberOfSets || 3;
  const isTiebreak = matchData.isInTiebreak;
  const isSuperTiebreak = matchData.isInSuperTiebreak;

  return (
    <div className="score-viewer">
      <div className="header">
        <div className="connection-status">
          <div
            className={`status-indicator ${
              isConnected ? "connected" : "disconnected"
            }`}
          ></div>
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="match-info">
        <h2>{matchData.groupTitle || "Match"}</h2>
        <div className="match-status">
          {matchData.status === "completed" ? (
            <span className="completed">
              Match Completed - {matchData.winnerTeam} Wins!
            </span>
          ) : (
            <span className="active">Match in Progress</span>
          )}
        </div>
        {showResetNotification && (
          <div className="reset-notification">
            🔄 Match has been reset by the scorer
          </div>
        )}
      </div>

      <div className="scoreboard">
        {/* Set Headers */}
        <div className="set-headers">
          {Array.from({ length: numberOfSets }, (_, i) => (
            <div key={i} className="set-header">
              SET {i + 1}
            </div>
          ))}
          <div className="score-header">
            {isSuperTiebreak
              ? "SUPER TIEBREAK"
              : isTiebreak
              ? "TIEBREAK"
              : "SCORE"}
          </div>
        </div>

        {/* Team 1 Row */}
        <div className="team-row team1">
          <div className="team-info">
            <div className="team-name">Team 1</div>
            <div className="players">
              {getPlayerNames("Team 1").map((player, index) => (
                <div key={index} className="player">
                  {player}
                  {isServing("Team 1") && index === 0 && (
                    <span className="serving">🎾</span>
                  )}
                </div>
              ))}
            </div>
            <div className="warnings">
              {getWarnings("Team 1").map((warning, index) => (
                <span
                  key={index}
                  className={`warning ${warning === "W1" ? "yellow" : "red"}`}
                >
                  {warning}
                </span>
              ))}
            </div>
          </div>

          {/* Set Scores */}
          {Array.from({ length: numberOfSets }, (_, i) => (
            <div key={i} className="set-score">
              {getSetScore("Team 1", i)}
            </div>
          ))}

          {/* Current Score */}
          <div className="current-score team1-score">
            {getCurrentScore("Team 1")}
          </div>
        </div>

        {/* Team 2 Row */}
        <div className="team-row team2">
          <div className="team-info">
            <div className="team-name">Team 2</div>
            <div className="players">
              {getPlayerNames("Team 2").map((player, index) => (
                <div key={index} className="player">
                  {player}
                  {isServing("Team 2") && index === 0 && (
                    <span className="serving">🎾</span>
                  )}
                </div>
              ))}
            </div>
            <div className="warnings">
              {getWarnings("Team 2").map((warning, index) => (
                <span
                  key={index}
                  className={`warning ${warning === "W1" ? "yellow" : "red"}`}
                >
                  {warning}
                </span>
              ))}
            </div>
          </div>

          {/* Set Scores */}
          {Array.from({ length: numberOfSets }, (_, i) => (
            <div key={i} className="set-score">
              {getSetScore("Team 2", i)}
            </div>
          ))}

          {/* Current Score */}
          <div className="current-score team2-score">
            {getCurrentScore("Team 2")}
          </div>
        </div>
      </div>

      {/* Match Stats */}
      <div className="match-stats">
        <div className="stat">
          <span className="label">Games:</span>
          <span className="value">
            {getCurrentGames("Team 1")} - {getCurrentGames("Team 2")}
          </span>
        </div>
        <div className="stat">
          <span className="label">Sets:</span>
          <span className="value">
            {getCurrentSets("Team 1")} - {getCurrentSets("Team 2")}
          </span>
        </div>
        {isTiebreak && (
          <div className="stat">
            <span className="label">Tiebreak:</span>
            <span className="value">
              {matchData.team1.tiebreakScore || 0} -{" "}
              {matchData.team2.tiebreakScore || 0}
            </span>
          </div>
        )}
      </div>

      {/* Last Update */}
      <div className="last-update">
        Last updated: {new Date(matchData.updatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default ScoreViewer;
