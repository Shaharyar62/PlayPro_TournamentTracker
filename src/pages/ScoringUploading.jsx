import React, { useState, useEffect } from "react";
// import { db } from "../../../firebase/config";
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import logo from "./../assets/images/logo.png";
import { queryParams } from "./ScorePortal";
import {
  getTournament,
  updateMatchScore,
  updateTournamentStatus,
} from "../services/APIService";
import {
  addPoint,
  deleteMatch,
  getIsMatchInitialized,
  initializeMatch,
  listenToMatchUpdates,
  undoLastPoint,
} from "../services/FirebaseService";
import {
  TournamentMatchPlayStatusEnum,
  TournamentMatchResultEnum,
} from "../const/Constants";

import { Undo2, Trash } from "lucide-react";

const MatchScoring = () => {
  const [sportType, setSportType] = useState("padel");
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentData, setTournamentData] = useState(null);
  const [isResultSaved, setIsResultSaved] = useState(false);

  const [matchData, setMatchData] = useState({
    tournamentName: "",
    matchNumber: "",
    roundType: "group",
    sportType: "padel",
    isKnockout: true,
    team1Players: [],
    team2Players: [],
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
      team1: {
        players: [],
        id: "",
        // other team details
      },
      team2: {
        players: [],
        id: "",
        // other team details
      },
    },
  });

  const scorePoints = {
    padel: ["0", "15", "30", "40", "AD"],
  };

  const setsToWin = {
    padel: 2, // Best of 3
  };

  const pointsToWinGame = {
    padel: 4, // 0, 15, 30, 40, Game (with advantage rules)
  };

  const gamesToWinSet = {
    padel: 6, // First to 6 (with 2 game difference)
  };

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    getTournament(queryParams.tournamentId, queryParams.matchId)
      .then(async (data) => {
        setTournamentData(data);
        var match = data.matches.find((item) => item.id == queryParams.matchId);
        if (match.isResultUploaded) {
          setIsResultSaved(true);
        }
        console.log("getTournament_data", data);
        const isMatchInitialized = await getIsMatchInitialized(
          queryParams.tournamentId,
          queryParams.matchId
        );
        setIsStarted(isMatchInitialized);
        if (!isMatchInitialized) {
          startMatch(data, match);
          // setMatchData({
          //   ...matchData,
          //   tournamentName: data.name,
          //   team1Players: data.teams[0].players.map((player) => ({
          //     id: player.id,
          //     name: player.playerName,
          //   })),
          //   team2Players: data.teams[1].players.map((player) => ({
          //     id: player.id,
          //     name: player.playerName,
          //   })),
          // });
        }

        setIsLoading(false);

        // Set up real-time listener
        const unsubscribe = listenToMatchUpdates(
          queryParams.tournamentId,
          queryParams.matchId,
          (matchUpdate) => {
            if (matchUpdate) {
              console.log("matchUpdate", matchUpdate);
              setMatchData(matchUpdate); // Direct update as structures now match
            }
          }
        );

        return () => unsubscribe();
      })
      .catch((error) => {
        alert("Error fetching tournament data:");
        console.error("Error fetching tournament data:", error);
        setIsLoading(false);
      });
  };

  const resetMatch = async () => {
    await deleteMatch(queryParams.tournamentId, queryParams.matchId);
    var match = tournamentData.matches.find(
      (item) => item.id == queryParams.matchId
    );
    startMatch(tournamentData, match);
  };

  // useEffect(() => {
  //   // Update match data when sport type changes
  //   setMatchData((prev) => ({
  //     ...prev,
  //     sportType,
  //     currentMatchState: {
  //       ...prev.currentMatchState,
  //       score: {
  //         ...prev.currentMatchState.score,
  //         currentGame: {
  //           ...prev.currentMatchState.score.currentGame,
  //           team1Points: "0",
  //           team2Points: "0",
  //         },
  //         currentSet: 0,
  //         completed: false,
  //         winner: "",
  //       },
  //       sets: [
  //         { team1Games: 0, team2Games: 0 },
  //         { team1Games: 0, team2Games: 0 },
  //         { team1Games: 0, team2Games: 0 },
  //       ],
  //     },
  //     teams: {
  //       ...prev.teams,
  //       team1: {
  //         ...prev.teams.team1,
  //         currentGameScore: "0",
  //         sets: [0, 0, 0],
  //       },
  //       team2: {
  //         ...prev.teams.team2,
  //         currentGameScore: "0",
  //         sets: [0, 0, 0],
  //       },
  //     },
  //   }));
  // }, [sportType]);

  const startMatch = async (data, match) => {
    setIsLoading(true);

    // const isSuccess = await updateTournamentStatus(
    //   +queryParams.matchId,
    //   TournamentMatchPlayStatusEnum.inProgress
    // );

    // if (isSuccess) {
    await initializeMatch({
      tournamentId: queryParams.tournamentId,
      matchId: queryParams.matchId,
      isKnockout: match.stageType != 1,
      tournamentName: data.name,
      matchNumber: "",
      roundType: "group",
      sportType: "padel",
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
        team1: {
          id: data.teams[0].id,
          players: data.teams[0].players.map((player) => ({
            id: player.id,
            name: player.playerName,
          })),
          groupId: data.teams[0].groupId,
        },
        team2: {
          id: data.teams[1].id,
          players: data.teams[1].players.map((player) => ({
            id: player.id,
            name: player.playerName,
          })),
          groupId: data.teams[1].groupId,
        },
      },
    });
    setIsStarted(true);
    setIsLoading(false);
    // }
  };

  const updateGameScore = (team, increment) => {
    const historyEntry = {
      team,
      action: increment ? "add" : "subtract",
      timestamp: new Date().toISOString(),
      previousState: {
        currentSet: matchData.currentMatchState.score.currentSet,
        currentGame: { ...matchData.currentMatchState.score.currentGame },
        sets: JSON.parse(
          JSON.stringify(matchData.currentMatchState.score.sets)
        ),
      },
    };

    addPoint(
      queryParams.tournamentId,
      queryParams.matchId,
      team,
      increment,
      historyEntry,
      matchData.isKnockout
    );
  };

  const prepareMatchResults = () => {
    const results = [];
    var team1Players = matchData.team1Players;
    var team2Players = matchData.team2Players;
    const { score } = matchData.currentMatchState;
    const isTeam1Winner = score.winner === "team1";

    // Determine result type based on winner
    const resultType = isTeam1Winner
      ? TournamentMatchResultEnum.teamAWon
      : TournamentMatchResultEnum.teamBWon;

    // Process team 1 players (side A)
    team1Players.forEach((player) => {
      // For each set (round)
      for (let round = 1; round <= 3; round++) {
        const setData = score.sets[round - 1] || {
          team1Games: 0,
          team2Games: 0,
        };

        results.push({
          bookingResultTmpId: 0,
          playerId: player.id,
          side: "A",
          round: round,
          points: setData.team1Games || 0,
          gameType: 1,
          resultType,
        });
      }
    });

    // Process team 2 players (side B)
    team2Players.forEach((player) => {
      // For each set (round)
      for (let round = 1; round <= 3; round++) {
        const setData = score.sets[round - 1] || {
          team1Games: 0,
          team2Games: 0,
        };

        results.push({
          bookingResultTmpId: 0,
          playerId: player.id,
          side: "B",
          round: round,
          points: setData.team2Games || 0,
          gameType: 1,
          resultType,
        });
      }
    });

    return {
      results: JSON.stringify(results),
      matchResult: resultType,
    };
  };

  const saveMatch = async () => {
    setIsLoading(true);
    // Prepare match results data for API

    var results = prepareMatchResults();

    var data = {
      ...results,
      tournamentScheduleId: +queryParams.matchId,
      playStatus: TournamentMatchPlayStatusEnum.completed,
      isReUploadResult: false,
    };

    console.log("Match results prepared:", data);

    const isSuccess = await updateMatchScore(data);
    setIsLoading(false);
    setIsResultSaved(true);
    if (isSuccess) {
      alert("Match results saved successfully");
    } else {
      alert("Failed to save match results");
    }
  };

  return (
    <div className="container mx-auto p-1 bg-gray-100 min-h-screen">
      <div className=" rounded-lg shadow-xl p-2 max-w-5xl mx-auto">
        <div className="flex justify-center items-center flex-col gap-4 mb-6">
          <img src={logo} alt="Sports Logo" className="h-15" />
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            {matchData.tournamentName}
          </h1>
        </div>

        <div className="grid grid-cols-1 text-center  gap-5 mb-8">
          {/* Match Type Display */}
          <div>
            <h2 className="text-2xl text-center font-bold text-gray-800 mb-2">
              {matchData.roundType === "group" && "Group Stage"}
              {matchData.roundType === "round16" && "Round of 16"}
              {matchData.roundType === "quarter-final" && "Quarter Final"}
              {matchData.roundType === "semi-final" && "Semi Final"}
              {matchData.roundType === "final" && "Final"}
            </h2>
          </div>
        </div>
        {/* Teams Section */}
        <div className="grid grid-cols-2 gap-5 mb-10">
          {/* Team 1 */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-3 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold  text-center text-blue-800">
                Team 1
              </h2>
              {/* <div className="mt-[-20px] text-blue-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="54"
                  height="54"
                  viewBox="0 0 24 24"
                >
                  <ellipse cx="12" cy="5" fill="currentColor" rx="4" ry="4">
                    <animate
                      id="svgSpinnersBouncingBall0"
                      fill="freeze"
                      attributeName="cy"
                      begin="0;svgSpinnersBouncingBall2.end"
                      calcMode="spline"
                      dur="0.375s"
                      keySplines=".33,0,.66,.33"
                      values="5;20"
                    />
                    <animate
                      attributeName="rx"
                      begin="svgSpinnersBouncingBall0.end"
                      calcMode="spline"
                      dur="0.05s"
                      keySplines=".33,0,.66,.33;.33,.66,.66,1"
                      values="4;4.8;4"
                    />
                    <animate
                      attributeName="ry"
                      begin="svgSpinnersBouncingBall0.end"
                      calcMode="spline"
                      dur="0.05s"
                      keySplines=".33,0,.66,.33;.33,.66,.66,1"
                      values="4;3;4"
                    />
                    <animate
                      id="svgSpinnersBouncingBall1"
                      attributeName="cy"
                      begin="svgSpinnersBouncingBall0.end"
                      calcMode="spline"
                      dur="0.025s"
                      keySplines=".33,0,.66,.33"
                      values="20;20.5"
                    />
                    <animate
                      id="svgSpinnersBouncingBall2"
                      attributeName="cy"
                      begin="svgSpinnersBouncingBall1.end"
                      calcMode="spline"
                      dur="0.4s"
                      keySplines=".33,.66,.66,1"
                      values="20.5;5"
                    />
                  </ellipse>
                </svg>
              </div> */}
            </div>
            <div className="space-y-3">
              <div className="bg-white/60 rounded-lg p-4 backdrop-blur">
                <div className="text-sm text-gray-500 mb-1">Player 1</div>
                <div className="text-lg font-semibold text-gray-800">
                  {matchData.team1Players[0]?.name || "Player 1"}
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-4 backdrop-blur">
                <div className="text-sm text-gray-500 mb-1">Player 2</div>
                <div className="text-lg font-semibold text-gray-800">
                  {matchData.team1Players[1]?.name || "Player 2"}
                </div>
              </div>
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl p-3 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-center text-xl font-bold text-red-800">
                Team 2
              </h2>
              {/* <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                Away
              </div> */}
            </div>
            <div className="space-y-3">
              <div className="bg-white/60 rounded-lg p-4 backdrop-blur">
                <div className="text-sm text-gray-500 mb-1">Player 1</div>
                <div className="text-lg font-semibold text-gray-800">
                  {matchData.team2Players[0]?.name || "Player 1"}
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-4 backdrop-blur">
                <div className="text-sm text-gray-500 mb-1">Player 2</div>
                <div className="text-lg font-semibold text-gray-800">
                  {matchData.team2Players[1]?.name || "Player 2"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Section */}
        {isLoading ? (
          <span className="text-2xl font-bold text-gray-500">
            Loading please wait...
          </span>
        ) : isStarted ? (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6 text-center border-b pb-2">
              Live Scoring
            </h2>

            <div className="bg-gray-900 text-white rounded-xl p-6 md:p-8 shadow-lg mb-6">
              <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                  <h3 className="font-medium text-gray-400 text-sm mb-1">
                    CURRENT SET
                  </h3>
                  <div className="text-xl font-bold bg-blue-900 px-4 py-2 rounded-lg inline-block">
                    {matchData.currentMatchState.score.currentSet + 1}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-gray-400 text-sm mb-2">
                    MATCH SCORE
                  </h3>
                  <div className="text-2xl font-bold flex justify-center gap-1">
                    {(matchData.isKnockout ? [0, 1, 2] : [0]).map(
                      (setIndex) => (
                        <div
                          key={setIndex}
                          className={`inline-block px-4 py-2 rounded ${
                            setIndex ===
                            matchData.currentMatchState.score.currentSet
                              ? "bg-blue-700"
                              : "bg-gray-800"
                          }`}
                        >
                          <span className="text-blue-300">
                            {
                              matchData.currentMatchState.score.sets[setIndex]
                                .team1Games
                            }
                          </span>
                          <span className="mx-1">-</span>
                          <span className="text-red-300">
                            {
                              matchData.currentMatchState.score.sets[setIndex]
                                .team2Games
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="text-center md:text-right mt-4 md:mt-0">
                  {/* <h3 className="font-medium text-gray-400 text-sm mb-1">
                    Matches
                  </h3>
                  <div className="text-xl font-bold bg-purple-900 px-4 py-2 rounded-lg inline-block capitalize">
                    1/6
                  </div> */}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Team 1 Score */}
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-medium text-blue-300">
                    Team 1
                  </h3>
                  <motion.div
                    className="mb-6 text-6xl font-bold text-white bg-gradient-to-br from-blue-700 to-blue-900 py-8 rounded-2xl shadow-2xl border-2 border-blue-600/30"
                    key={
                      matchData.currentMatchState.score.currentGame.team1Points
                    }
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {matchData.currentMatchState.score.currentGame.team1Points}
                  </motion.div>
                  {!matchData.currentMatchState.score.completed && (
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <button
                        className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                        onClick={() => updateGameScore("team1", true)}
                      >
                        <span className="text-2xl">+</span>
                        <span>Point</span>
                      </button>
                      {/*<button
                        className="bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-500/50 flex items-center justify-center gap-2"
                        onClick={() => updateGameScore("team1", false)}
                      >
                        <span className="text-2xl">-</span>
                        <span>Point</span>
                      </button> */}
                    </div>
                  )}
                </div>

                {/* Team 2 Score */}
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-medium text-red-300">
                    Team 2
                  </h3>
                  <motion.div
                    className="mb-6 text-6xl font-bold text-white bg-gradient-to-br from-red-700 to-red-900 py-8 rounded-2xl shadow-2xl border-2 border-red-600/30"
                    key={
                      matchData.currentMatchState.score.currentGame.team2Points
                    }
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {matchData.currentMatchState.score.currentGame.team2Points}
                  </motion.div>
                  {!matchData.currentMatchState.score.completed && (
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <button
                        className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
                        onClick={() => updateGameScore("team2", true)}
                      >
                        <span className="text-2xl">+</span>
                        <span>Point</span>
                      </button>
                      {/* <button
                        className="bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-500/50 flex items-center justify-center gap-2"
                        onClick={() => updateGameScore("team2", false)}
                      >
                        <span className="text-2xl">-</span>
                        <span>Point</span>
                      </button> */}
                    </div>
                  )}
                </div>
              </div>

              {!isResultSaved && (
                <div className="grid grid-cols-2 gap-8">
                  <button
                    className="mt-4 bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-500/50 flex items-center justify-center gap-2"
                    onClick={() =>
                      undoLastPoint(
                        queryParams.tournamentId,
                        queryParams.matchId
                      )
                    }
                  >
                    <Undo2 className="text-2xl" />
                    <span>Undo</span>
                  </button>

                  <button
                    className="mt-4 bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-500/50 flex items-center justify-center gap-2"
                    onClick={resetMatch}
                  >
                    <Trash className="text-2xl" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <> </>
          // <div className="mb-10">
          //   <div className="text-center mt-5 mb-6">
          //     <button
          //       className="text-xl font-bold bg-purple px-4 py-2 rounded-lg inline-block capitalize"
          //       onClick={startMatch}
          //     >
          //       Start Match
          //     </button>
          //   </div>
          // </div>
        )}

        {/* Match Complete Message */}
        {matchData.currentMatchState.score.completed && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center p-8 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg shadow-lg"
            >
              <div className="text-4xl mb-2">🏆 Match Complete!</div>
              <div className="text-2xl">
                Winner:{" "}
                {matchData.currentMatchState.score.winner === "team1"
                  ? "Team 1"
                  : "Team 2"}
              </div>
            </motion.div>
            {/* Save Button */}
            {!isResultSaved && (
              <div className="text-center mt-5 mb-6">
                <button
                  className="text-xl font-bold bg-purple px-4 py-2 rounded-lg inline-block capitalize"
                  onClick={saveMatch}
                >
                  Save Match Record
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MatchScoring;
