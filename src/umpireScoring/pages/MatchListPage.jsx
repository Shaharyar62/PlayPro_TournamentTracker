import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, Shield, Trophy, ChevronDown } from "lucide-react";
import { useUmpire } from "../context/UmpireContext";
import { umpireAPI } from "../services/umpireAPI";
import { TournamentMatchPlayStatusEnum } from "../../const/appConstant";
import Filters from "../components/Filters";
import MatchList from "../components/MatchList";

const MatchListPage = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    masterTournaments,
    masterTournamentId,
    logout,
    getMatchesForCourt,
    setCurrentMatch,
    startMatch,
    setMasterTournamentId,
    fetchMatches,
    loading,
  } = useUmpire();

  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showTournamentDropdown, setShowTournamentDropdown] = useState(false);

  // Get selected tournament name
  const selectedTournament = useMemo(() => {
    return masterTournaments.find((t) => t.id === masterTournamentId);
  }, [masterTournaments, masterTournamentId]);

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
    navigate("/");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  };

  const handleTournamentChange = (tournamentId) => {
    setMasterTournamentId(tournamentId);
    setShowTournamentDropdown(false);
  };

  const handleMatchSelect = (match) => {
    setCurrentMatch(match);
    navigate("/score-upload");
  };

  const handleGoLive = async (match) => {
    try {
      // Call API to update match status to In_Progress
      const response = await umpireAPI.updateTournamentMatchStatus(
        match.id,
        TournamentMatchPlayStatusEnum.In_Progress
      );

      if (response.success) {
        // Update local state
        await startMatch(match.id);
        setCurrentMatch(match);
        // Navigate to score upload page
        navigate("/score-upload");
      } else {
        // Show error message if API call failed
        console.error("Failed to update match status:", response.error);
        alert(
          response.error || "Failed to update match status. Please try again."
        );
      }
    } catch (error) {
      // Handle API errors
      console.error("Error updating match status:", error);
      alert(
        error.message ||
          "An error occurred while updating match status. Please try again."
      );
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
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
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Tournament Dropdown */}
              {masterTournaments.length > 0 && (
                <div className="relative">
                  <motion.button
                    onClick={() =>
                      setShowTournamentDropdown(!showTournamentDropdown)
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-md border border-blue-700 min-w-[200px] max-w-[300px]"
                  >
                    <Trophy className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium truncate text-left flex-1">
                      {selectedTournament?.name || "Select Tournament"}
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  </motion.button>

                  {showTournamentDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-300 z-50 max-h-96 overflow-y-auto">
                      {masterTournaments.map((tournament) => (
                        <button
                          key={tournament.id}
                          onClick={() => handleTournamentChange(tournament.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                            tournament.id === masterTournamentId
                              ? "bg-blue-100 font-semibold text-blue-800 border-l-4 border-l-blue-600"
                              : "text-gray-800 hover:text-blue-700"
                          }`}
                        >
                          <div className="font-medium text-sm break-words leading-tight">
                            {tournament.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <motion.button
                onClick={handleRefresh}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={refreshing || loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors duration-200"
              >
                <RefreshCw
                  className={`w-5 h-5 ${
                    refreshing || loading ? "animate-spin" : ""
                  }`}
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
              {selectedTournament
                ? `Manage and score matches for ${selectedTournament.name}`
                : "Select a tournament to view matches"}
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
                    ? "There are no matches scheduled for this tournament."
                    : `There are no ${activeFilter} matches for this tournament.`}
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
            {selectedTournament && (
              <p className="mt-1">Tournament: {selectedTournament.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showTournamentDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowTournamentDropdown(false)}
        />
      )}
    </div>
  );
};

export default MatchListPage;
