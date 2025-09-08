import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Trophy, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { ImageConstants } from "../assets/images/ImageConstants";
import io from "socket.io-client";
import Common from "../helper/common";
import { TournamentMatchPlayStatusEnum } from "../const/appConstant";
import moment from "moment-timezone";
import { TournamentRuleMatchFormatTypeEnum } from "../const/Constants";

const MatchScoreCard = () => {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const courtId = searchParams.get("courtId");

  // State management
  const [matchData, setMatchData] = useState(null);
  const [upcomingMatch, setUpcomingMatch] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayTime, setDisplayTime] = useState(moment().tz("Asia/Karachi"));
  const [liveMatchData, setLiveMatchData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showResetNotification, setShowResetNotification] = useState(false);

  const matchStatus = useRef();
  const socketRef = useRef(null);

  useEffect(() => {
    if (liveMatchData) {
      matchStatus.current = liveMatchData.status;
    }
  }, [liveMatchData]);

  // Tennis scoring constants
  const scoreStrings = ["0", "15", "30", "40", "AD"];

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

  const getMatchFormat = () => {
    var matchFormat = liveMatchData?.matchSettings?.matchFormat;
    switch (matchFormat) {
      case TournamentRuleMatchFormatTypeEnum.raceToSix:
        return "Race to 6";
      case TournamentRuleMatchFormatTypeEnum.twoSetsSuperTieBreak:
        return "2 Sets - Super Tie Break";
      case TournamentRuleMatchFormatTypeEnum.threeSets:
        return "3 Sets";
    }
  };

  // WebSocket data handling

  // Function to fetch court match schedule
  const fetchCourtMatchSchedule = async () => {
    if (matchStatus.current && matchStatus.current !== "completed") {
      return;
    }
    console.log("Fetching court match schedule");
    if (!tournamentId || !courtId) {
      setError("Tournament ID and Court ID are required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get current UTC time + 5 hours
      const currentDateTime = Common.Utility.GetCurrentDateTime(5);

      const response = await Common.ApiService.getInstance().request(
        `GetMasterTournamentMatchScheduleByCourt?masterTournamentId=${tournamentId}&courtId=${courtId}`
      );

      if (response?.data) {
        setUpcomingMatch(response.data.upcomingMatch);
        var currentMatch = response.data.currentMatch;
        setMatchData(currentMatch);

        // Always try to set up WebSocket connection for any current match
        if (currentMatch) {
          console.log("Setting up WebSocket for current match:", currentMatch);
          console.log(
            "Match ID:",
            currentMatch.id,
            "Type:",
            typeof currentMatch.id
          );
          console.log(
            "Tournament ID:",
            tournamentId,
            "Type:",
            typeof tournamentId
          );
          setupWebSocketConnection(currentMatch);
        } else {
          console.log("No current match found");
          setLiveMatchData(null);
        }

        setError(null);
      } else {
        setError("No match data found");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch match data");
    } finally {
      setLoading(false);
    }
  };

  // Function to setup WebSocket connection
  const setupWebSocketConnection = (currentMatch) => {
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Initialize socket connection
    const socket = io("https://ttwp.playpro.pk", {
      transports: ["websocket"],
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setError("Failed to connect to live match server");
      setIsConnected(false);
    });

    // Listen for match updates
    socket.on(`match_update_${currentMatch.id}`, (data) => {
      console.log("Match update received:", data);
      matchStatus.current = data.status;
      setLiveMatchData(data);
    });

    // Listen for reset events
    socket.on(`match_reset_${currentMatch.id}`, (data) => {
      console.log("Match reset received:", data);
      setLiveMatchData(data);
      setShowResetNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowResetNotification(false), 3000);
    });

    // Listen for tournament updates
    socket.on(`tournament_update_${tournamentId}`, (data) => {
      console.log("Tournament update received:", data);
    });

    // Request initial match state
    const matchStateRequest = {
      tournamentId: tournamentId.toString(),
      matchId: currentMatch.id.toString(),
    };
    console.log("Requesting match state with:", matchStateRequest);
    socket.emit("get_match_state", matchStateRequest);

    // Set a timeout to use API data if no response from server
    const fallbackTimeout = setTimeout(() => {
      console.log("Timeout waiting for match state, using API data");
      setLiveMatchData(currentMatch);
    }, 5000); // 5 second timeout

    // Handle match state response
    socket.on("get_match_state_response", (data) => {
      console.log("Match state response received:", data);
      clearTimeout(fallbackTimeout); // Clear timeout since we got a response

      if (data) {
        matchStatus.current = data.status;
        setLiveMatchData(data);
      } else {
        console.log("No match state from server, using API data as fallback");
        // Use API data as fallback when server doesn't have the match
        setLiveMatchData(currentMatch);
      }
    });
  };

  // Initial fetch and setup interval
  useEffect(() => {
    let intervalId;

    const setupDataFetching = async () => {
      await fetchCourtMatchSchedule();

      // Set up 10-minute interval for schedule updates
      intervalId = setInterval(async () => {
        await fetchCourtMatchSchedule();
      }, 30000); // 30 seconds
    };

    setupDataFetching();

    return () => {
      if (intervalId) clearInterval(intervalId);
      // Cleanup WebSocket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [tournamentId, courtId]);

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
  if (!liveMatchData && !matchData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl font-bold text-gray-600">
          No match data available
        </div>
      </div>
    );
  }

  // Get display data - use WebSocket data if available, otherwise use API data
  const displayMatch = liveMatchData || matchData;

  const getTeamName = (team) => {
    return team?.teamName || team?.name || "Team";
  };

  // Helper functions for JSON data binding
  const getNumberOfSets = () => {
    if (liveMatchData?.matchSettings?.numberOfSets) {
      return liveMatchData.matchSettings.numberOfSets;
    }
    return 3; // Default
  };

  const getSetScore = (teamIndex, setIndex) => {
    if (liveMatchData?.sets?.[setIndex.toString()]) {
      const teamKey = teamIndex === 1 ? "team1Games" : "team2Games";
      return liveMatchData.sets[setIndex.toString()][teamKey] || 0;
    }
    // Fallback to API data
    if (matchData?.results?.sets?.[setIndex]) {
      return matchData.results.sets[setIndex][`team${teamIndex}`] || "0";
    }
    return setIndex === 0 ? "0" : "-";
  };

  const getCurrentGameScore = (teamIndex) => {
    if (liveMatchData) {
      const teamKey = teamIndex === 1 ? "team1" : "team2";
      const score = liveMatchData[teamKey]?.score || 0;

      // Handle tiebreak scoring
      if (liveMatchData.isInTiebreak || liveMatchData.isInSuperTiebreak) {
        return liveMatchData[teamKey]?.tiebreakScore || 0;
      }

      // Convert to tennis scoring
      return scoreStrings[score] || "0";
    }

    // Fallback to API data
    if (matchData?.results?.currentGame) {
      return matchData.results.currentGame[`team${teamIndex}`] || "0";
    }
    return "0";
  };

  const getPlayerName = (teamIndex, playerIndex) => {
    if (liveMatchData) {
      const teamKey = teamIndex === 1 ? "team1" : "team2";
      const players = liveMatchData[teamKey]?.players || [];
      return players[playerIndex]?.name || "";
    }

    // Fallback to API data
    const team = teamIndex === 1 ? matchData?.teamA : matchData?.teamB;
    const players = team?.players || [];
    return players[playerIndex]?.name || players[playerIndex]?.playerName || "";
  };

  const isServingTeam = (teamIndex) => {
    if (!liveMatchData?.currentServe) return false;
    const isServingTeam1 = liveMatchData.currentServe.isServingTeam1;
    return teamIndex === 1 ? isServingTeam1 : !isServingTeam1;
  };

  const getServingPlayerName = () => {
    return liveMatchData?.currentServe?.servingPlayer || null;
  };

  const getTeamWarnings = (teamIndex) => {
    if (liveMatchData) {
      const teamKey = teamIndex === 1 ? "team1" : "team2";
      return liveMatchData[teamKey]?.warnings || [];
    }
    return [];
  };

  const getHeaderText = () => {
    if (liveMatchData?.isInSuperTiebreak) return "SUPER TIE BREAK";
    if (liveMatchData?.isInTiebreak) return "TIE BREAK";
    return "SCORE";
  };

  return (
    <>
      <div className="min-h-screen  from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        {/* Stars background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center space-x-2 bg-black/50 text-white px-3 py-1 rounded-lg">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-medium">
              {isConnected ? "Live" : "Network Error"}
            </span>
          </div>
        </div>

        {/* Reset Notification */}
        {showResetNotification && (
          <div className="absolute top-16 right-4 z-20 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold animate-pulse">
            🔄 Match has been reset by the scorer
          </div>
        )}

        {/* Main content */}
        <div className="relative z-10 flex  mt-[-30px] items-center justify-center min-h-screen">
          <div className="w-full  ">
            {/* Header with logos */}
            <div className="flex justify-between items-center">
              <div className="text-center">
                <img
                  width={200}
                  className="justify-self-end p-5"
                  src={ImageConstants.padelVersewhite}
                  alt="Playpro"
                />
              </div>

              <div className="text-center">
                <img
                  width={300}
                  className="justify-self-end p-5"
                  src={ImageConstants.padelVerse}
                  alt="Playpro"
                />
              </div>

              <div className="text-center">
                <img
                  width={280}
                  className="justify-self-end p-5"
                  src={ImageConstants.playproWhite}
                  alt="Playpro"
                />
              </div>
            </div>

            {/* Main scoreboard */}
            <div className="bg-white rounded-lg ml-[100px] mr-[100px] mt-0 mb-[60px] shadow-2xl overflow-hidden">
              {/* Header row - Dynamic based on number of sets */}
              <div className="bg-[#015d9c] text-white py-4">
                <div
                  className="grid gap-4 items-center"
                  style={{
                    gridTemplateColumns: `2fr ${Array(getNumberOfSets())
                      .fill("1fr")
                      .join(" ")} 1fr`,
                  }}
                >
                  <div className="text-center">
                    <h2 className="text-4xl font-bold">PLAYERS</h2>
                  </div>
                  {Array.from({ length: getNumberOfSets() }, (_, index) => (
                    <div key={index} className="text-center">
                      <h2 className="text-4xl font-bold">SET {index + 1}</h2>
                    </div>
                  ))}
                  <div className="text-center">
                    <h2 className="text-4xl font-bold">{getHeaderText()} </h2>
                  </div>
                </div>
              </div>

              {/* Score content - Dynamic layout */}
              <div className="p-0">
                <div
                  className="grid gap-4 items-center"
                  style={{
                    gridTemplateColumns: `2fr ${Array(getNumberOfSets())
                      .fill("1fr")
                      .join(" ")} 1fr`,
                  }}
                >
                  {/* Team Names and Players */}
                  <div className="py-8">
                    {/* Team 1 */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between  justify-center px-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="text-3xl  font-bold text-gray-800 mb-1">
                              {/* {teamNamesCatIds.some(id => id == matchData.tournamentId) ? getTeamName(matchData.teamA) : getPlayerName(1, 0) + " & " + getPlayerName(1, 1)} */}
                              {getTeamName(matchData.teamA)}
                              {/* {getPlayerName(1, 0)} & {getPlayerName(1, 1)} */}
                            </div>
                            {/* <div className="text-lg text-gray-600">
                              {getTeamName(matchData.teamA)}
                            </div> */}
                          </div>
                          {isServingTeam(1) && (
                            <div className="flex items-center text-blue-600">
                              <span className="text-xl">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="#00619a"
                                    d="M9.406 17.421q-.642 0-1.267-.242t-1.123-.74L2.983 12.4q-.498-.498-.74-1.11T2 10.017t.242-1.272t.74-1.11l2.691-2.69q.498-.499 1.116-.741t1.267-.242q.642 0 1.254.242q.611.242 1.11.74l4.038 4.033q.498.498.74 1.114q.243.615.243 1.275t-.243 1.272t-.74 1.11l-1.008 1.008l5.177 5.177q.146.146.156.347t-.156.366t-.357.166t-.356-.166l-5.158-5.196l-.989.989q-.498.498-1.109.74q-.61.242-1.252.242m-.02-.98q.453 0 .891-.176t.777-.515l2.696-2.715q.339-.333.515-.78q.175-.447.175-.894t-.175-.89t-.515-.78L9.712 5.658q-.333-.339-.766-.518q-.432-.178-.884-.178t-.885.179q-.433.178-.771.517l-2.69 2.69q-.339.339-.515.777t-.176.891t.176.896t.515.78l4.019 4.058q.332.339.765.515t.886.175m-3.868-5.379q.232 0 .387-.151q.155-.152.155-.384t-.152-.386t-.384-.155t-.386.151t-.155.384t.151.387t.384.155m1.523-1.518q.232 0 .387-.151q.155-.152.155-.384t-.152-.387t-.384-.155q-.231 0-.386.152t-.155.384t.152.387q.151.154.383.154m.156 3.216q.232 0 .387-.152t.155-.384t-.152-.396t-.384-.164t-.387.164q-.154.164-.154.396t.151.384t.384.152m1.342-4.74q.232 0 .387-.151t.155-.384t-.152-.387t-.384-.155t-.386.152t-.155.384t.152.386t.383.155m.181 3.221q.232 0 .387-.151q.154-.152.154-.384t-.151-.387t-.384-.154t-.387.151t-.155.384t.152.387t.384.154m.15 3.197q.232 0 .396-.152q.165-.152.165-.384t-.165-.387t-.396-.154t-.384.151t-.152.384t.152.387q.152.155.384.155m1.367-4.72q.232 0 .387-.164t.155-.396t-.152-.384t-.384-.152t-.386.152t-.155.384t.151.396t.384.164m.156 3.197q.232 0 .387-.152t.154-.384t-.151-.387t-.384-.154t-.387.151t-.154.384t.151.387t.384.155m1.504-1.524q.232 0 .396-.151q.165-.152.165-.384t-.165-.387t-.396-.155t-.384.152t-.151.384t.151.387t.384.154M19.13 8.77q-1.197 0-2.029-.846q-.833-.846-.833-2.042t.833-2.039T19.131 3t2.043.846t.845 2.042t-.845 2.039t-2.043.842m.005-1q.778 0 1.33-.548q.553-.549.553-1.332t-.548-1.336T19.139 4t-1.326.548q-.544.549-.544 1.332q0 .784.545 1.336q.544.553 1.322.553m.018-1.884"
                                  />
                                </svg>
                              </span>
                              {/* <span className="ml-1 text-sm font-medium">
                                {getServingPlayerName()}
                              </span> */}
                            </div>
                          )}
                        </div>
                        {/* Warning cards for Team 1 */}
                        <div className="flex space-x-1">
                          {getTeamWarnings(1).map((warning, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs font-bold rounded ${
                                warning === "W1"
                                  ? "bg-yellow-400 text-black"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {warning}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* VS Divider */}
                    <div className="text-center text-2xl font-bold  mb-8">
                      VS
                    </div>

                    {/* Team 2 */}
                    <div>
                      <div className="flex items-center justify-between justify-center px-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="text-3xl font-bold text-gray-800 mb-1">
                              {/* {teamNamesCatIds.some(id => id == matchData.tournamentId) ? getTeamName(matchData.teamB) : getPlayerName(2, 0) + " & " + getPlayerName(2, 1)} */}
                              {getTeamName(matchData.teamB)}
                              {/* {getTeamName(matchData.teamB)} */}
                            </div>
                            {/* <div className="text-lg text-gray-600">
                              {getTeamName(matchData.teamB)}
                            </div> */}
                          </div>
                          {isServingTeam(2) && (
                            <div className="flex items-center ">
                              <span className="text-2xl">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="#00619a"
                                    d="M9.406 17.421q-.642 0-1.267-.242t-1.123-.74L2.983 12.4q-.498-.498-.74-1.11T2 10.017t.242-1.272t.74-1.11l2.691-2.69q.498-.499 1.116-.741t1.267-.242q.642 0 1.254.242q.611.242 1.11.74l4.038 4.033q.498.498.74 1.114q.243.615.243 1.275t-.243 1.272t-.74 1.11l-1.008 1.008l5.177 5.177q.146.146.156.347t-.156.366t-.357.166t-.356-.166l-5.158-5.196l-.989.989q-.498.498-1.109.74q-.61.242-1.252.242m-.02-.98q.453 0 .891-.176t.777-.515l2.696-2.715q.339-.333.515-.78q.175-.447.175-.894t-.175-.89t-.515-.78L9.712 5.658q-.333-.339-.766-.518q-.432-.178-.884-.178t-.885.179q-.433.178-.771.517l-2.69 2.69q-.339.339-.515.777t-.176.891t.176.896t.515.78l4.019 4.058q.332.339.765.515t.886.175m-3.868-5.379q.232 0 .387-.151q.155-.152.155-.384t-.152-.386t-.384-.155t-.386.151t-.155.384t.151.387t.384.155m1.523-1.518q.232 0 .387-.151q.155-.152.155-.384t-.152-.387t-.384-.155q-.231 0-.386.152t-.155.384t.152.387q.151.154.383.154m.156 3.216q.232 0 .387-.152t.155-.384t-.152-.396t-.384-.164t-.387.164q-.154.164-.154.396t.151.384t.384.152m1.342-4.74q.232 0 .387-.151t.155-.384t-.152-.387t-.384-.155t-.386.152t-.155.384t.152.386t.383.155m.181 3.221q.232 0 .387-.151q.154-.152.154-.384t-.151-.387t-.384-.154t-.387.151t-.155.384t.152.387t.384.154m.15 3.197q.232 0 .396-.152q.165-.152.165-.384t-.165-.387t-.396-.154t-.384.151t-.152.384t.152.387q.152.155.384.155m1.367-4.72q.232 0 .387-.164t.155-.396t-.152-.384t-.384-.152t-.386.152t-.155.384t.151.396t.384.164m.156 3.197q.232 0 .387-.152t.154-.384t-.151-.387t-.384-.154t-.387.151t-.154.384t.151.387t.384.155m1.504-1.524q.232 0 .396-.151q.165-.152.165-.384t-.165-.387t-.396-.155t-.384.152t-.151.384t.151.387t.384.154M19.13 8.77q-1.197 0-2.029-.846q-.833-.846-.833-2.042t.833-2.039T19.131 3t2.043.846t.845 2.042t-.845 2.039t-2.043.842m.005-1q.778 0 1.33-.548q.553-.549.553-1.332t-.548-1.336T19.139 4t-1.326.548q-.544.549-.544 1.332q0 .784.545 1.336q.544.553 1.322.553m.018-1.884"
                                  />
                                </svg>
                              </span>
                              {/* <span className="ml-1 text-sm font-medium">
                                {getServingPlayerName()}
                              </span> */}
                            </div>
                          )}
                        </div>
                        {/* Warning cards for Team 2 */}
                        <div className="flex space-x-1">
                          {getTeamWarnings(2).map((warning, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs font-bold rounded ${
                                warning === "W1"
                                  ? "bg-yellow-400 text-black"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {warning}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Set Scores */}
                  {Array.from({ length: getNumberOfSets() }, (_, setIndex) => (
                    <div key={setIndex} className="text-center">
                      <div className="space-y-8">
                        <div className="text-6xl font-bold set-score-style">
                          {getSetScore(1, setIndex)}
                        </div>
                        <div className="text-6xl font-bold set-score-style">
                          {getSetScore(2, setIndex)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current Game/Points Score */}
                  <div className="text-center bg-[#015d9c]">
                    <div className="space-y-4 pt-[25px] pb-[25px]">
                      <div className="text-8xl font-bold text-white game-score-style">
                        {getCurrentGameScore(1)}
                      </div>
                      <div className="text-8xl font-bold text-white game-score-style">
                        {getCurrentGameScore(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom indicator and Upcoming Match */}
            <div className="grid grid-cols-3 gap-4 items-center mt-[-10px]">
              <div className="bg-[#015d9c] ml-5 text-white w-min px-[50px] whitespace-nowrap py-1 rounded-lg font-bold text-3xl">
                {liveMatchData && liveMatchData.status === "ongoing"
                  ? getMatchFormat()
                  : liveMatchData && liveMatchData.status === "completed"
                  ? "COMPLETED"
                  : displayMatch?.playStatus ===
                    TournamentMatchPlayStatusEnum.In_Progress
                  ? "LIVE"
                  : displayMatch?.playStatus ===
                    TournamentMatchPlayStatusEnum.Completed
                  ? "COMPLETED"
                  : "SCHEDULED"}
              </div>
              <div className="font-bold text-3xl text-center text-white">
                {matchData.court?.name || "LIVE SCOREBOARD"}
              </div>
              <div className="bg-[#015d9c] mr-5 ml-auto text-white w-min px-[20px] whitespace-nowrap py-1 rounded-lg font-bold text-1xl">
                {upcomingMatch && (
                  <div>
                    UPCOMING: {getTeamName(upcomingMatch.teamA)} VS{" "}
                    {getTeamName(upcomingMatch.teamB)}
                  </div>
                )}
              </div>
              {/* {upcomingMatch && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-white">
                  <div className="text-lg font-bold mb-2">UPCOMING</div>
                  <div className="text-sm">
                    {getTeamName(upcomingMatch.teamA)}
                  </div>
                  <div className="text-xs">vs</div>
                  <div className="text-sm">
                    {getTeamName(upcomingMatch.teamB)}
                  </div>
                  <div className="text-xs mt-1">
                    {moment(upcomingMatch.matchStartDateTime).format("HH:mm")}
                  </div>
                </div>
              )} */}
            </div>
          </div>

          {/* Live indicator */}
          {/* {displayMatch.playStatus ===
            TournamentMatchPlayStatusEnum.In_Progress && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-bold animate-pulse">
              ● LIVE
            </div>
          )} */}
        </div>

        <style jsx>{`
          @keyframes twinkle {
            0%,
            100% {
              opacity: 0.3;
            }
            50% {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default MatchScoreCard;
