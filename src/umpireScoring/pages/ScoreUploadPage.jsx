import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUmpire } from "../context/UmpireContext";
import ScoreUpload from "../components/ScoreUpload";

const ScoreUploadPage = () => {
  const navigate = useNavigate();
  const { currentMatch, logout, endMatch, isAuthenticated } = useUmpire();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("../login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Redirect if no match is selected
  useEffect(() => {
    if (isAuthenticated && !currentMatch) {
      navigate("../matches", { replace: true });
    }
  }, [isAuthenticated, currentMatch, navigate]);

  const handleBack = () => {
    navigate("../matches");
  };

  const handleLogout = () => {
    logout();
    navigate("../login");
  };

  const handleSave = (scores) => {
    // Auto-save is handled in ScoreUpload component
    console.log("Scores saved:", scores);
  };

  const handleEndMatch = (matchId, finalScores) => {
    endMatch(matchId, finalScores);
    navigate("../matches");
  };

  // Show loading state while checking authentication or waiting for match
  if (!isAuthenticated || !currentMatch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  return (
    <ScoreUpload
      match={currentMatch}
      onSave={handleSave}
      onEndMatch={handleEndMatch}
      onBack={handleBack}
    />
  );
};

export default ScoreUploadPage;
