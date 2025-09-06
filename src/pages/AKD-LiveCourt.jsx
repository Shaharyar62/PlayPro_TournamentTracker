import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Trophy, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { ImageConstants } from "../assets/images/ImageConstants";
import {
  listenToSpecificMatch,
  initializeLiveMatchesListener,
} from "../services/FirebaseService";

import moment from "moment-timezone";

const MatchScoreCard = () => {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const matchId = searchParams.get("matchId");

  // State management
  const [matchData, setMatchData] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayTime, setDisplayTime] = useState(moment().tz("Asia/Karachi"));

  const marqueeVariants = {
    animate: {
      x: ["0%", "-100%"],
      transition: {
        duration: 30,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  // No transformation needed - use Firebase data directly

  // Real-time listener for specific match
  useEffect(() => {
    if (!tournamentId || !matchId) {
      setError("Tournament ID and Match ID are required");
      setLoading(false);
      return;
    }

    const unsubscribe = listenToSpecificMatch(
      tournamentId,
      matchId,
      (firebaseMatch) => {
        if (firebaseMatch) {
          setMatchData(firebaseMatch);
          setError(null);
        } else {
          setError("Match not found");
          setMatchData(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tournamentId, matchId]);

  // Real-time listener for all live matches in tournament
  useEffect(() => {
    if (!tournamentId) return;

    const unsubscribe = initializeLiveMatchesListener(
      tournamentId,
      (matches) => {
        setLiveMatches(matches);
      }
    );

    return () => unsubscribe();
  }, [tournamentId]);

  // Update display time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(moment().tz("Asia/Karachi"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl font-bold text-blue-700">
          Loading match data...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl font-bold text-red-600">Error: {error}</div>
      </div>
    );
  }

  // No match data
  if (!matchData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl font-bold text-gray-600">
          No match data available
        </div>
      </div>
    );
  }

  return (
    <>
      {" "}
      {/* <div
        className="w-full flex justify-end mb-2"
        style={{ marginBottom: "-90px" }}
      >
        <div className="bg-[#00084e] p-[15px] rounded-lg shadow-lg text-[55px] font-bold">
          {displayTime.format("HH:mm:ss")}
        </div>
      </div> */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center grid grid-cols-2 gap-4 items-center justify-center"
      >
        <motion.div
          style={{ position: "relative" }}
          className="w-[300px] justify-self-end"
        >
          <img
            width={300}
            className="justify-self-end p-5"
            src={ImageConstants.padelVerse}
            alt="Playpro"
          />
        </motion.div>

        {/* <div className="text-center">
          <h1 className="text-6xl font-bold mt-4">MATCH SCHEDULE</h1>
          <p
            style={{
              color: "#091368",
              textShadow: "1px 1px 8px white, 3px 3px 11px white",
              fontWeight: 700,
              fontSize: "40px",
            }}
            className="text-[#0caced] text-4xl mt-2 font-semibold"
          >
            HAPPENING NOW
          </p>
        </div> */}
        <motion.div style={{ position: "relative" }} className="w-[300px]">
          <img
            width={300}
            className="justify-self-end p-5"
            src={ImageConstants.playproWhite}
            alt="Playpro"
          />
        </motion.div>
      </motion.div>
      <div className="grid grid-cols-5  mx-auto gap-4">
        <div className="col-span-1">
          {(() => {
            // Collect all logo keys from ImageConstants that start with 'logo'
            const logoKeys = Object.keys(ImageConstants).filter((key) =>
              key.startsWith("logo")
            );
            // Shuffle the array randomly
            const shuffledKeys = logoKeys
              .map((key) => ({ key, sort: Math.random() }))
              .sort((a, b) => a.sort - b.sort)
              .map(({ key }) => key);

            // Optionally, randomize the size and class for each image
            const sizeClasses = ["h-12", "h-12", "h-12", "h-12", "h-12"];

            return (
              <div className="flex flex-col items-center gap-[50px]">
                {shuffledKeys.map((key, idx) => (
                  <img
                    key={key}
                    src={ImageConstants[key]}
                    alt={key}
                    className={
                      sizeClasses[
                        Math.floor(Math.random() * sizeClasses.length)
                      ]
                    }
                  />
                ))}
              </div>
            );
          })()}
        </div>
        <div className="col-span-3">
          <div className=" rounded-lg shadow-lg overflow-hidden">
            {/* Header with match info */}
            <div className="relative bg-gradient-to-r from-blue-800 via-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="absolute inset-0 bg-opacity-50"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center space-x-3">
                  {/* <Trophy className="h-8 w-8 text-yellow-300" /> */}
                  <h2 className="text-4xl font-bold tracking-wider">
                    Court {matchData.id || "Live"}
                  </h2>
                </div>
                <div className="text-2xl bg-blue-900 bg-opacity-70 px-4 py-2 rounded-full flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {matchData.matchTitle || "Live Match"}
                </div>
              </div>
            </div>

            {/* Match score display */}
            <div className="bg-gradient-to-b from-gray-100 to-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-10 items-center">
                  {/* Team A */}
                  <div className="flex-1 flex flex-col items-start">
                    {matchData.status === "completed" &&
                      matchData.team1?.sets > matchData.team2?.sets && (
                        <div className="absolute -top-5 -left-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center transform">
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                      )}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-center">
                        <span className="text-3xl font-semibold">
                          {matchData.team1?.players
                            ?.map((p) => p.name)
                            .join(" & ") || "Team 1"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        {matchData.team1?.players?.map((player, index) => (
                          <div key={player.id} className="flex flex-col gap-3">
                            <img
                              src={
                                player.image
                                  ? `https://dev2playpro.nascentinnovations.com/img/upload/${player.image}`
                                  : "https://via.placeholder.com/150x150?text=No+Image"
                              }
                              alt={player.name}
                              className="w-34 h-34 rounded-full object-cover shadow-lg"
                            />
                            <span className="text-lg font-semibold">
                              {player.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Team B */}
                  <div className="flex-1 flex flex-col items-end">
                    {matchData.status === "completed" &&
                      matchData.team2?.sets > matchData.team1?.sets && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center transform rotate-12">
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                      )}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-center">
                        <span className="text-3xl font-semibold">
                          {matchData.team2?.players
                            ?.map((p) => p.name)
                            .join(" & ") || "Team 2"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        {matchData.team2?.players?.map((player, index) => (
                          <div key={player.id} className="flex flex-col gap-3">
                            <img
                              src={
                                player.image
                                  ? `https://dev2playpro.nascentinnovations.com/img/upload/${player.image}`
                                  : "https://via.placeholder.com/150x150?text=No+Image"
                              }
                              alt={player.name}
                              className="w-34 h-34 rounded-full object-cover shadow-lg"
                            />
                            <span className="text-lg font-semibold">
                              {player.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-10 items-center">
                  {/* Current scores */}
                  <div className="mt-5 flex justify-center">
                    <div className="bg-gray-20 rounded-lg p-4 grid grid-cols-5 gap-24">
                      {/* Set 1 */}
                      <div className="text-center">
                        <div className=" font-bold text-4xl text-gray-600 py-1 mb-2">
                          SET 1
                        </div>
                        <div className="flex justify-center flex-col items-center space-x-4">
                          <span
                            className={`text-8xl font-bold ${
                              matchData.team1?.sets > matchData.team2?.sets
                                ? "text-blue-700"
                                : "text-gray-800"
                            }`}
                          >
                            {matchData.team1?.sets || 0}
                          </span>
                          <span className="text-gray-500 font-bold text-8xl">
                            -
                          </span>
                          <span
                            className={`text-8xl font-bold ${
                              matchData.team2?.sets > matchData.team1?.sets
                                ? "text-blue-700"
                                : "text-gray-800"
                            }`}
                          >
                            {matchData.team2?.sets || 0}
                          </span>
                        </div>
                      </div>
                      {/* Set 2 */}
                      <div className="text-center">
                        <div className=" font-bold text-4xl text-gray-600 py-1 mb-2">
                          SET 2
                        </div>
                        <div className="flex justify-center flex-col items-center space-x-4">
                          <span className={`text-8xl font-bold text-gray-800`}>
                            -
                          </span>
                          <span className="text-gray-500 font-bold text-8xl">
                            -
                          </span>
                          <span className={`text-8xl font-bold text-gray-800`}>
                            -
                          </span>
                        </div>
                      </div>
                      {/* Set 3 */}
                      <div className="text-center">
                        <div className=" font-bold text-4xl text-gray-600 py-1 mb-2">
                          SET 3
                        </div>
                        <div className="flex justify-center flex-col items-center space-x-4">
                          <span className={`text-8xl font-bold text-gray-800`}>
                            -
                          </span>
                          <span className="text-gray-500 font-bold text-8xl">
                            -
                          </span>
                          <span className={`text-8xl font-bold text-gray-800`}>
                            -
                          </span>
                        </div>
                      </div>
                      {/* Current Games */}
                      <div className="text-center">
                        <div className=" font-bold text-4xl text-gray-600 mb-2">
                          GAME
                        </div>
                        <div className="flex justify-center flex-col items-center space-x-4">
                          <span
                            className={`text-8xl font-bold ${
                              matchData.team1?.games > matchData.team2?.games
                                ? "text-blue-700"
                                : "text-gray-800"
                            }`}
                          >
                            {matchData.team1?.games || 0}
                          </span>
                          <span className="text-gray-500 font-bold text-8xl">
                            -
                          </span>
                          <span
                            className={`text-8xl font-bold ${
                              matchData.team2?.games > matchData.team1?.games
                                ? "text-blue-700"
                                : "text-gray-800"
                            }`}
                          >
                            {matchData.team2?.games || 0}
                          </span>
                        </div>
                      </div>
                      {/* Current Points */}
                      <div className="text-center">
                        <div className=" font-bold text-4xl text-gray-600 mb-2">
                          SCORE
                        </div>
                        <div className="flex justify-center flex-col items-center space-x-4">
                          <span className={`text-8xl font-bold text-blue-700`}>
                            {matchData.team1?.score || 0}
                          </span>
                          <span className="text-gray-500 font-bold text-8xl">
                            -
                          </span>
                          <span className={`text-8xl font-bold text-blue-700`}>
                            {matchData.team2?.score || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Score */}
                  {/* <div className="text-center mt-6">
                    <div className="flex items-center space-x-3 justify-center">
                      <div
                        className={`text-4xl font-bold ${
                          matchData.teamA.winner
                            ? "text-blue-700"
                            : "text-gray-800"
                        }`}
                      >
                        {matchData.teamA.total}
                      </div>
                      <div className="text-gray-500 font-light text-lg">-</div>
                      <div
                        className={`text-4xl font-bold ${
                          matchData.teamB.winner
                            ? "text-red-600"
                            : "text-gray-800"
                        }`}
                      >
                        {matchData.teamB.total}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">FINAL SCORE</div>
                  </div> */}
                </div>
              </div>
              {/* 
              <div className="text mt-6 relative z-10">
                {matchData.date} • {matchData.time} • {matchData.round}
              </div> */}
            </div>

            {/* Footer */}
            {/* <div className="px-4 py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white text-xs">
              <div className="flex justify-between items-center">
                <div className="text-blue-200">Match #{matchData.matchId}</div>
                <div className="text-blue-200">PADELVERSE CUP 2025</div>
              </div>
            </div> */}
          </div>
          <div className="rounded-lg shadow-lg overflow-hidden mt-5">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-800 via-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="absolute inset-0 bg-opacity-50"></div>
              <div className="flex justify-between items-center relative z-10">
                <h2 className="text-4xl font-bold text-center tracking-wider">
                  Upcoming Matches
                </h2>
              </div>
            </div>
            {/* Upcoming Matches List Body */}
            <div className="bg-gradient-to-b from-gray-100 to-white p-6">
              <ul className="divide-y divide-gray-200">
                {/* Live matches from Firebase */}
                {liveMatches.length > 0 ? (
                  liveMatches.map((match, idx) => (
                    <li
                      key={match.id}
                      className="py-4 flex flex-col md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex flex-col text-3xl md:flex-row md:items-center gap-2">
                        <span className="font-semibold text-blue-800">
                          Match {match.id}
                        </span>
                        <span className="text-gray-500 hidden md:inline mx-2">
                          |
                        </span>
                        <span className="text-gray-700">
                          {match.matchTitle || "Live Match"}
                        </span>
                        <span className="text-gray-500 hidden md:inline mx-2">
                          |
                        </span>
                        <span className="text-gray-600">
                          {match.status || "ongoing"}
                        </span>
                      </div>
                      <div className="mt-2 md:mt-0  text-3xl flex flex-col md:flex-row md:items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {match.team1?.players
                            ?.map((p) => p.name)
                            .join(" & ") || "Team 1"}
                        </span>
                        <span className="text-gray-500 font-bold">vs</span>
                        <span className="font-medium text-gray-800">
                          {match.team2?.players
                            ?.map((p) => p.name)
                            .join(" & ") || "Team 2"}
                        </span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-8 text-center">
                    <div className="text-2xl text-gray-500">
                      No live matches available at the moment
                    </div>
                  </li>
                )}
              </ul>
            </div>
            {/* Footer */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white text-xs">
              <div className="flex justify-between  text-3xl items-center">
                <div className="text-blue-200">Live Matches</div>
                <div className="text-blue-200">TOURNAMENT 2025</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          {(() => {
            // Collect all logo keys from ImageConstants that start with 'logo'
            const logoKeys = Object.keys(ImageConstants).filter((key) =>
              key.startsWith("logo")
            );
            // Shuffle the array randomly
            const shuffledKeys = logoKeys
              .map((key) => ({ key, sort: Math.random() }))
              .sort((a, b) => a.sort - b.sort)
              .map(({ key }) => key);

            // Optionally, randomize the size and class for each image
            const sizeClasses = ["h-12", "h-12", "h-12", "h-12", "h-12"];

            return (
              <div className="flex flex-col items-center gap-[50px]">
                {shuffledKeys.map((key, idx) => (
                  <img
                    key={key}
                    src={ImageConstants[key]}
                    alt={key}
                    className={
                      sizeClasses[
                        Math.floor(Math.random() * sizeClasses.length)
                      ]
                    }
                  />
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default MatchScoreCard;
