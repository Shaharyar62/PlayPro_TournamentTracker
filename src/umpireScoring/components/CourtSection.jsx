import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import MatchList from "./MatchList";

const CourtSection = ({ court, onMatchSelect, onGoLive, onPauseLive }) => {
  if (!court || !court.matches || court.matches.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {/* Court Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {court.courtName}
              </h2>
              <p className="text-sm text-gray-600">
                {court.totalMatches} {court.totalMatches === 1 ? "match" : "matches"} scheduled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches for this court */}
      <MatchList
        matches={court.matches}
        onMatchSelect={onMatchSelect}
        onGoLive={onGoLive}
        onPauseLive={onPauseLive}
      />
    </motion.div>
  );
};

export default CourtSection;
