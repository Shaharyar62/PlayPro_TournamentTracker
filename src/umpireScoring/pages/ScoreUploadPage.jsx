import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { useUmpire } from "../context/UmpireContext";
import ScoreUpload from "../components/ScoreUpload";

const ScoreUploadPage = () => {
  const navigate = useNavigate();
  const { currentMatch, currentCourt, logout, endMatch } = useUmpire();

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

  if (!currentCourt) {
    navigate("../login");
    return null;
  }

  if (!currentMatch) {
    navigate("../matches");
    return null;
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
