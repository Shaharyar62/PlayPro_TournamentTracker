import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, Shield, MapPin } from "lucide-react";
import { useUmpire } from "../context/UmpireContext";
import Filters from "../components/Filters";
import MatchList from "../components/MatchList";

const MatchListPage = () => {
  const navigate = useNavigate();
  const {
    currentCourt,
    logout,
    getMatchesForCourt,
    setCurrentMatch,
    startMatch,
  } = useUmpire();

  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Get matches based on filter
  const filteredMatches = useMemo(() => {
    if (activeFilter === "all") {
      return getMatchesForCourt();
    }
    return getMatchesForCourt(activeFilter);
  }, [activeFilter, getMatchesForCourt]);

  // Calculate match counts for filters
  const matchCounts = useMemo(() => {
    const allMatches = getMatchesForCourt();
    return {
      all: allMatches.length,
      upcoming: allMatches.filter((m) => m.status === "upcoming").length,
      live: allMatches.filter((m) => m.status === "live").length,
      completed: allMatches.filter((m) => m.status === "completed").length,
    };
  }, [getMatchesForCourt]);

  const handleLogout = () => {
    logout();
    navigate("../login");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleMatchSelect = (match) => {
    setCurrentMatch(match);
    navigate("../score-upload");
  };

  const handleGoLive = async (match) => {
    await startMatch(match.id);
    setCurrentMatch(match);
    navigate("../score-upload");
  };

  if (!currentCourt) {
    navigate("../login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Umpire Portal
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {currentCourt.name} • {currentCourt.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                onClick={handleRefresh}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={refreshing}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors duration-200"
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </motion.button>

              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Page Title */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Match Schedule
            </h2>
            <p className="text-gray-600">
              Manage and score matches for {currentCourt.name}
            </p>
          </div>

          {/* Filters */}
          <Filters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            matchCounts={matchCounts}
          />

          {/* Match List */}
          <MatchList
            matches={filteredMatches}
            onMatchSelect={handleMatchSelect}
            onGoLive={handleGoLive}
          />

          {/* Empty State */}
          {filteredMatches.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No {activeFilter !== "all" ? activeFilter : ""} matches found
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeFilter === "all"
                    ? "There are no matches scheduled for this court."
                    : `There are no ${activeFilter} matches for this court.`}
                </p>
                <motion.button
                  onClick={handleRefresh}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>PlayPro Tournament Tracker - Umpire Portal</p>
            <p className="mt-1">
              Court: {currentCourt.id} • {currentCourt.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchListPage;
