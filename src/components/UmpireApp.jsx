import React, { useState, useEffect } from "react";
import simpleSocketService from "../services/simpleSocketService";
import "./UmpireApp.css";

const UmpireApp = ({ tournamentId, matchId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [score, setScore] = useState({
    team1Score: { sets: 0, games: 0, points: 0 },
    team2Score: { sets: 0, games: 0, points: 0 },
    currentSet: 1,
    servingTeam: "team1",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Connect to WebSocket
    simpleSocketService.connect(import.meta.env.VITE_SOCKET_URL);

    // Set up event listeners
    simpleSocketService.on("connection", (data) => {
      setIsConnected(data.status === "connected");
      if (data.status === "connected" && tournamentId && matchId) {
        simpleSocketService.joinMatch(tournamentId, matchId, "umpire");
      }
    });

    simpleSocketService.on("matchJoined", (data) => {
      console.log("Joined as umpire:", data);
      if (data.currentState) {
        setScore(data.currentState);
      }
    });

    simpleSocketService.on("error", (error) => {
      setError(error.message);
    });

    return () => {
      simpleSocketService.leaveMatch();
      simpleSocketService.disconnect();
    };
  }, [tournamentId, matchId]);

  const updateScore = (newScore) => {
    try {
      setScore(newScore);
      simpleSocketService.updateScore(newScore);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const addPoint = (team) => {
    const teamKey = team === 1 ? "team1Score" : "team2Score";
    const newScore = {
      ...score,
      [teamKey]: {
        ...score[teamKey],
        points: score[teamKey].points + 1,
      },
    };
    updateScore(newScore);
  };

  const addGame = (team) => {
    const teamKey = team === 1 ? "team1Score" : "team2Score";
    const newScore = {
      ...score,
      [teamKey]: {
        ...score[teamKey],
        games: score[teamKey].games + 1,
        points: 0,
      },
    };
    updateScore(newScore);
  };

  const addSet = (team) => {
    const teamKey = team === 1 ? "team1Score" : "team2Score";
    const newScore = {
      ...score,
      [teamKey]: {
        ...score[teamKey],
        sets: score[teamKey].sets + 1,
        games: 0,
        points: 0,
      },
      currentSet: score.currentSet + 1,
    };
    updateScore(newScore);
  };

  const resetScore = () => {
    const newScore = {
      team1Score: { sets: 0, games: 0, points: 0 },
      team2Score: { sets: 0, games: 0, points: 0 },
      currentSet: 1,
      servingTeam: "team1",
    };
    updateScore(newScore);
  };

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
      <div className="umpire-app">
        <div className="connection-status">
          <h2>🔌 Connecting to relay server...</h2>
          <p>Please wait while we establish connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="umpire-app">
      <div className="umpire-header">
        <h2>🏓 Umpire Score Entry</h2>
        <div className="match-info">
          <span>Tournament: {tournamentId}</span>
          <span>Match: {matchId}</span>
          <span>Set: {score.currentSet}</span>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="scoreboard">
        <div className="team-section">
          <h3>Team 1</h3>
          <div className="score-display">
            <div className="score-item">
              <span className="label">Sets</span>
              <span className="value">{score.team1Score.sets}</span>
            </div>
            <div className="score-item">
              <span className="label">Games</span>
              <span className="value">{score.team1Score.games}</span>
            </div>
            <div className="score-item">
              <span className="label">Points</span>
              <span className="value">{formatPoints(score.team1Score.points)}</span>
            </div>
          </div>
          <div className="controls">
            <button onClick={() => addPoint(1)}>+1 Point</button>
            <button onClick={() => addGame(1)}>+1 Game</button>
            <button onClick={() => addSet(1)}>+1 Set</button>
          </div>
        </div>

        <div className="vs-section">VS</div>

        <div className="team-section">
          <h3>Team 2</h3>
          <div className="score-display">
            <div className="score-item">
              <span className="label">Sets</span>
              <span className="value">{score.team2Score.sets}</span>
            </div>
            <div className="score-item">
              <span className="label">Games</span>
              <span className="value">{score.team2Score.games}</span>
            </div>
            <div className="score-item">
              <span className="label">Points</span>
              <span className="value">{formatPoints(score.team2Score.points)}</span>
            </div>
          </div>
          <div className="controls">
            <button onClick={() => addPoint(2)}>+1 Point</button>
            <button onClick={() => addGame(2)}>+1 Game</button>
            <button onClick={() => addSet(2)}>+1 Set</button>
          </div>
        </div>
      </div>

      <div className="match-controls">
        <button onClick={resetScore} className="reset-btn">
          Reset Match
        </button>
        <div className="serving-info">
          <span>Serving: {score.servingTeam}</span>
        </div>
      </div>
    </div>
  );
};

export default UmpireApp;
