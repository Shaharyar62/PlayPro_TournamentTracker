import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronUp, Trophy, Award, Shield } from "lucide-react";
import { motion } from "framer-motion";
import LogoFlipBox from "../components/logoFlipBox";
import { useSearchParams } from "react-router-dom";
import { ImageConstants } from "../assets/images/ImageConstants";
import Common from "../helper/common";
const TournamentStandings = () => {
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [animateRanks, setAnimateRanks] = useState(false);
  const [tournamentsData, setTournamentsData] = useState([]);
  const [currentTournamentIndex, setCurrentTournamentIndex] = useState(0);
  const [currentGroupPage, setCurrentGroupPage] = useState(0);
  const [showTodayMatch, setShowTodayMatch] = useState(false);

  // TodayMatch related state
  const [todayMatchData, setTodayMatchData] = useState(null);
  const [todayMatchLoading, setTodayMatchLoading] = useState(false);
  const [todayMatchError, setTodayMatchError] = useState(null);

  const GROUPS_PER_PAGE = 4; // Show 4 groups at a time as requested

  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parse tournament IDs from URL params - memoized to prevent re-creation
  const tournamentIds = useMemo(() => {
    const tournamentIdsParam = params.get("tournamentIds");
    const singleTournamentId = params.get("tournamentId"); // Backward compatibility

    console.log("URL param tournamentIds:", tournamentIdsParam);

    if (tournamentIdsParam) {
      try {
        const parsed = JSON.parse(tournamentIdsParam);
        console.log("Parsed tournament IDs:", parsed);
        return parsed;
      } catch (e) {
        // If JSON parsing fails, try comma-separated values
        const csvParsed = tournamentIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        console.log("CSV parsed tournament IDs:", csvParsed);
        return csvParsed;
      }
    } else if (singleTournamentId) {
      console.log("Single tournament ID:", singleTournamentId);
      return [parseInt(singleTournamentId)];
    }

    // Default tournament IDs for testing
    console.log("Using default tournament IDs");
    return [76, 77, 78];
  }, [params]);

  // Get display time for each set of groups (in seconds) - REQUIRED
  const groupDisplayTime = parseInt(params.get("groupDisplayTime"));
  if (!groupDisplayTime || groupDisplayTime <= 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-400 mb-4">Missing Parameter</div>
          <div className="text-white text-lg mb-4">groupDisplayTime parameter is required (in seconds)</div>
          <div className="text-gray-300 text-sm">Example: ?groupDisplayTime=15</div>
        </div>
      </div>
    );
  }

  // Get refresh interval for data (in minutes) - REQUIRED
  const refreshInterval = parseInt(params.get("refreshInterval"));
  if (!refreshInterval || refreshInterval <= 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-400 mb-4">Missing Parameter</div>
          <div className="text-white text-lg mb-4">refreshInterval parameter is required (in minutes)</div>
          <div className="text-gray-300 text-sm">Example: ?refreshInterval=10</div>
        </div>
      </div>
    );
  }

  // Helper function to calculate PCT (win percentage)
  const calculatePCT = (wins, played) => {
    // Handle null, undefined, or invalid values
    const validWins = wins || 0;
    const validPlayed = played || 0;

    if (validPlayed === 0) return 0;
    return validWins / validPlayed;
  };

  // TodayMatch helper functions
  const getTeamDisplayName = (team) => {
    if (!team) return "TBA";
    return team.teamName || "Unknown Team";
  };

  const getCourtBackgroundColor = (courtName) => {
    if (!courtName) return "bg-[#737373]";

    const name = courtName.toLowerCase();
    if (name.includes("galaxy")) return "bg-[#737373]";
    if (name.includes("black") || name.includes("star")) return "bg-[#000000]";
    if (name.includes("infinity")) return "bg-[#430750]";
    return "bg-[#737373]"; // default
  };

  const renderMatchInfo = (match, type) => {
    if (!match) {
      return (
        <div className="grid grid-cols-11 gap-4 items-center">
          <div
            className={`col-span-2 text-center text-lg text-black bg-[#d9d9db] py-1 rounded-lg font-bold`}
          >
            {type.toUpperCase()}
          </div>
          <div className="col-span-9 text-center text-white text-2xl font-bold">
            No Match Scheduled
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-11 gap-4 items-center">
        <div
          className={`col-span-2 text-center text-lg text-black bg-[#d9d9db] py-1 rounded-lg font-bold`}
        >
          {type.toUpperCase()}
        </div>
        <div className="col-span-4 text-end text-white text-2xl font-bold break-words overflow-hidden">
          <div className="truncate" title={getTeamDisplayName(match.teamA)}>
            {getTeamDisplayName(match.teamA)}
          </div>
        </div>
        <div className="col-span-1 text-center text-white text-2xl font-bold">
          VS
        </div>
        <div className="col-span-4 text-start text-white text-2xl font-bold break-words overflow-hidden">
          <div className="truncate" title={getTeamDisplayName(match.teamB)}>
            {getTeamDisplayName(match.teamB)}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setAnimateRanks(true);
    const timer = setTimeout(() => setAnimateRanks(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Get current tournament data
  const currentTournament = useMemo(() => {
    if (!tournamentsData || tournamentsData.length === 0) return null;
    return tournamentsData[currentTournamentIndex] || null;
  }, [tournamentsData, currentTournamentIndex]);

  const groupedTeams = useMemo(() => {
    if (
      !currentTournament ||
      !currentTournament.teams ||
      !Array.isArray(currentTournament.teams)
    ) {
      return [];
    }

    // Group teams by their group property
    const groupedTeams = currentTournament.teams.reduce((map, team) => {
      // Add safety check for team object
      if (!team || typeof team !== "object") return map;

      const group = team.group || "No Group";
      if (!map[group]) {
        map[group] = [];
      }
      map[group].push(team);
      return map;
    }, {});

    // Sort teams within each group by points (descending), then by pd, then by pf
    Object.keys(groupedTeams).forEach((groupKey) => {
      groupedTeams[groupKey].sort((a, b) => {
        // Add safety checks for team objects
        if (!a || !b) return 0;

        // Calculate PCT on client side
        const aPct = calculatePCT(a.wins, a.played);
        const bPct = calculatePCT(b.wins, b.played);

        // Primary sort: by points (descending)
        const aPoints = a.points || 0;
        const bPoints = b.points || 0;
        if (bPoints !== aPoints) {
          return bPoints - aPoints;
        }
        // Secondary sort: by point difference (descending)
        const aPd = a.pd || 0;
        const bPd = b.pd || 0;
        if (bPd !== aPd) {
          return bPd - aPd;
        }
        // Tertiary sort: by points for (descending)
        const aPf = a.pf || 0;
        const bPf = b.pf || 0;
        if (bPf !== aPf) {
          return bPf - aPf;
        }
        // Fourth sort: by PCT (descending)
        return bPct - aPct;
      });
    });

    // Convert to array and sort groups alphabetically
    const sortedGroupedTeams = Object.values(groupedTeams).sort((a, b) => {
      // Add safety check for empty groups
      if (!a[0] || !b[0]) return 0;
      return a[0].group.localeCompare(b[0].group);
    });

    console.log("groupedTeams for tournament", currentTournament.name, sortedGroupedTeams);
    return sortedGroupedTeams;
  }, [currentTournament]);

  // Function to fetch TodayMatch data
  const fetchTodayMatchData = async () => {
    // Use the first tournament ID from tournamentIds for TodayMatch
    const tournamentId = tournamentIds[0];

    if (!tournamentId) {
      setTodayMatchError("Tournament ID is required");
      return;
    }

    try {
      setTodayMatchLoading(true);
      const response = await Common.ApiService.getInstance().request(
        `GetMasterTournamentCourtsSchedule?masterTournamentId=${25}`
      );

      if (response?.data) {
        setTodayMatchData(response.data);
        setTodayMatchError(null);
      } else {
        setTodayMatchError("No tournament data found");
        setTodayMatchData(null);
      }
    } catch (err) {
      setTodayMatchError(err.message || "Failed to fetch tournament data");
      setTodayMatchData(null);
    } finally {
      setTodayMatchLoading(false);
    }
  };

  // Effect for cycling through groups, tournaments, and TodayMatch
  useEffect(() => {
    if (!currentTournament || groupedTeams.length === 0) return;

    const interval = setInterval(() => {
      if (showTodayMatch) {
        // Currently showing TodayMatch, switch back to groups and start from first tournament
        setShowTodayMatch(false);
        setCurrentTournamentIndex(0); // Start from first tournament again
        setCurrentGroupPage(0);
      } else {
        // Currently showing groups
        const totalGroups = groupedTeams.length;
        const totalPages = Math.ceil(totalGroups / GROUPS_PER_PAGE);

        if (totalPages > 1) {
          // If current tournament has multiple pages of groups
          setCurrentGroupPage((prevPage) => {
            const nextPage = prevPage + 1;
            if (nextPage >= totalPages) {
              // All pages shown for current tournament, move to next tournament
              const nextTournamentIndex = (currentTournamentIndex + 1) % tournamentsData.length;

              if (nextTournamentIndex === 0) {
                // We've completed all tournaments, show TodayMatch
                setShowTodayMatch(true);
                if (!todayMatchData) {
                  fetchTodayMatchData(); // Fetch data when first time showing
                }
                return 0; // Reset to first page for when we come back to groups
              } else {
                // Move to next tournament
                setCurrentTournamentIndex(nextTournamentIndex);
                return 0; // Reset to first page for next tournament
              }
            }
            return nextPage;
          });
        } else {
          // Current tournament has only one page, move to next tournament
          const nextTournamentIndex = (currentTournamentIndex + 1) % tournamentsData.length;

          if (nextTournamentIndex === 0) {
            // We've completed all tournaments, show TodayMatch
            setShowTodayMatch(true);
            if (!todayMatchData) {
              fetchTodayMatchData(); // Fetch data when first time showing
            }
          } else {
            // Move to next tournament
            setCurrentTournamentIndex(nextTournamentIndex);
            setCurrentGroupPage(0);
          }
        }
      }
    }, groupDisplayTime * 1000); // Convert seconds to milliseconds

    return () => clearInterval(interval);
  }, [currentTournament, groupedTeams.length, tournamentsData.length, groupDisplayTime, showTodayMatch, todayMatchData, currentTournamentIndex]);

  // Function to fetch multiple tournaments points table
  const fetchMultipleTournamentsPointsTable = useCallback(async (isRefresh = false) => {
    if (!tournamentIds || tournamentIds.length === 0) {
      setError("Tournament IDs are required");
      setLoading(false);
      return;
    }

    try {
      // Only set loading if it's not already set (for refresh)
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      console.log("Tournament IDs for API:", tournamentIds);

      const response = await Common.ApiService.getInstance().request(
        `GetMultipleTournamentsPointsTable`,
        tournamentIds,
        "POST"
      );

      console.log("API Response:", response);

      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Clear old data and set new data
        setTournamentsData([]);
        setTimeout(() => {
          setTournamentsData(response.data);
          setCurrentTournamentIndex(0);
          setCurrentGroupPage(0);
          setError(null);
          console.log("Fetched tournaments data:", response.data);
        }, 100); // Small delay to show loading state
      } else {
        setError("No tournament data found");
        setTournamentsData([]);
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err);
      setError(err.message || "Failed to fetch tournament data");
      setTournamentsData([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentIds]);

  // Initial fetch
  useEffect(() => {
    if (tournamentIds && tournamentIds.length > 0) {
      fetchMultipleTournamentsPointsTable();
    }
  }, [fetchMultipleTournamentsPointsTable]);

  // Effect for fetching tournament data at specified refresh interval
  useEffect(() => {
    if (!tournamentIds || tournamentIds.length === 0) return;

    const fetchInterval = setInterval(() => {
      // Show loading state during refresh
      setLoading(true);
      fetchMultipleTournamentsPointsTable(true);
      // Also refresh TodayMatch data if we have it
      if (todayMatchData) {
        fetchTodayMatchData();
      }
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(fetchInterval);
  }, [fetchMultipleTournamentsPointsTable, refreshInterval, todayMatchData]);

  // Get team status based on position in group (only if team has played matches)
  const getTeamStatus = (index, groupLength, team) => {
    // Don't show any status if team hasn't played any matches
    if (!team || !team.played || team.played === 0) {
      return null;
    }

    if (index === 0) return "champion"; // 1st place
    if (index === 1 && groupLength > 2) return "qualified"; // 2nd place
    return "eliminated"; // rest
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "champion":
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case "qualified":
        return <Award className="h-5 w-5 text-blue-400" />;
      case "eliminated":
        return <Shield className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getRowGradient = (id) => {
    if (id === 1)
      return "bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 border-l-4 border-yellow-400";
    if (id === 2)
      return "bg-gradient-to-r from-blue-50 to-white border-l-4 border-blue-400";
    return "bg-white border-l-4 border-gray-200";
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-4xl font-bold text-white">
          Loading tournament data...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-4xl font-bold text-red-400">Error: {error}</div>
      </div>
    );
  }

  // No tournament data
  if (!tournamentsData || tournamentsData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-4xl font-bold text-gray-400">
          No tournament data available
        </div>
      </div>
    );
  }

  // Add error boundary protection
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-400 mb-4">Error</div>
          <div className="text-white text-lg mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null);
              fetchMultipleTournamentsPointsTable();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  try {
    // Show TodayMatch component when showTodayMatch is true
    if (showTodayMatch) {
      // TodayMatch loading state
      if (todayMatchLoading) {
        return (
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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
              <div className="text-4xl font-bold text-white">
                Loading tournament courts data...
              </div>
            </div>
          </div>
        );
      }

      // TodayMatch error state
      if (todayMatchError) {
        return (
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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400 mb-4">Error</div>
                <div className="text-white text-lg">{todayMatchError}</div>
              </div>
            </div>
          </div>
        );
      }

      // No TodayMatch data
      if (!todayMatchData || !todayMatchData.courts) {
        return (
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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
              <div className="text-4xl font-bold text-gray-400">
                No tournament courts data available
              </div>
            </div>
          </div>
        );
      }

      // TodayMatch render
      return (
        <>
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

            {/* Main content */}
            <div className="relative z-10 mt-[-30px] items-center justify-center min-h-screen">
              <div className="w-full">
                {/* Header with logos */}
                <div className="flex justify-between items-center">
                  <div className="text-center" style={{ width: "280px" }}>
                    <img
                      width={180}
                      className="justify-self-start p-5"
                      src={ImageConstants.padelVersewhite}
                      alt="Playpro"
                    />
                  </div>

                  <div className="text-center">
                    <img
                      width={220}
                      className="justify-self-end p-5"
                      src={ImageConstants.padelVerse}
                      alt="Playpro"
                    />
                  </div>

                  <div className="text-center" style={{ width: "280px" }}>
                    <img
                      width={230}
                      className="justify-self-end p-5"
                      src={ImageConstants.playproWhite}
                      alt="Playpro"
                    />
                  </div>
                </div>
                <div className="p-[50px] pt-[0px] pb-[120px] grid grid-cols-1 gap-6 items-center">
                  <div className="col-span-1 text-center">
                    <div className="text-4xl text-white font-bold mt-[-20px] mb-2">
                      HAPPENING NOW
                    </div>
                  </div>

                  {/* Dynamic Courts Rendering */}
                  {todayMatchData.courts.map((court, index) => (
                    <div
                      key={court.courtId || index}
                      className="grid grid-cols-11 gap-4 items-center"
                    >
                      <div className="col-span-3 text-center">
                        <h2
                          className={`text-4xl text-white ${getCourtBackgroundColor(
                            court.courtName
                          )} py-1 mr-[70px] rounded-lg font-bold break-words overflow-hidden`}
                        >
                          <div
                            className="truncate"
                            title={court.courtName || `Court ${court.courtId}`}
                          >
                            {court.courtName || `Court ${court.courtId}`}
                          </div>
                        </h2>
                      </div>
                      <div className="col-span-4 text-center">
                        {renderMatchInfo(court.currentMatch, "current")}
                      </div>
                      <div className="col-span-4 text-center">
                        {renderMatchInfo(court.upcomingMatch, "upcoming")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Bottom indicator - Fixed to bottom */}
              <div className="fixed bottom-0 left-0 right-0 z-20 bg-transparent">
                <img src={ImageConstants.sponsor} className="w-full" />
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
        </>
      );
    }

    return (
      <>
        <>
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

            {/* Main content */}
            <div className="relative z-10  mt-[-30px] items-center justify-center min-h-screen">
              <div
                style={{ position: "absolute" }}
                className="text-white bg-[#23284c] text-3xl font-bold px-6 py-2 rounded-lg rotate-[-90deg]  top-[500px] left-[-40px]   "
              >
                GROUPS
              </div>

              <div className="w-full">
                {/* Header with logos */}
                <div className="flex justify-between items-center">
                  <div className="text-center" style={{ width: "280px" }}>
                    <img
                      width={180}
                      className="justify-self-start p-5"
                      src={ImageConstants.padelVersewhite}
                      alt="Playpro"
                    />
                  </div>

                  <div className="text-center">
                    <img
                      width={220}
                      className="justify-self-end p-5"
                      src={ImageConstants.padelVerse}
                      alt="Playpro"
                    />
                  </div>

                  <div className="text-center" style={{ width: "280px" }}>
                    <img
                      width={230}
                      className="justify-self-end p-5"
                      src={ImageConstants.playproWhite}
                      alt="Playpro"
                    />
                  </div>
                </div>
                <div className="p-[50px] pb-[10px] pt-[0px] grid grid-cols-1 gap-6 items-center">
                  <div className="col-span-1 text-center">
                    <div className="text-4xl text-white font-bold mt-[-30px] mb-2 ">
                      {currentTournament?.name || "Tournament"}
                    </div>
                  </div>
                  <div
                    style={{ zoom: 0.9 }}
                    className="grid grid-cols-2 pr-[50px] pl-[50px] gap-5"
                  >
                    {groupedTeams
                      .slice(currentGroupPage * GROUPS_PER_PAGE, (currentGroupPage + 1) * GROUPS_PER_PAGE)
                      .map((group) => {
                        // Add safety check for group
                        if (
                          !group ||
                          !Array.isArray(group) ||
                          group.length === 0
                        )
                          return null;

                        var groupName = group[0]?.group || "Unknown";
                        console.log("group", group);
                        return (
                          <div className="col-span-1 ">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              style={{ zoom: 1.3 }}
                              className="max-w-[1024px]  mt-[-15px]  mx-auto rounded-lg shadow-lg overflow-hidden bg-white"
                            >
                              {/* Header with glow effect */}
                              <div className="relative bg-gradient-to-r from-blue-800 via-blue-600 to-blue-700 px-6 py-1 text-white">
                                <div className="flex justify-between items-center relative z-10">
                                  <div className="flex items-center space-x-1">
                                    <motion.div
                                      initial={{ rotate: -10 }}
                                      animate={{ rotate: 0 }}
                                      transition={{ duration: 0.5 }}
                                    >
                                      <Trophy className="h-5 w-5 text-yellow-300" />
                                    </motion.div>
                                    <h2 className="text-lg font-bold tracking-wider">
                                      Group {groupName}
                                    </h2>
                                  </div>
                                  <div className="text-sm text-blue-100">
                                    {currentTournament?.tournamentMasterName ||
                                      currentTournament?.name}
                                  </div>
                                </div>
                                {/* <div className="text-xs text-blue-200 mt-1 relative z-10">
            
          </div> */}
                              </div>
                              <div className="bg-gradient-to-b from-gray-50 to-white">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                                      <th className="py-1 px-4 text-left">#</th>
                                      <th className="py-1 px-4 text-left">
                                        Team Name
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        P
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        W
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        L
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        D
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        PTS
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        PCT
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        PF
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        PA
                                      </th>
                                      <th className="py-1 px-4 text-center">
                                        PD
                                      </th>
                                      <th className="py-1 px-4 text-center"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.map((team, index) => {
                                      // Add safety check for team object
                                      if (!team) return null;

                                      const status = getTeamStatus(
                                        index,
                                        group.length,
                                        team
                                      );
                                      return (
                                        <motion.tr
                                          key={team.id}
                                          className={`${getRowGradient(
                                            index + 1
                                          )} ${highlightedRow === team.id
                                            ? "bg-blue-50"
                                            : ""
                                            }`}
                                          onMouseEnter={() =>
                                            setHighlightedRow(team.id)
                                          }
                                          onMouseLeave={() =>
                                            setHighlightedRow(null)
                                          }
                                          whileHover={{ scale: 1.01 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 300,
                                          }}
                                        >
                                          <td className="py-1 px-1">
                                            <motion.div
                                              initial={{
                                                scale: animateRanks ? 1.5 : 1,
                                                color: "#3B82F6",
                                              }}
                                              animate={{
                                                scale: 1,
                                                color: "#000000",
                                              }}
                                              transition={{
                                                duration: 0.5,
                                                delay: index * 0.1,
                                              }}
                                              className="font-bold"
                                            >
                                              {index + 1}
                                            </motion.div>
                                          </td>
                                          <td className="py-1 px-1 text-sm font-semibold">
                                            {team.teamName}
                                          </td>
                                          <td className="py-1 px-1 text-center font-bold">
                                            {team.played ?? 0}
                                          </td>
                                          <td className="py-1 px-1 text-center font-bold">
                                            {team.wins ?? 0}
                                          </td>
                                          <td className="py-1 px-1 text-center text-red-600">
                                            {team.lose ?? 0}
                                          </td>
                                          <td className="py-1 px-1 text-center text-gray-600">
                                            {team.draw ?? 0}
                                          </td>
                                          <td className="py-1 px-1 text-center font-bold text-blue-600">
                                            {team.points ?? 0}
                                          </td>
                                          <td className="py-1 px-1 text-center text-blue-600 font-mono">
                                            {calculatePCT(
                                              team.wins,
                                              team.played
                                            ).toFixed(3)}
                                          </td>
                                          <td className="py-1 px-1 text-center text-blue-600 font-bold">
                                            {team.pf ?? 0}
                                          </td>
                                          <td className="py-1 px-1 text-center">
                                            {team.pa ?? 0}
                                          </td>
                                          <td
                                            className={`py-1 px-1 text-center font-bold ${team.pd > 0
                                              ? "text-green-600"
                                              : team.pd < 0
                                                ? "text-red-500"
                                                : "text-gray-600"
                                              }`}
                                          >
                                            {team.pd > 0 ? "+" : ""}
                                            {team.pd ?? 0}
                                          </td>
                                          <td className="py-1 px-1 text-center">
                                            <motion.div
                                              whileHover={{
                                                scale: 1.2,
                                                rotate: 5,
                                              }}
                                              transition={{
                                                type: "spring",
                                                stiffness: 400,
                                              }}
                                            >
                                              {getStatusIcon(status)}
                                            </motion.div>
                                          </td>
                                        </motion.tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="px-4 py-1 bg-gradient-to-r from-blue-900 to-blue-800 text-white text-xs">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center space-x-2">
                                    <Trophy className="h-4 w-4 text-yellow-400" />
                                    <span>Champion</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Award className="h-4 w-4 text-blue-400" />
                                    <span>Qualified</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Shield className="h-4 w-4 text-gray-400" />
                                    <span>Eliminated</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
              {/* Bottom indicator */}
              <div className="fixed bottom-0 left-0 right-0 z-20 bg-transparent">
                <img src={ImageConstants.sponsor} className="w-full " />
                {/* <div className="bg-[#015d9c] ml-5 text-white w-min px-[50px] whitespace-nowrap py-1  rounded-lg font-bold text-3xl">
              3 SETS
            </div>
            <div className="font-bold text-3xl text-center text-white">
              LIVE SCOREBOARD
            </div> */}
              </div>

              {/* Live indicator */}
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
      </>
    );
  } catch (error) {
    console.error("Error in TournamentStandings component:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-400 mb-4">
            Component Error
          </div>
          <div className="text-white text-lg">
            {error.message || "An unexpected error occurred"}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default TournamentStandings;

