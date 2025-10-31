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
} from "lucide-react";
import { format } from "date-fns";

const MatchList = ({ matches, onMatchSelect, onGoLive }) => {
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

  const getScoreDisplay = (scores) => {
    if (!scores) return null;

    const { teamA, teamB } = scores;

    // Show sets won
    const setsA = teamA.sets.filter(
      (set) => set > teamB.sets[teamA.sets.indexOf(set)]
    ).length;
    const setsB = teamB.sets.filter(
      (set) => set > teamA.sets[teamB.sets.indexOf(set)]
    ).length;

    return `${setsA} - ${setsB}`;
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
        const scoreDisplay = getScoreDisplay(match.scores);

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
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {match.tournament}
                  </h3>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4" />
                      <span>{match.round}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatMatchTime(match.scheduledTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Score Display */}
                {scoreDisplay && match.status !== "upcoming" && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {scoreDisplay}
                    </div>
                    <div className="text-xs text-gray-500">Sets Won</div>
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
                        {match.teamA.players.join(" • ")}
                      </div>
                    </div>
                  </div>

                  {match.status !== "upcoming" && (
                    <div className="text-right">
                      <div className="font-mono text-sm text-gray-600">
                        {match.scores.teamA.sets.join("-")}
                      </div>
                    </div>
                  )}
                </div>

                {/* VS Divider */}
                <div className="text-center">
                  <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">
                    VS
                  </span>
                </div>

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
                        {match.teamB.players.join(" • ")}
                      </div>
                    </div>
                  </div>

                  {match.status !== "upcoming" && (
                    <div className="text-right">
                      <div className="font-mono text-sm text-gray-600">
                        {match.scores.teamB.sets.join("-")}
                      </div>
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
                  <motion.button
                    onClick={() => onMatchSelect(match)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md border border-blue-500"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Continue Scoring</span>
                  </motion.button>
                )}

                {match.status === "completed" && (
                  <motion.button
                    onClick={() => onMatchSelect(match)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>View Results</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MatchList;
