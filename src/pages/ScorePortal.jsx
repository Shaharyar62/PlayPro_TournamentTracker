import React from "react";
import ScoringCard from "./ScoringCard";
import ScoringUploading from "./ScoringUploading";
import LiveScore from "./LiveScore";

var isUmpire = window.location.search.includes("isUmpire=true");
var matchId = window.location.search.includes("matchId=")
  ? window.location.search.split("matchId=")[1].split("&")[0]
  : null;
var tournamentId = window.location.search.includes("tournamentId=")
  ? window.location.search.split("tournamentId=")[1].split("&")[0]
  : null;
var userId = window.location.search.includes("userId=")
  ? window.location.search.split("userId=")[1].split("&")[0]
  : null;
var token = window.location.search.includes("token=")
  ? window.location.search.split("token=")[1].split("&")[0]
  : null;

export const queryParams = {
  isUmpire: isUmpire,
  matchId: matchId,
  tournamentId: tournamentId,
  userId: userId,
  token: token,
};

export default function ScorePortal() {
  return <>{isUmpire ? <ScoringUploading /> : <LiveScore />}</>;
}
