import React, { useState, useEffect } from "react";
import { Trophy, Clock, ArrowRight, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTournamentImages } from "../context/TournamentImagesContext";
import Common from "../helper/common";
import { TournamentMatchPlayStatusEnum } from "../const/appConstant";
import Header from "../components/layout/header";
import SponsorMarquee from "../components/SponsorMarquee";
import "../assets/css/today-match.css";

const MatchScoreCard = () => {
  const images = useTournamentImages();
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
        `GetMasterTournamentCourtsSchedule?masterTournamentId=${tournamentId}`,
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

    const fetchInterval = setInterval(
      () => {
        fetchTournamentCourtsSchedule();
      },
      10 * 60 * 1000,
    ); // Fetch every 10 minutes

    return () => clearInterval(fetchInterval);
  }, [tournamentId]);

  // Helper functions
  const getTeamDisplayName = (team) => {
    if (!team) return "TBA";
    return team.teamName || "Unknown Team";
  };


  const renderMatchInfo = (match, type) => {
    const badgeClass =
      "col-span-2 flex justify-center items-center today-match-badge-outline text-lg font-bold";

    if (!match) {
      return (
        <div className="grid grid-cols-11 gap-4 items-stretch">
          <div className={badgeClass}>{type.toUpperCase()}</div>
          <div className="col-span-9 today-match-glass flex items-center justify-center py-4 px-5">
            <span className="today-match-glass-content text-2xl font-bold">
              No Match Scheduled
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-11 gap-4 items-stretch">
        <div className={badgeClass}>{type.toUpperCase()}</div>
        <div className="col-span-9 today-match-glass grid grid-cols-9 gap-3 items-center py-4 px-5">
          <div className="col-span-4 text-end today-match-glass-content text-2xl font-bold break-words overflow-hidden">
            <div className="truncate" title={getTeamDisplayName(match.teamA)}>
              {getTeamDisplayName(match.teamA)}
            </div>
          </div>
          <div className="col-span-1 text-center today-match-glass-content text-2xl font-bold">
            VS
          </div>
          <div className="col-span-4 text-start today-match-glass-content text-2xl font-bold break-words overflow-hidden">
            <div className="truncate" title={getTeamDisplayName(match.teamB)}>
              {getTeamDisplayName(match.teamB)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-background-mid)] to-[var(--color-primary)]">
        <div className="text-4xl font-bold text-white">
          Loading tournament courts data...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-background-mid)] to-[var(--color-primary)]">
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-background-mid)] to-[var(--color-primary)]">
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
        <div className="relative z-10    items-center justify-center min-h-screen">
          <div className="w-full">
            {/* Header with logos */}
            <Header />
            <div className="p-[50px] pt-[20px] pb-[120px] grid grid-cols-1 gap-6 items-center">
              <div className="col-span-1 text-center">
                <div className="inline-block bg-[var(--color-accent)] text-[var(--color-accent-text)] text-4xl font-bold mt-[-20px] mb-2 px-8 py-3 rounded-lg">
                  HAPPENING NOW
                </div>
              </div>

              {/* Dynamic Courts Rendering */}
              {tournamentData.courts.map((court, index) => (
                <div
                  key={court.courtId || index}
                  className="grid grid-cols-11 gap-4 items-center rounded-xl px-4 py-3"
                >
                  <div className="col-span-3 text-center">
                    <h2 className="text-4xl text-[var(--color-accent-text)] bg-[var(--color-accent)] py-2 px-3 mr-[70px] rounded-lg font-bold break-words overflow-hidden">
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
          {images.sponsor1 && (
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-white overflow-hidden">
              <SponsorMarquee
                sponsor1={images.sponsor1}
                sponsor2={images.sponsor2}
              />
            </div>
          )}

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
