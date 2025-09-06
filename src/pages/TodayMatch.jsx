import React, { useState, useEffect } from "react";
import { Trophy, Clock, ArrowRight, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ImageConstants } from "../assets/images/ImageConstants";
import Common from "../helper/common";
import { TournamentMatchPlayStatusEnum } from "../const/appConstant";

const MatchScoreCard = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [tournamentData, setTournamentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [params] = useSearchParams();
  const tournamentId = params.get("tournamentId");

  // Function to fetch tournament courts schedule
  const fetchTournamentCourtsSchedule = async () => {
    if (!tournamentId) {
      setError("Tournament ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get current UTC time + 5 hours
      const currentDateTime = Common.Utility.GetCurrentDateTime(5);

      const response = await Common.ApiService.getInstance().request(
        `GetMasterTournamentCourtsSchedule?masterTournamentId=${tournamentId}`
      );

      if (response?.data) {
        setTournamentData(response.data);
        setError(null);
      } else {
        setError("No tournament data found");
        setTournamentData(null);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch tournament data");
      setTournamentData(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (tournamentId) {
      fetchTournamentCourtsSchedule();
    }
  }, [tournamentId]);

  // Effect for fetching tournament data every 10 minutes
  useEffect(() => {
    if (!tournamentId) return;

    const fetchInterval = setInterval(() => {
      fetchTournamentCourtsSchedule();
    }, 10 * 60 * 1000); // Fetch every 10 minutes

    return () => clearInterval(fetchInterval);
  }, [tournamentId]);

  // Helper functions
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-4xl font-bold text-white">
          Loading tournament courts data...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-400 mb-4">Error</div>
          <div className="text-white text-lg">{error}</div>
        </div>
      </div>
    );
  }

  // No tournament data
  if (!tournamentData || !tournamentData.courts) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-4xl font-bold text-gray-400">
          No tournament courts data available
        </div>
      </div>
    );
  }

  return (
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
                <div className="text-4xl text-white font-bold mt-[-20px] mb-2 ">
                  HAPPENING NOW
                </div>
              </div>

              {/* Dynamic Courts Rendering */}
              {tournamentData.courts.map((court, index) => (
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
  );
};

export default MatchScoreCard;
