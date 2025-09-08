import React, { useState, useEffect } from "react";
import ScoreViewer from "./components/ScoreViewer";
import "./ScorePage.css";

const ScorePage = () => {
  const [matchId, setMatchId] = useState("");
  const [tournamentId, setTournamentId] = useState("");
  const [showViewer, setShowViewer] = useState(false);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load available matches on component mount
  useEffect(() => {
    loadAvailableMatches();
  }, []);

  const loadAvailableMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://playpro-score-be.vercel.app/api/matches"
      );
      if (response.ok) {
        const matches = await response.json();
        setAvailableMatches(matches);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartViewing = () => {
    if (matchId && tournamentId) {
      setShowViewer(true);
    }
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
  };

  const handleMatchSelect = (match) => {
    setMatchId(match.matchId);
    setTournamentId(match.tournamentId);
  };

  if (showViewer) {
    return (
      <ScoreViewer
        matchId={matchId}
        tournamentId={tournamentId}
        onClose={handleCloseViewer}
      />
    );
  }

  return (
    <div className="score-page">
      <div className="container">
        <header className="header">
          <h1>🏓 Live Score Viewer</h1>
          <p>Watch live padel match scores in real-time</p>
        </header>

        <div className="content">
          <div className="match-selector">
            <h2>Select Match to View</h2>

            {/* Manual Entry */}
            <div className="manual-entry">
              <h3>Enter Match Details</h3>
              <div className="input-group">
                <label htmlFor="tournamentId">Tournament ID:</label>
                <input
                  type="text"
                  id="tournamentId"
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  placeholder="Enter tournament ID"
                />
              </div>
              <div className="input-group">
                <label htmlFor="matchId">Match ID:</label>
                <input
                  type="text"
                  id="matchId"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  placeholder="Enter match ID"
                />
              </div>
              <button
                className="start-btn"
                onClick={handleStartViewing}
                disabled={!matchId || !tournamentId}
              >
                Start Viewing
              </button>
            </div>

            {/* Available Matches */}
            <div className="available-matches">
              <h3>Available Matches</h3>
              {loading ? (
                <div className="loading">Loading matches...</div>
              ) : availableMatches.length > 0 ? (
                <div className="matches-list">
                  {availableMatches.map((match, index) => (
                    <div
                      key={index}
                      className="match-item"
                      onClick={() => handleMatchSelect(match)}
                    >
                      <div className="match-info">
                        <div className="match-id">Match: {match.matchId}</div>
                        <div className="tournament-id">
                          Tournament: {match.tournamentId}
                        </div>
                        <div className="group-title">
                          {match.groupTitle || "No Group Title"}
                        </div>
                        <div className={`status ${match.status}`}>
                          {match.status === "active"
                            ? "🟢 Active"
                            : "🔴 Completed"}
                        </div>
                      </div>
                      <div className="match-actions">
                        <button
                          className="select-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMatchSelect(match);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-matches">
                  <p>No matches available</p>
                  <button
                    onClick={loadAvailableMatches}
                    className="refresh-btn"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="instructions">
            <h3>How to Use</h3>
            <ol>
              <li>
                Enter the Tournament ID and Match ID from your Flutter app
              </li>
              <li>Click "Start Viewing" to begin real-time score monitoring</li>
              <li>
                The score will update automatically as changes are made in the
                Flutter app
              </li>
              <li>
                You can also select from available matches if any are currently
                active
              </li>
            </ol>
          </div>

          {/* Features */}
          <div className="features">
            <h3>Features</h3>
            <div className="features-grid">
              <div className="feature">
                <div className="feature-icon">⚡</div>
                <h4>Real-time Updates</h4>
                <p>See score changes instantly as they happen</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h4>Live Statistics</h4>
                <p>View games, sets, and tiebreak scores</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🎾</div>
                <h4>Serving Indicator</h4>
                <p>See which player is currently serving</p>
              </div>
              <div className="feature">
                <div className="feature-icon">⚠️</div>
                <h4>Warning System</h4>
                <p>Track team warnings and penalties</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScorePage;
