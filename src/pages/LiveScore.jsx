import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { listenToMatchUpdates } from "../services/FirebaseService";
import { queryParams } from "./ScorePortal";

import logo from "./../assets/images/logo.png";
import s1 from "./../assets/images/s1.png";
import s2 from "./../assets/images/s2.png";
const LiveScore = () => {
  const { tournamentId, matchId } = queryParams;
  const [matchData, setMatchData] = useState({
    currentMatchState: {
      score: {
        currentSet: 0,
        sets: [
          { team1Games: 0, team2Games: 0 },
          { team1Games: 0, team2Games: 0 },
          { team1Games: 0, team2Games: 0 },
        ],
        currentGame: {
          team1Points: "0",
          team2Points: "0",
        },
        completed: false,
        winner: "",
      },
    },
    teams: {
      team1: { players: [] },
      team2: { players: [] },
    },
  });

  useEffect(() => {
    // Set up real-time listener for match updates
    const unsubscribe = listenToMatchUpdates(
      tournamentId,
      matchId,
      (matchUpdate) => {
        if (matchUpdate) {
          setMatchData(matchUpdate);
        }
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [tournamentId, matchId]);

  const getTeamName = (players) => {
    if (!players || players.length === 0) return "Team";
    if (players.length === 1) return players[0].name;
    return `${players[0].name} & ${players[1].name}`;
  };

  return (
    <div className="p-2 mx-auto  bg-gray-100 min-h-screen">
      <img width="200px" src={logo} className="m-auto mb-0" />
      <h3 className="text-black mb-5">
        <strong className="">Live Scoring</strong>
      </h3>

      {/* <h2 className="text-[30px] font-bold text-gray-800 mb-4 mt-0 px-2">
        Tournament Name
      </h2> */}
      <div className="bg-gray-900 text-white rounded-sm p-2 shadow-lg mb-2">
        {/* Current Set Display */}
        <div className="flex flex-col flex-row justify-around  items-center mb-6">
          <div className="text-center">
            <h3 className="font-medium text-gray-400 text-sm mb-2">
              CURRENT SET
            </h3>
            <div className="text-xl font-bold bg-blue-900 px-4 py-2 rounded-lg inline-block">
              {matchData.currentMatchState.score.currentSet + 1}
            </div>
          </div>

          {/* Match Score Display */}
          <div className="text-center">
            <h3 className="font-medium text-gray-400 text-sm mb-2">
              MATCH SCORE
            </h3>
            <div className="text-2xl font-bold flex justify-center gap-1">
              {matchData.currentMatchState.score.sets.map((set, index) => (
                <div
                  key={index}
                  className={`inline-block px-4 py-2 rounded ${
                    index === matchData.currentMatchState.score.currentSet
                      ? "bg-blue-700"
                      : "bg-gray-800"
                  }`}
                >
                  <span className="text-blue-300">{set.team1Games}</span>
                  <span className="mx-1">-</span>
                  <span className="text-red-300">{set.team2Games}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Game Score */}
        <div className="grid grid-cols-2 gap-3">
          {/* Team 1 Score */}
          <div className="text-center">
            <motion.div
              className="mb-2 text-6xl font-bold text-white bg-gradient-to-br from-blue-700 to-blue-900 py-8 rounded-2xl shadow-2xl border-2 border-blue-600/30"
              key={matchData.currentMatchState.score.currentGame.team1Points}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {matchData.currentMatchState.score.currentGame.team1Points}
            </motion.div>
            <h3 className="mb-2 text-md font-medium text-blue-300 flex items-center justify-center">
              {getTeamName(matchData.team1Players)}
            </h3>
          </div>

          {/* Team 2 Score */}
          <div className="text-center">
            <motion.div
              className="mb-2 text-6xl font-bold text-white bg-gradient-to-br from-red-700 to-red-900 py-8 rounded-2xl shadow-2xl border-2 border-red-600/30"
              key={matchData.currentMatchState.score.currentGame.team2Points}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {matchData.currentMatchState.score.currentGame.team2Points}
            </motion.div>
            <h3 className="mb-2 text-md font-medium text-red-300 flex items-center justify-center">
              {getTeamName(matchData.team2Players)}
            </h3>
          </div>
        </div>

        {/* Match Complete Message */}
        {matchData.currentMatchState.score.completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center p-8 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg shadow-lg"
          >
            <div className="text-4xl mb-2">🏆 Match Complete!</div>
            <div className="text-2xl">
              Winner:{" "}
              {matchData.currentMatchState.score.winner === "team1"
                ? getTeamName(matchData.team1Players)
                : getTeamName(matchData.team2Players)}
            </div>
          </motion.div>
        )}
      </div>
      {/* <p className="mb-2">
        <strong className="text-center text-black mb-2">Partner</strong>
      </p> */}
      <div className="grid grid-cols-2 ml-10 mr-10 gap-3">
        <img style={{ marginTop: -15 }} src={s2} />
        <img src={s1} />
      </div>
    </div>
  );
};

export default LiveScore;
