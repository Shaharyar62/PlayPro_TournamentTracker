import React from "react";
import { motion } from "framer-motion";
import {
  Play,
  Clock,
  Trophy,
  Users,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Award,
  Target,
  Pause,
} from "lucide-react";
import { format } from "date-fns";

const MatchList = ({ matches, onMatchSelect, onGoLive, onPauseLive }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "upcoming":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Clock,
          label: "Upcoming",
        };
      case "live":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: Play,
          label: "Live",
        };
      case "completed":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          label: "Completed",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: AlertCircle,
          label: "Unknown",
        };
    }
  };

  const formatMatchTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy • h:mm a");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getScoreDisplay = (scores, setsWon) => {
    if (!scores) return null;

    // Use setsWon if available, otherwise calculate from sets
    if (setsWon) {
      return `${setsWon.teamA} - ${setsWon.teamB}`;
    }

    const { teamA, teamB } = scores;

    // Calculate sets won from set scores
    let setsA = 0;
    let setsB = 0;

    for (let i = 0; i < 3; i++) {
      if (teamA.sets[i] > teamB.sets[i]) {
        setsA++;
      } else if (teamB.sets[i] > teamA.sets[i]) {
        setsB++;
      }
    }

    return `${setsA} - ${setsB}`;
  };

  const getSetScoresDisplay = (scores) => {
    if (!scores) return null;

    const { teamA, teamB } = scores;
    const setScores = [];

    for (let i = 0; i < 3; i++) {
      const scoreA = teamA.sets[i] || 0;
      const scoreB = teamB.sets[i] || 0;
      // Only show sets that have been played (at least one score > 0)
      if (scoreA > 0 || scoreB > 0) {
        setScores.push(`${scoreA}-${scoreB}`);
      }
    }

    return setScores.length > 0 ? setScores.join(", ") : null;
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          No Matches Found
        </h3>
        <p className="text-gray-500">
          There are no matches scheduled for this court.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match, index) => {
        const statusConfig = getStatusConfig(match.status);
        const StatusIcon = statusConfig.icon;
        const scoreDisplay = getScoreDisplay(match.scores, match.setsWon);
        const setScoresDisplay = getSetScoresDisplay(match.scores);

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#55a4ff10] rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className={`
                      px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1
                      ${statusConfig.color}
                    `}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </span>

                    {match.status === "live" && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-red-600 font-medium">
                          LIVE
                        </span>
                      </div>
                    )}
                    {match.courtName && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 text-black h-4" />
                        <span className="font-medium text-black">
                          {match.courtName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {match.tournament}
                  </h3> */}

                  <div className="flex flex-row items-center gap-3 text-sm text-gray-600 mb-2">
                    {match.stageType && (
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{match.stageType}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatMatchTime(match.scheduledTime)}</span>
                    </div>
                  </div>

                  {match.status === "completed" && match.matchResult && (
                    <div className="flex items-center space-x-1 text-sm mt-1">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-700">
                        {match.matchResult}
                      </span>
                    </div>
                  )}
                </div>

                {/* Score Display */}
                {scoreDisplay && match.status !== "upcoming" && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {scoreDisplay}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">Sets Won</div>
                    {setScoresDisplay && (
                      <div className="text-xs text-gray-600 font-medium">
                        Sets: {setScoresDisplay}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Teams */}
              <div className="space-y-3 mb-6">
                {/* Team A */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {match.teamA.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {match.teamA.players
                          ?.map((p) =>
                            typeof p === "string" ? p : p.name || p.playerName
                          )
                          .join(" • ") || "No players"}
                      </div>
                    </div>
                  </div>

                  {match.status !== "upcoming" && match.scores && (
                    <div className="text-right">
                      <div className="font-mono text-sm text-gray-600 mb-1">
                        {match.scores.teamA.sets.filter((s) => s > 0).length > 0
                          ? match.scores.teamA.sets
                              .filter((s) => s > 0)
                              .join("-")
                          : "0"}
                      </div>
                      {match.setsWon && (
                        <div className="text-xs text-blue-600 font-semibold">
                          {match.setsWon.teamA} sets
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* VS Divider */}
                {/* <div className="text-center">
                  <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">
                    VS
                  </span>
                </div> */}

                {/* Team B */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {match.teamB.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {match.teamB.players
                          ?.map((p) =>
                            typeof p === "string" ? p : p.name || p.playerName
                          )
                          .join(" • ") || "No players"}
                      </div>
                    </div>
                  </div>

                  {match.status !== "upcoming" && match.scores && (
                    <div className="text-right">
                      <div className="font-mono text-sm text-gray-600 mb-1">
                        {match.scores.teamB.sets.filter((s) => s > 0).length > 0
                          ? match.scores.teamB.sets
                              .filter((s) => s > 0)
                              .join("-")
                          : "0"}
                      </div>
                      {match.setsWon && (
                        <div className="text-xs text-red-600 font-semibold">
                          {match.setsWon.teamB} sets
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                {match.status === "upcoming" && (
                  <motion.button
                    onClick={() => onGoLive(match)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md border border-red-500"
                  >
                    <Play className="w-5 h-5" />
                    <span>Go Live</span>
                  </motion.button>
                )}

                {match.status === "live" && (
                  <>
                    <motion.button
                      onClick={() => onMatchSelect(match)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md border border-blue-500"
                    >
                      <MapPin className="w-5 h-5" />
                      <span>Continue Scoring</span>
                    </motion.button>
                    <motion.button
                      onClick={() => onPauseLive(match)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md border border-orange-500"
                    >
                      <Pause className="w-5 h-5" />
                      <span>Pause Live</span>
                    </motion.button>
                  </>
                )}

                {/* {match.status === "completed" && (
                  <motion.button
                    onClick={() => onMatchSelect(match)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>View Results</span>
                  </motion.button>
                )} */}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MatchList;
