import React, { useState } from "react";
import UserApp from "../components/UserApp";

const UserPage = () => {
  const [tournamentId, setTournamentId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = () => {
    if (tournamentId.trim() && matchId.trim()) {
      setIsJoined(true);
    }
  };

  const handleReset = () => {
    setIsJoined(false);
    setTournamentId("");
    setMatchId("");
  };

  if (isJoined) {
    return (
      <div>
        <div className="match-controls">
          <button onClick={handleReset} className="back-btn">
            ← Back to Setup
          </button>
        </div>
        <UserApp tournamentId={tournamentId} matchId={matchId} />
      </div>
    );
  }

  return (
    <div className="user-setup">
      <div className="setup-container">
        <h2>📺 Live Score Viewer</h2>
        <p>Enter tournament and match details to view live scores</p>
        
        <div className="input-group">
          <label htmlFor="tournamentId">Tournament ID:</label>
          <input
            id="tournamentId"
            type="text"
            placeholder="e.g., tournament-123"
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="matchId">Match ID:</label>
          <input
            id="matchId"
            type="text"
            placeholder="e.g., match-456"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
          />
        </div>

        <button 
          onClick={handleJoin} 
          disabled={!tournamentId.trim() || !matchId.trim()}
          className="join-btn"
        >
          Join Match as Viewer
        </button>
      </div>
    </div>
  );
};

export default UserPage;
