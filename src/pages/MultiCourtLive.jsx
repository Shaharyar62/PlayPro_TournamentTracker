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
import MatchIdHelper from "../umpireScoring/utils/matchIdHelper.js";
import { getScoreDisplayString } from "../umpireScoring/utils/scoringRules.js";
import Header from "../components/layout/header";
import AnimatedScore from "../components/AnimatedScore";

// Single Court Component
const SingleCourtDisplay = ({ tournamentId, courtId, isMultiView }) => {
  const [matchData, setMatchData] = useState(null);
  const [upcomingMatch, setUpcomingMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const getMatchFormat = () => {
    var matchFormat = liveMatchData?.matchSettings?.matchFormat;
    switch (matchFormat) {
      case TournamentRuleMatchFormatTypeEnum.raceToSix:
        return "Race to 8";
      case TournamentRuleMatchFormatTypeEnum.twoSetsSuperTieBreak:
        return "2 Sets - Super Tie Break";
      case TournamentRuleMatchFormatTypeEnum.threeSets:
        return "3 Sets";
      default:
        return "Happening Now";
    }
  };

  const fetchCourtMatchSchedule = async () => {
    if (matchStatus.current && matchStatus.current !== "completed") {
      return;
    }
    console.log(`Fetching court match schedule for court ${courtId}`);
    if (!tournamentId || !courtId) {
      setError("Tournament ID and Court ID are required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const currentDateTime = Common.Utility.GetCurrentDateTime(5);

      const response = await Common.ApiService.getInstance().request(
        `GetMasterTournamentMatchScheduleByCourt?masterTournamentId=${tournamentId}&courtId=${courtId}`
      );

      if (response?.data) {
        setUpcomingMatch(response.data.upcomingMatch);
        var currentMatch = response.data.currentMatch;
        setMatchData(currentMatch);

        if (currentMatch) {
          console.log(
            `Setting up WebSocket for current match on court ${courtId}:`,
            currentMatch
          );
          setupWebSocketConnection(currentMatch);
        } else {
          console.log(`No current match found for court ${courtId}`);
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

  const setupWebSocketConnection = (currentMatch) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("https://ttwp.playpro.pk", {
      transports: ["websocket"],
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`Connected to WebSocket server for court ${courtId}`);
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log(`Disconnected from WebSocket server for court ${courtId}`);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error(`WebSocket connection error for court ${courtId}:`, error);
      setError("Failed to connect to live match server");
      setIsConnected(false);
    });

    const prefixedMatchId = MatchIdHelper.prefixMatchId(currentMatch.id);
    const prefixedTournamentId = MatchIdHelper.prefixTournamentId(tournamentId);

    socket.on(`match_update_${prefixedMatchId}`, (data) => {
      console.log(`Match update received for court ${courtId}:`, data);
      if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
        console.log("Ignoring match update from different environment");
        return;
      }
      matchStatus.current = data.status;
      setLiveMatchData(data);
    });

    socket.on(`match_reset_${prefixedMatchId}`, (data) => {
      console.log(`Match reset received for court ${courtId}:`, data);
      if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
        console.log("Ignoring match reset from different environment");
        return;
      }
      setLiveMatchData(data);
      setShowResetNotification(true);
      setTimeout(() => setShowResetNotification(false), 3000);
    });

    socket.on(`tournament_update_${prefixedTournamentId}`, (data) => {
      console.log(`Tournament update received for court ${courtId}:`, data);
      if (
        data.tournamentId &&
        !MatchIdHelper.isMatchForCurrentEnv(data.tournamentId)
      ) {
        console.log("Ignoring tournament update from different environment");
        return;
      }
    });

    const matchStateRequest = {
      tournamentId: prefixedTournamentId,
      matchId: prefixedMatchId,
    };
    console.log(
      `Requesting match state for court ${courtId} with:`,
      matchStateRequest
    );
    socket.emit("get_match_state", matchStateRequest);

    const fallbackTimeout = setTimeout(() => {
      console.log(
        `Timeout waiting for match state for court ${courtId}, using API data`
      );
      setLiveMatchData(currentMatch);
    }, 5000);

    socket.on("get_match_state_response", (data) => {
      console.log(`Match state response received for court ${courtId}:`, data);
      clearTimeout(fallbackTimeout);

      if (data) {
        if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
          console.log(
            "Ignoring match state response from different environment"
          );
          setLiveMatchData(currentMatch);
          return;
        }
        matchStatus.current = data.status;
        setLiveMatchData(data);
      } else {
        console.log(
          `No match state from server for court ${courtId}, using API data as fallback`
        );
        setLiveMatchData(currentMatch);
      }
    });
  };

  useEffect(() => {
    let intervalId;

    const setupDataFetching = async () => {
      await fetchCourtMatchSchedule();

      intervalId = setInterval(async () => {
        await fetchCourtMatchSchedule();
      }, 30000);
    };

    setupDataFetching();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [tournamentId, courtId]);

  const getTeamName = (team) => {
    return team?.teamName || team?.name || "Team";
  };

  const getNumberOfSets = () => {
    if (liveMatchData?.matchSettings?.numberOfSets) {
      return liveMatchData.matchSettings.numberOfSets;
    }
    return 3;
  };

  const getSetScore = (teamIndex, setIndex) => {
    if (liveMatchData?.sets?.[setIndex.toString()]) {
      const teamKey = teamIndex === 1 ? "team1Games" : "team2Games";
      return liveMatchData.sets[setIndex.toString()][teamKey] || 0;
    }
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

    if (matchData?.results?.currentGame) {
      return matchData.results.currentGame[`team${teamIndex}`] || "0";
    }
    return "0";
  };

  const isServingTeam = (teamIndex) => {
    if (!liveMatchData?.currentServe) return false;
    const isServingTeam1 = liveMatchData.currentServe.isServingTeam1;
    return teamIndex === 1 ? isServingTeam1 : !isServingTeam1;
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

  if (loading) {
    return (
     <></>
      // <div className="flex items-center justify-center h-full">
      //   <div
      //     className={`${
      //       isMultiView ? "text-xl" : "text-4xl"
      //     } font-bold text-white`}
      //   >
      //     Loading...
      //   </div>
      // </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className={`${
            isMultiView ? "text-lg" : "text-2xl"
          } font-bold text-red-400`}
        >
          Error: {error}
        </div>
      </div>
    );
  }

  if (!liveMatchData && !matchData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className={`${
            isMultiView ? "text-lg" : "text-2xl"
          } font-bold text-gray-400`}
        >
          No match data available
        </div>
      </div>
    );
  }

  const displayMatch = liveMatchData || matchData;

  // Scale factors based on multi-view
  const scale = isMultiView ? 0.5 : 1;
  const textScale = isMultiView ? "text-xl" : "text-4xl";
  const textScaleLarge = isMultiView ? "text-2xl" : "text-6xl";
  const textScaleXL = isMultiView ? "text-3xl" : "text-8xl";
  const paddingScale = isMultiView ? "py-2" : "py-4";
  const marginScale = isMultiView ? "mb-2" : "mb-8";

  return (
    <div className="h-full w-full flex flex-col">
      <style jsx>{`
        .text-xl {
    color: white;}
    .game-score-style{
    color: white!important;}
          .font-bold.text-sm.text-white {
          
    font-size: 40px;
}
    .text-3xl.font-bold.text-gray-800.mb-1 {
    font-size: 40px;
}
    .set-score-style {
    border-left: solid 1px;
    font-size: 110px !important;
    line-height: 60px;
}
    .game-score-style {
    font-size: 110px !important;
    line-height: 100px;
}
          .set-score-style

 
 {
          
    border-left: solid 0px;
    font-size: 40px;
    line-height: 60px;
      `}</style>
      {/* Connection Status */}
      {!isMultiView && (
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center space-x-2 bg-black/50 text-white px-3 py-1 rounded-lg">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-[#A8CE08]" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-medium">
              {isConnected ? "Live" : "Network Error"}
            </span>
          </div>
        </div>
      )}

      {/* Reset Notification */}
      {showResetNotification && (
        <div
          className={`absolute ${
            isMultiView ? "top-2 right-2" : "top-16 right-4"
          } z-20 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold animate-pulse`}
        >
          🔄 Match has been reset by the scorer
        </div>
      )}

      {/* Main scoreboard */}
      <div
        className={`bg-white rounded-lg shadow-2xl overflow-hidden ${
          isMultiView ? "m-2" : "ml-[100px] mr-[100px]"
        }`}
      >
        {/* Header row */}
        <div className={`bg-[#A8CE08] text-black ${paddingScale}`}>
          <div
            className="grid gap-2 items-center"
            style={{
              gridTemplateColumns: `4fr ${Array(getNumberOfSets())
                .fill("1fr")
                .join(" ")} 1fr`,
            }}
          >
            <div className="text-center">
              <h2 className={`${textScale} font-bold`}>PLAYERS</h2>
            </div>
            {Array.from({ length: getNumberOfSets() }, (_, index) => (
              <div key={index} className="text-center">
                <h2 className={`${textScale} font-bold`}>SET {index + 1}</h2>
              </div>
            ))}
            <div className="text-center">
              <h2 className={`${textScale} font-bold`}>{getHeaderText()}</h2>
            </div>
          </div>
        </div>

        {/* Score content */}
        <div className="p-0">
          <div
            className="grid gap-2 items-center"
            style={{
              gridTemplateColumns: `4fr ${Array(getNumberOfSets())
                .fill("1fr")
                .join(" ")} 1fr`,
            }}
          >
            {/* Team Names and Players */}
            <div className={`${isMultiView ? "py-2" : "py-8"}`}>
              {/* Team 1 */}
              <div className={marginScale}>
                <div className="flex items-center justify-between justify-center px-0">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div
                        className={`${
                          isMultiView ? "text-3xl" : "text-3xl"
                        } font-bold text-gray-800 mb-1`}
                      >
                        {getTeamName(matchData.teamA)}
                      </div>
                    </div>
                    {isServingTeam(1) && (
                      <div className="flex items-center text-[#A8CE08] bg-[#A8CE08] rounded-full text-black p-1">
                        <span className={isMultiView ? "text-sm" : "text-xl"}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={isMultiView ? "25" : "24"}
                            height={isMultiView ? "25" : "24"}
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="#ffffff"
                              d="M9.406 17.421q-.642 0-1.267-.242t-1.123-.74L2.983 12.4q-.498-.498-.74-1.11T2 10.017t.242-1.272t.74-1.11l2.691-2.69q.498-.499 1.116-.741t1.267-.242q.642 0 1.254.242q.611.242 1.11.74l4.038 4.033q.498.498.74 1.114q.243.615.243 1.275t-.243 1.272t-.74 1.11l-1.008 1.008l5.177 5.177q.146.146.156.347t-.156.366t-.357.166t-.356-.166l-5.158-5.196l-.989.989q-.498.498-1.109.74q-.61.242-1.252.242m-.02-.98q.453 0 .891-.176t.777-.515l2.696-2.715q.339-.333.515-.78q.175-.447.175-.894t-.175-.89t-.515-.78L9.712 5.658q-.333-.339-.766-.518q-.432-.178-.884-.178t-.885.179q-.433.178-.771.517l-2.69 2.69q-.339.339-.515.777t-.176.891t.176.896t.515.78l4.019 4.058q.332.339.765.515t.886.175m-3.868-5.379q.232 0 .387-.151q.155-.152.155-.384t-.152-.386t-.384-.155t-.386.151t-.155.384t.151.387t.384.155m1.523-1.518q.232 0 .387-.151q.155-.152.155-.384t-.152-.387t-.384-.155q-.231 0-.386.152t-.155.384t.152.387q.151.154.383.154m.156 3.216q.232 0 .387-.152t.155-.384t-.152-.396t-.384-.164t-.387.164q-.154.164-.154.396t.151.384t.384.152m1.342-4.74q.232 0 .387-.151t.155-.384t-.152-.387t-.384-.155t-.386.152t-.155.384t.152.386t.383.155m.181 3.221q.232 0 .387-.151q.154-.152.154-.384t-.151-.387t-.384-.154t-.387.151t-.155.384t.152.387t.384.154m.15 3.197q.232 0 .396-.152q.165-.152.165-.384t-.165-.387t-.396-.154t-.384.151t-.152.384t.152.387q.152.155.384.155m1.367-4.72q.232 0 .387-.164t.155-.396t-.152-.384t-.384-.152t-.386.152t-.155.384t.151.396t.384.164m.156 3.197q.232 0 .387-.152t.154-.384t-.151-.387t-.384-.154t-.387.151t-.154.384t.151.387t.384.155m1.504-1.524q.232 0 .396-.151q.165-.152.165-.384t-.165-.387t-.396-.155t-.384.152t-.151.384t.151.387t.384.154M19.13 8.77q-1.197 0-2.029-.846q-.833-.846-.833-2.042t.833-2.039T19.131 3t2.043.846t.845 2.042t-.845 2.039t-2.043.842m.005-1q.778 0 1.33-.548q.553-.549.553-1.332t-.548-1.336T19.139 4t-1.326.548q-.544.549-.544 1.332q0 .784.545 1.336q.544.553 1.322.553m.018-1.884"
                            />
                          </svg>
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Warning cards for Team 1 */}
                  <div className="flex space-x-1">
                    {getTeamWarnings(1).map((warning, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 ${
                          isMultiView ? "text-xs" : "text-xs"
                        } font-bold rounded ${
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
              <div
                className={`text-center ${
                  isMultiView ? "text-2xl" : "text-2xl"
                } font-bold ${marginScale}`}
              >
                VS
              </div>

              {/* Team 2 */}
              <div>
                <div className="flex items-center justify-between justify-center px-0">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div
                        className={`${
                          isMultiView ? "text-3xl" : "text-3xl"
                        } font-bold text-gray-800 mb-1`}
                      >
                        {getTeamName(matchData.teamB)}
                      </div>
                    </div>
                    {isServingTeam(2) && (
                      <div className="flex items-center text-[#A8CE08] bg-[#A8CE08] rounded-full text-black p-1">
                        <span className={isMultiView ? "text-sm" : "text-xl"}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={isMultiView ? "24" : "24"}
                            height={isMultiView ? "24" : "24"}
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="#ffffff"
                              d="M9.406 17.421q-.642 0-1.267-.242t-1.123-.74L2.983 12.4q-.498-.498-.74-1.11T2 10.017t.242-1.272t.74-1.11l2.691-2.69q.498-.499 1.116-.741t1.267-.242q.642 0 1.254.242q.611.242 1.11.74l4.038 4.033q.498.498.74 1.114q.243.615.243 1.275t-.243 1.272t-.74 1.11l-1.008 1.008l5.177 5.177q.146.146.156.347t-.156.366t-.357.166t-.356-.166l-5.158-5.196l-.989.989q-.498.498-1.109.74q-.61.242-1.252.242m-.02-.98q.453 0 .891-.176t.777-.515l2.696-2.715q.339-.333.515-.78q.175-.447.175-.894t-.175-.89t-.515-.78L9.712 5.658q-.333-.339-.766-.518q-.432-.178-.884-.178t-.885.179q-.433.178-.771.517l-2.69 2.69q-.339.339-.515.777t-.176.891t.176.896t.515.78l4.019 4.058q.332.339.765.515t.886.175m-3.868-5.379q.232 0 .387-.151q.155-.152.155-.384t-.152-.386t-.384-.155t-.386.151t-.155.384t.151.387t.384.155m1.523-1.518q.232 0 .387-.151q.155-.152.155-.384t-.152-.387t-.384-.155q-.231 0-.386.152t-.155.384t.152.387q.151.154.383.154m.156 3.216q.232 0 .387-.152t.155-.384t-.152-.396t-.384-.164t-.387.164q-.154.164-.154.396t.151.384t.384.152m1.342-4.74q.232 0 .387-.151t.155-.384t-.152-.387t-.384-.155t-.386.152t-.155.384t.152.386t.383.155m.181 3.221q.232 0 .387-.151q.154-.152.154-.384t-.151-.387t-.384-.154t-.387.151t-.155.384t.152.387t.384.154m.15 3.197q.232 0 .396-.152q.165-.152.165-.384t-.165-.387t-.396-.154t-.384.151t-.152.384t.152.387q.152.155.384.155m1.367-4.72q.232 0 .387-.164t.155-.396t-.152-.384t-.384-.152t-.386.152t-.155.384t.151.396t.384.164m.156 3.197q.232 0 .387-.152t.154-.384t-.151-.387t-.384-.154t-.387.151t-.154.384t.151.387t.384.155m1.504-1.524q.232 0 .396-.151q.165-.152.165-.384t-.165-.387t-.396-.155t-.384.152t-.151.384t.151.387t.384.154M19.13 8.77q-1.197 0-2.029-.846q-.833-.846-.833-2.042t.833-2.039T19.131 3t2.043.846t.845 2.042t-.845 2.039t-2.043.842m.005-1q.778 0 1.33-.548q.553-.549.553-1.332t-.548-1.336T19.139 4t-1.326.548q-.544.549-.544 1.332q0 .784.545 1.336q.544.553 1.322.553m.018-1.884"
                            />
                          </svg>
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Warning cards for Team 2 */}
                  <div className="flex space-x-1">
                    {getTeamWarnings(2).map((warning, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 ${
                          isMultiView ? "text-xs" : "text-xs"
                        } font-bold rounded ${
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
                <div
                  className={`space-y-${isMultiView ? "2" : "8"} text-black`}
                >
                  <div
                    className={`${textScaleLarge} font-bold set-score-style`}
                  >
                    <AnimatedScore 
                      score={getSetScore(1, setIndex)} 
                      isGameScore={false}
                      textColor="text-black"
                    />
                  </div>
                  <div
                    className={`${textScaleLarge} font-bold set-score-style`}
                  >
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
            <div className="text-center bg-[#A8CE08]">
              <div
                className={`space-y-${isMultiView ? "1" : "4"} ${
                  isMultiView ? "py-2 px-2" : "pt-[25px] pb-[25px]"
                }`}
              >
                <div
                  className={`${textScaleXL} font-bold text-black game-score-style`}
                >
                  <AnimatedScore 
                    score={getCurrentGameScore(1)} 
                    isGameScore={true}
                    textColor="text-white"
                  />
                </div>
                <div
                  className={`${textScaleXL} font-bold text-black game-score-style`}
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

      {/* Bottom indicator */}
      <div
        className={`flex justify-between items-center ${
          isMultiView ? "mt-2 px-2" : "mt-8 px-8"
        }`}
      >
        <div
          className={`bg-[#A8CE08] px-4 py-1 rounded-lg font-bold ${
            isMultiView ? "text-sm" : "text-xl"
          }`}
        >
          {matchStatus.current == "completed" ? "COMPLETED" : getMatchFormat()}
        </div>
        <div
          className={`font-bold ${
            isMultiView ? "text-sm" : "text-xl"
          } text-white`}
        >
          {matchData.court?.name || "LIVE SCOREBOARD"}
        </div>
        {/* <div
          className={`bg-[#A8CE08]  px-4 py-1 rounded-lg font-bold ${
            isMultiView ? "text-xs" : "text-sm"
          }`}
        >
          {upcomingMatch ? (
            <div>
              UPCOMING: {getTeamName(upcomingMatch.teamA)} VS{" "}
              {getTeamName(upcomingMatch.teamB)}
            </div>
          ) : (
            <div>UPCOMING</div>
          )}
        </div> */}
      </div>
    </div>
  );
};

// Main Multi-Court Component
const MultiCourtLive = () => {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const courtIdsParam = searchParams.get("courtId");
  const [displayTime, setDisplayTime] = useState(moment().tz("Asia/Karachi"));

  // Parse comma-separated court IDs
  const courtIds = courtIdsParam
    ? courtIdsParam.split(",").map((id) => id.trim())
    : [];

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(moment().tz("Asia/Karachi"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!tournamentId || courtIds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-from-[#093337] via-[#A8CE08] to-[#093337]">
        <div className="text-4xl font-bold text-white">
          Tournament ID and at least one Court ID are required
        </div>
      </div>
    );
  }

  // Determine layout based on number of courts
  const getGridLayout = () => {
    if (courtIds.length === 1) return "grid-cols-1";
    if (courtIds.length === 2) return "grid-cols-2";
    if (courtIds.length === 3) return "grid-cols-2";
    if (courtIds.length === 4) return "grid-cols-2 grid-rows-2";
    if (courtIds.length <= 6) return "grid-cols-2 grid-rows-2";
    return "grid-cols-3"; // Default for more than 6
  };

  const isMultiView = courtIds.length > 1;

  return (
    <div className="min-h-screen  relative overflow-hidden">
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

      {/* Header with logos - only show when multi-view */}
      {isMultiView && <Header />}

      {/* Single court - full screen */}
      {!isMultiView && (
        <div className="relative z-10">
          <Header />
          <div className="px-[100px] mt-[100px]">
            <SingleCourtDisplay
              tournamentId={tournamentId}
              courtId={courtIds[0]}
              isMultiView={false}
            />
          </div>
        </div>
      )}

      {/* Multi-court grid */}
      {isMultiView && (
        <div className={`relative z-10 grid ${getGridLayout()} gap-4 p-4`}>
          {courtIds.map((courtId, index) => {
            const isLastItem = index === courtIds.length - 1;
            const isOddCount = courtIds.length % 2 !== 0;
            const shouldCenter = isLastItem && isOddCount;

            return (
              <div
                key={courtId}
                className={`min-h-[350px] ${
                  shouldCenter ? "col-span-2 flex justify-center" : ""
                }`}
              >
                <div
                  className={
                    shouldCenter ? "w-full max-w-[calc(50%-0.5rem)]" : "w-full"
                  }
                >
                  <SingleCourtDisplay
                    tournamentId={tournamentId}
                    courtId={courtId}
                    isMultiView={true}
                  />
                </div>
              </div>
            );
          })}
          {/* Bottom indicator - Fixed to bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white overflow-hidden">
            <div className="marquee-wrapper">
              <div className="marquee-content-scroll">
                <img src={ImageConstants.sponsor2} alt="Sponsor" className="marquee-image" />
                <img src={ImageConstants.sponsor1} alt="Sponsor" className="marquee-image" />
                <img src={ImageConstants.sponsor2} alt="Sponsor" className="marquee-image" />
                <img src={ImageConstants.sponsor1} alt="Sponsor" className="marquee-image" />
              </div>
            </div>
          </div>
        </div>
      )}

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
        
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .marquee-wrapper {
          width: 100%;
          overflow: hidden;
          background: white;
          padding: 10px 0;
        }
        
        .marquee-content-scroll {
          display: flex;
          width: fit-content;
          animation: marqueeScroll 30s linear infinite;
          will-change: transform;
        }
        
        .marquee-image {
          height: 80px;
          width: auto;
          margin: 0 50px;
          object-fit: contain;
          flex-shrink: 0;
        }
        
        @media (min-width: 1920px) {
          .marquee-image {
            height: 100px;
          }
        }
        
        @media (min-width: 2560px) {
          .marquee-image {
            height: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default MultiCourtLive;
