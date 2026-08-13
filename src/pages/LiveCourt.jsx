import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Trophy, Clock } from "lucide-react";
import {
  formatElapsedTime,
  computeElapsedSeconds,
} from "../umpireScoring/utils/matchTimerUtils.js";
import { motion } from "framer-motion";
import io from "socket.io-client";
import Common from "../helper/common";
import { TournamentMatchPlayStatusEnum } from "../const/appConstant";
import moment from "moment-timezone";
import { TournamentRuleMatchFormatTypeEnum } from "../const/Constants";
import MatchIdHelper from "../umpireScoring/utils/matchIdHelper.js";
import { getScoreDisplayString } from "../umpireScoring/utils/scoringRules.js";
import Header from "../components/layout/header";
import matchDataTransformer from "../umpireScoring/helpers/matchDataTransformer";
import AnimatedScore from "../components/AnimatedScore";
import { SERVER_URL } from "../umpireScoring/utils/constants.js";
import { useDisplaySettings } from "../hooks/useDisplaySettings";
const MatchScoreCard = () => {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const courtId = searchParams.get("courtId");
  const displayId =
    searchParams.get("displayId") ?? (courtId ? `court-${courtId}` : null);
  const { mapStageType } = matchDataTransformer;

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
  const [timerDisplay, setTimerDisplay] = useState("00:00");

  // Subscribe to DisplayMaster settings (WebSocket + localStorage)
  useDisplaySettings({ displayId, listenOnly: true });

  // Match timer display - syncs from liveMatchData.matchTimer (WebSocket)
  useEffect(() => {
    const matchTimer = liveMatchData?.matchTimer;
    if (!matchTimer) {
      setTimerDisplay("00:00");
      return;
    }
    const updateDisplay = () => {
      setTimerDisplay(formatElapsedTime(computeElapsedSeconds(matchTimer)));
    };
    updateDisplay();
    if (matchTimer?.status === "running") {
      const interval = setInterval(updateDisplay, 1000);
      return () => clearInterval(interval);
    }
  }, [liveMatchData?.matchTimer, liveMatchData?.matchTimer?.status]);

  useEffect(() => {
    if (liveMatchData) {
      matchStatus.current = liveMatchData.status;
    }
  }, [liveMatchData]);

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
        return `Race to ${liveMatchData?.matchSettings?.numberOfGames}`;
      case TournamentRuleMatchFormatTypeEnum.twoSetsSuperTieBreak:
        return "2 Sets - Super Tie Break";
      case TournamentRuleMatchFormatTypeEnum.threeSets:
        return "3 Sets";
      default:
        return "Happening Now";
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
        `GetMasterTournamentMatchScheduleByCourt?masterTournamentId=${tournamentId}&courtId=${courtId}`,
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
            typeof currentMatch.id,
          );
          console.log(
            "Tournament ID:",
            tournamentId,
            "Type:",
            typeof tournamentId,
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
    const socket = io(SERVER_URL, {
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

    // Prefix match and tournament IDs for environment separation
    const prefixedMatchId = MatchIdHelper.prefixMatchId(currentMatch.id);
    const prefixedTournamentId = MatchIdHelper.prefixTournamentId(tournamentId);

    // Listen for match updates
    socket.on(`match_update_${prefixedMatchId}`, (data) => {
      console.log("Match update received:", data);
      // Filter by environment - ignore matches from other environments
      if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
        console.log("Ignoring match update from different environment");
        return; // Ignore matches from other environment
      }
      matchStatus.current = data.status;
      setLiveMatchData(data);
    });

    // Listen for reset events
    socket.on(`match_reset_${prefixedMatchId}`, (data) => {
      console.log("Match reset received:", data);
      // Filter by environment - ignore matches from other environments
      if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
        console.log("Ignoring match reset from different environment");
        return; // Ignore matches from other environment
      }
      setLiveMatchData(data);
      setShowResetNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowResetNotification(false), 3000);
    });

    // Listen for tournament updates
    socket.on(`tournament_update_${prefixedTournamentId}`, (data) => {
      console.log("Tournament update received:", data);
      // Filter by environment - ignore tournaments from other environments
      if (
        data.tournamentId &&
        !MatchIdHelper.isMatchForCurrentEnv(data.tournamentId)
      ) {
        console.log("Ignoring tournament update from different environment");
        return; // Ignore tournaments from other environment
      }
    });

    // Request initial match state
    const matchStateRequest = {
      tournamentId: prefixedTournamentId,
      matchId: prefixedMatchId,
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
        // Filter by environment - ignore matches from other environments
        if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
          console.log(
            "Ignoring match state response from different environment",
          );
          // Use API data as fallback when response is from different environment
          setLiveMatchData(currentMatch);
          return;
        }
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
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-4xl font-bold text-[#c5f934]">
  //         Loading match data...
  //       </div>
  //     </div>
  //   );
  // }

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
        {/* <div className="text-4xl font-bold text-gray-600">
          No match data available
        </div> */}
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
    // For 2-sets + super tiebreak, show 3 set columns (SET 1, SET 2, STB)
    if (liveMatchData?.matchSettings?.matchFormat === 2) {
      return 3;
    }
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
      const opponentKey = teamIndex === 1 ? "team2" : "team1";
      const teamScore = liveMatchData[teamKey]?.score || 0;
      const opponentScore = liveMatchData[opponentKey]?.score || 0;
      const isInTiebreak =
        liveMatchData.isInTiebreak || liveMatchData.isInSuperTiebreak;

      // Handle tiebreak scoring
      if (isInTiebreak) {
        return liveMatchData[teamKey]?.tiebreakScore || 0;
      }

      // Calculate total advantage exchanges for golden point display
      const totalAdvantageExchanges =
        (liveMatchData.team1?.advantageCount || 0) +
        (liveMatchData.team2?.advantageCount || 0);

      // Use getScoreDisplayString for consistent scoring display
      return getScoreDisplayString(teamScore, opponentScore, {
        isInTiebreak: false,
        matchSettings: liveMatchData.matchSettings,
        teamAdvantageCount: liveMatchData[teamKey]?.advantageCount || 0,
        totalAdvantageExchanges,
      });
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
      {/* <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)] relative overflow-hidden"> */}
      <div className="min-h-screen relative overflow-hidden">
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

        {/* Connection Status and Match Timer */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
          {liveMatchData?.matchTimer &&
            (liveMatchData.matchTimer.status === "running" ||
              liveMatchData.matchTimer.status === "paused" ||
              (liveMatchData.matchTimer.status === "stopped" &&
                (liveMatchData.matchTimer.elapsedSeconds || 0) > 0)) && (
              <div className="flex items-center space-x-2 bg-black/50 text-white px-4 py-2 rounded-lg font-mono text-xl">
                <Clock className="w-5 h-5" />
                <span className="font-bold">{timerDisplay}</span>
              </div>
            )}
          <div className="flex items-center space-x-2 bg-black/50 text-white px-3 py-1 rounded-lg">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-[var(--color-accent)]" : "bg-red-500"
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
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full  ">
            {/* Header with logos */}
            {/* <div className="flex justify-between items-center">
              <div className="text-center" style={{ width: "400px" }}>
                <img
                  width={400}
                  className="justify-self-start p-5"
                  src={ImageConstants.leftLogo}
                  alt="Greenwich Padel"
                />
              </div>

              <div className="text-center">
                <img
                  width={220}
                  className="justify-self-end p-5"
                  src={ImageConstants.cupLogo}
                  alt="Greenwich Padel"
                />
              </div>

              <div className="text-center" style={{ width: "400px" }}>
                <img
                  width={300}
                  className="justify-self-end p-5"
                  src={ImageConstants.rightLogo}
                  alt="Playpro"
                />
              </div>
            </div> */}
            <Header />
            {/* Main scoreboard */}
            <div
              className="bg-white rounded-lg mb-[60px] shadow-2xl overflow-hidden"
              style={{
                marginLeft: "var(--display-margin-h)",
                marginRight: "var(--display-margin-h)",
                marginTop: "var(--display-margin-top)",
              }}
            >
              {/* Header row - Dynamic based on number of sets */}
              <div className="text-[var(--color-accent-text)] py-4 bg-[var(--color-accent)]">
                <div
                  className="grid gap-4 items-center"
                  style={{
                    gridTemplateColumns: `4fr ${Array(getNumberOfSets())
                      .fill("1fr")
                      .join(" ")} 1fr`,
                  }}
                >
                  <div className="text-center">
                    <h2
                      className="font-bold text-[var(--color-accent-text)]"
                      style={{ fontSize: "var(--font-3xl)" }}
                    >
                      PLAYERS
                    </h2>
                  </div>
                  {Array.from({ length: getNumberOfSets() }, (_, index) => (
                    <div key={index} className="text-center">
                      <h2
                        className="font-bold text-[var(--color-accent-text)]"
                        style={{ fontSize: "var(--font-3xl)" }}
                      >
                        {liveMatchData?.matchSettings?.matchFormat === 2 &&
                        index === 2 &&
                        liveMatchData?.status === "completed"
                          ? "STB"
                          : `SET ${index + 1}`}
                      </h2>
                    </div>
                  ))}
                  <div className="text-center">
                    <h2
                      className="font-bold text-[var(--color-accent-text)]"
                      style={{ fontSize: "var(--font-3xl)" }}
                    >
                      {getHeaderText()}{" "}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Score content - Dynamic layout */}
              <div className="p-0">
                <div
                  className="grid gap-4 items-center"
                  style={{
                    gridTemplateColumns: `4fr ${Array(getNumberOfSets())
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
                            <div
                              className="font-bold text-gray-800 mb-1"
                              style={{
                                fontSize: "var(--display-player-name-size)",
                              }}
                            >
                              {/* {teamNamesCatIds.some(id => id == matchData.tournamentId) ? getTeamName(matchData.teamA) : getPlayerName(1, 0) + " & " + getPlayerName(1, 1)} */}
                              {getTeamName(matchData.teamA)}
                              {/* {getPlayerName(1, 0)} & {getPlayerName(1, 1)} */}
                            </div>
                            {/* <div className="text-lg text-gray-600">
                              {getTeamName(matchData.teamA)}
                            </div> */}
                          </div>
                          {isServingTeam(1) && (
                            <div className="flex items-center text-[var(--color-accent)]">
                              <span className="text-xl bg-[#2c2c2c] rounded-full p-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="34"
                                  height="34"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="#fff"
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
                                  : "bg-red-500 text-black"
                              }`}
                            >
                              {warning}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* VS Divider */}
                    <div className="text-center text-4xl text-black font-bold  mb-8">
                      VS
                    </div>

                    {/* Team 2 */}
                    <div>
                      <div className="flex items-center justify-between justify-center px-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div
                              className="font-bold text-gray-800 mb-1"
                              style={{
                                fontSize: "var(--display-player-name-size)",
                              }}
                            >
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
                              <span className="text-xl bg-[#2c2c2c] rounded-full p-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="34"
                                  height="34"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="#fff"
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
                                  : "bg-red-500 text-black"
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
                      <div className="space-y-8 text-black">
                        <div className="font-bold set-score-style">
                          <AnimatedScore
                            score={getSetScore(1, setIndex)}
                            isGameScore={false}
                            textColor="text-black"
                          />
                        </div>
                        <div className="font-bold set-score-style">
                          <AnimatedScore
                            score={getSetScore(2, setIndex)}
                            isGameScore={false}
                            textColor="text-black"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current Game/Points Score */}
                  <div className="text-center bg-[var(--color-accent)]">
                    <div className="space-y-4 pt-[25px] pb-[25px]">
                      <div
                        className="font-bold text-white"
                        style={{ fontSize: "var(--font-game-score-lg)" }}
                      >
                        <AnimatedScore
                          score={getCurrentGameScore(1)}
                          isGameScore={true}
                          textColor="text-white"
                        />
                      </div>
                      <div
                        className="font-bold text-white"
                        style={{ fontSize: "var(--font-game-score-lg)" }}
                      >
                        <AnimatedScore
                          score={getCurrentGameScore(2)}
                          isGameScore={true}
                          textColor="text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
      {/* Bottom indicator and Upcoming Match */}
      <div
        className="grid grid-cols-12 gap-4 items-center mt-[80px] mb-[20px]"
        style={{
          marginLeft: "var(--display-margin-h)",
          marginRight: "var(--display-margin-h)",
        }}
      >
        <div
          className="bg-[var(--color-accent)] col-span-4 text-[var(--color-accent-text)] w-min px-[50px] whitespace-nowrap py-3 rounded-lg font-bold"
          style={{ fontSize: "var(--display-court-name-size)" }}
        >
          {/*   {matchStatus.current == "completed" ? "COMPLETED" : "Live"} */}
          {matchStatus.current == "completed" ? "COMPLETED" : getMatchFormat()}
        </div>
        <div
          className="bg-[var(--color-accent)] m-auto col-span-4 text-[var(--color-accent-text)] w-min px-[50px] whitespace-nowrap py-3 rounded-lg font-bold"
          style={{ fontSize: "var(--display-court-name-size)" }}
        >
          {/* {matchData.court?.name || "LIVE SCOREBOARD"}{" "} */}
          {/* <p className="text">Men B (Group Stage) </p> */}
          {/* <p className="text">{mapStageType(matchData.stageType)} </p> */}
          <p className="text">
            {mapStageType(matchData.stageType)} -{" "}
            {matchData.tournamentName || "LIVE SCOREBOARD"}{" "}
          </p>
        </div>
        <div
          className="bg-[var(--color-accent)] col-span-4 ml-auto text-[var(--color-accent-text)] px-[20px] py-3 rounded-lg font-bold"
          style={{ fontSize: "var(--display-court-name-size)" }}
        >
          {matchData.court?.name || "LIVE SCOREBOARD"}{" "}
          {/* {upcomingMatch ? (
                  <div>
                    UPCOMING: {getTeamName(upcomingMatch.teamA)} VS{" "}
                    {getTeamName(upcomingMatch.teamB)}
                  </div>
                ) : (
                  <div>UPCOMING</div>
                )} */}
        </div>
      </div>
    </>
  );
};

export default MatchScoreCard;
