import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { TournamentMatchPlayStatusEnum } from "../const/appConstant";
import moment from "moment-timezone";
import Header from "../components/layout/header";
import { ImageConstants } from "../assets/images/ImageConstants";
import { umpireAPI } from "../umpireScoring/services/umpireAPI";

// Configuration constants
const MAX_MATCHES_DISPLAY = 5; // Maximum number of matches to display per court
const AUTO_REFETCH_INTERVAL_MS = 300000; // Auto-refetch interval: 5 minutes (300000 ms)

// Mock data - replaced with API call
/* const MOCK_DATA = {
  status: 1,
  message: "Umpire tournament courts schedule (24-hour range) retrieved successfully",
  data: {
    masterTournamentId: 47,
    timeRange: {
      startTime: "2026-01-30T03:19:22.5654435Z",
      endTime: "2026-01-31T03:19:22.5654435Z",
      currentTime: "2026-01-30T15:19:22.5654435Z",
    },
    totalCourts: 6,
    courts: [
      {
        courtId: 64,
        courtName: "Court 1",
        matches: [],
        totalMatches: 0,
      },
      {
        courtId: 65,
        courtName: "Court 2",
        matches: [
          {
            id: 4282,
            tournamentId: 168,
            matchStartDateTime: "2026-01-30T19:00:00",
            matchEndDateTime: null,
            stageType: 2,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 168,
              isTeamOnly: true,
            },
            teamA: {
              id: 2245,
              teamName: "M.Zohaib & Shehryar ",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2244,
              teamName: "M.Sohail & Ahrar ",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4276,
            tournamentId: 165,
            matchStartDateTime: "2026-01-30T20:00:00",
            matchEndDateTime: null,
            stageType: 2,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 165,
              isTeamOnly: true,
            },
            teamA: {
              id: 2215,
              teamName: "Haris & Azfar",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2223,
              teamName: "Asher & Mahd",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4278,
            tournamentId: 166,
            matchStartDateTime: "2026-01-30T21:00:00",
            matchEndDateTime: null,
            stageType: 3,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 166,
              isTeamOnly: true,
            },
            teamA: {
              id: 2205,
              teamName: "Asma & Anam",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2208,
              teamName: "Abiya & Alberthe",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
        ],
        totalMatches: 3,
      },
      {
        courtId: 66,
        courtName: "Court 3",
        matches: [
          {
            id: 4258,
            tournamentId: 164,
            matchStartDateTime: "2026-01-30T18:00:00",
            matchEndDateTime: null,
            stageType: 5,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 164,
              isTeamOnly: true,
            },
            teamA: {
              id: 2195,
              teamName: "Asma & Danish",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2199,
              teamName: "M. Salar & Tanya",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4283,
            tournamentId: 168,
            matchStartDateTime: "2026-01-30T19:00:00",
            matchEndDateTime: null,
            stageType: 2,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 168,
              isTeamOnly: true,
            },
            teamA: {
              id: 2237,
              teamName: "Usman & A.Wahab",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2242,
              teamName: "Nadeem & Usman ",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4277,
            tournamentId: 165,
            matchStartDateTime: "2026-01-30T20:00:00",
            matchEndDateTime: null,
            stageType: 2,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 165,
              isTeamOnly: true,
            },
            teamA: {
              id: 2218,
              teamName: "A. Basit & Danish",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2214,
              teamName: "Bashar & M. Umair",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
        ],
        totalMatches: 3,
      },
      {
        courtId: 67,
        courtName: "Court 4",
        matches: [
          {
            id: 4259,
            tournamentId: 164,
            matchStartDateTime: "2026-01-30T18:00:00",
            matchEndDateTime: null,
            stageType: 5,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 164,
              isTeamOnly: true,
            },
            teamA: {
              id: 2200,
              teamName: "Huzaifa & Meerab",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2196,
              teamName: "M. Shamael & Saira",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
        ],
        totalMatches: 1,
      },
      {
        courtId: 182,
        courtName: "Court 5",
        matches: [
          {
            id: 4257,
            tournamentId: 164,
            matchStartDateTime: "2026-01-30T18:00:00",
            matchEndDateTime: null,
            stageType: 5,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 164,
              isTeamOnly: true,
            },
            teamA: {
              id: 2197,
              teamName: "Zoha & Zubair",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2194,
              teamName: "Shahzad & Samia",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4281,
            tournamentId: 168,
            matchStartDateTime: "2026-01-30T19:00:00",
            matchEndDateTime: null,
            stageType: 2,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 168,
              isTeamOnly: true,
            },
            teamA: {
              id: 2243,
              teamName: "Taha & Saad ",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2231,
              teamName: "Usman & Saad ",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4275,
            tournamentId: 165,
            matchStartDateTime: "2026-01-30T20:00:00",
            matchEndDateTime: null,
            stageType: 2,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 165,
              isTeamOnly: true,
            },
            teamA: {
              id: 2220,
              teamName: "M. Sadiq & Zubair",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2216,
              teamName: "M. Abdullah & Murtaza",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4279,
            tournamentId: 166,
            matchStartDateTime: "2026-01-30T21:00:00",
            matchEndDateTime: null,
            stageType: 3,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 166,
              isTeamOnly: true,
            },
            teamA: {
              id: 2212,
              teamName: "Fatima & Shehrazade",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2206,
              teamName: "Minhal & Anum",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4229,
            tournamentId: 167,
            matchStartDateTime: "2026-01-30T22:00:00",
            matchEndDateTime: null,
            stageType: 5,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 167,
              isTeamOnly: true,
            },
            teamA: {
              id: 2204,
              teamName: "Maryam & Nabeel",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2201,
              teamName: "Samad & Padmini",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
        ],
        totalMatches: 5,
      },
      {
        courtId: 247,
        courtName: "Premier Court ",
        matches: [
          {
            id: 4256,
            tournamentId: 164,
            matchStartDateTime: "2026-01-30T18:00:00",
            matchEndDateTime: null,
            stageType: 5,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 164,
              isTeamOnly: true,
            },
            teamA: {
              id: 2193,
              teamName: "Shakir & Kieatsupa",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2198,
              teamName: "Pol & Aleesha",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4280,
            tournamentId: 168,
            matchStartDateTime: "2026-01-30T19:00:00",
            matchEndDateTime: null,
            stageType: 2,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 168,
              isTeamOnly: true,
            },
            teamA: {
              id: 2224,
              teamName: "M.Ammad & Kumail",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2238,
              teamName: "Ali & Ahsan ",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4236,
            tournamentId: 165,
            matchStartDateTime: "2026-01-30T20:00:00",
            matchEndDateTime: null,
            stageType: 2,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 165,
              isTeamOnly: true,
            },
            teamA: {
              id: 2213,
              teamName: "Ibrahim & Raffay",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2221,
              teamName: "Samad & Naffay",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
          {
            id: 4228,
            tournamentId: 167,
            matchStartDateTime: "2026-01-30T22:00:00",
            matchEndDateTime: null,
            stageType: 5,
            matchResult: null,
            isResultUploaded: false,
            isPlayed: false,
            playStatus: null,
            playstatus_completed_on: null,
            results: null,
            group: null,
            tournament: {
              id: 167,
              isTeamOnly: true,
            },
            teamA: {
              id: 2203,
              teamName: "Javeria & M. Qasim",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
            teamB: {
              id: 2202,
              teamName: "Murtaza & Alberthe",
              logo: null,
              players: [
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
                {
                  playerId: 11996,
                  playerName: "Guest ",
                },
              ],
            },
          },
        ],
        totalMatches: 4,
      },
    ],
  },
};
*/

// Single Court Schedule Table Component
const CourtScheduleTable = ({ courtData, currentTime }) => {
  if (!courtData) return null;

  const { courtName, matches } = courtData;

  // Filter matches to show only upcoming and live matches
  const filteredMatches = matches.filter((match) => {
    const matchStartTime = moment.tz(match.matchStartDateTime, "Asia/Karachi");
    const isUpcoming = matchStartTime.isAfter(currentTime);
    const isLive =
      match.playStatus === TournamentMatchPlayStatusEnum.live ||
      match.playStatus === TournamentMatchPlayStatusEnum.inProgress;
    return isUpcoming || isLive;
  });

  // Sort matches by start time
  const sortedMatches = [...filteredMatches].sort(
    (a, b) => new Date(a.matchStartDateTime) - new Date(b.matchStartDateTime)
  );

  // Limit displayed matches to MAX_MATCHES_DISPLAY
  const displayedMatches = sortedMatches.slice(0, MAX_MATCHES_DISPLAY);
  const totalMatchesCount = sortedMatches.length;

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    return moment.tz(dateTimeString, "Asia/Karachi").format("HH:mm");
  };

  const getTeamName = (team) => {
    return team?.teamName || team?.name || "TBA";
  };

  const isLiveMatch = (match) => {
    return (
      match.playStatus === TournamentMatchPlayStatusEnum.live ||
      match.playStatus === TournamentMatchPlayStatusEnum.inProgress
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
      {/* Court Header */}
      <div className="bg-[#A8CE08] text-white py-4 px-6">
        <h2 className="text-3xl font-bold text-center">{courtName}</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#003184] text-white">
              <th className="py-3 px-4 text-left font-bold text-lg">Time</th>
              <th className="py-3 px-4 text-left font-bold text-lg">Match</th>
              <th className="py-3 px-4 text-center font-bold text-lg">
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedMatches.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  className="py-8 px-4 text-center text-gray-500 text-lg"
                >
                  No upcoming matches
                </td>
              </tr>
            ) : (
              displayedMatches.map((match, index) => (
                <tr
                  key={match.id}
                  className={`border-b border-gray-200 ${
                    isLiveMatch(match)
                      ? "bg-[#0caced] bg-opacity-20 animate-pulse"
                      : index % 2 === 0
                      ? "bg-gray-50"
                      : "bg-white"
                  } hover:bg-gray-100 transition-colors`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-[#003184]" />
                      <span className="font-bold text-[#003184] text-lg">
                        {formatTime(match.matchStartDateTime)}
                      </span>
                      {isLiveMatch(match) && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-lg text-gray-800">
                      <span className="text-[#003184]">
                        {getTeamName(match.teamA)}
                      </span>
                      <span className="mx-2 text-gray-500">vs</span>
                      <span className="text-[#003184]">
                        {getTeamName(match.teamB)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block bg-[#A8CE08] text-white px-3 py-1 rounded-full font-bold text-sm">
                      {match.tournamentName}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with match count */}
      {totalMatchesCount > 0 && (
        <div className="bg-gray-100 py-2 px-6 text-center text-sm text-gray-600">
          {totalMatchesCount > MAX_MATCHES_DISPLAY ? (
            <>
              Showing{" "}
              <span className="font-bold">{displayedMatches.length}</span> of{" "}
              <span className="font-bold">{totalMatchesCount}</span> matches
            </>
          ) : (
            <>
              Total Matches:{" "}
              <span className="font-bold">{totalMatchesCount}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Main Multi-Court Schedule Component
const MultiCourtSchedule = () => {
  const [searchParams] = useSearchParams();
  const masterTournamentId = searchParams.get("masterTournamentId");
  const courtIdsParam = searchParams.get("courtId");

  const [courtsData, setCourtsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment().tz("Asia/Karachi"));
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Update current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().tz("Asia/Karachi"));
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Load data from API
  const fetchCourtsSchedule = useCallback(
    async (showLoader = true) => {
      // Validate required parameters
      if (!masterTournamentId) {
        setError("Master Tournament ID is required");
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      try {
        // Parse comma-separated court IDs and convert to numbers
        const courtIdsArray = courtIdsParam
          ? courtIdsParam
              .split(",")
              .map((id) => parseInt(id.trim()))
              .filter((id) => !isNaN(id))
          : [];

        // Convert masterTournamentId to number
        const masterTournamentIdNum = parseInt(masterTournamentId);

        if (isNaN(masterTournamentIdNum)) {
          throw new Error("Invalid Master Tournament ID");
        }

        // Call API
        const response = await umpireAPI.getCourtsSchedule24HoursByCourt(
          masterTournamentIdNum,
          courtIdsArray
        );

        if (response.success && response.data?.courts) {
          setCourtsData(response.data.courts);
          setError(null);
          // Mark initial load as complete after first successful load
          setIsInitialLoad((prev) => {
            if (prev) {
              return false;
            }
            return prev;
          });
        } else {
          throw new Error(response.error || "No court data found");
        }
      } catch (err) {
        console.error("Error fetching courts schedule:", err);
        setError(err.message || "Failed to fetch courts schedule");
        setCourtsData([]);
        // Mark initial load as complete even on error to prevent infinite loading
        setIsInitialLoad((prev) => {
          if (prev) {
            return false;
          }
          return prev;
        });
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [masterTournamentId, courtIdsParam]
  );

  // Initial load on mount or when params change
  useEffect(() => {
    setIsInitialLoad(true);
    fetchCourtsSchedule(true);
  }, [masterTournamentId, courtIdsParam, fetchCourtsSchedule]);

  // Auto-refetch interval
  useEffect(() => {
    // Only set up auto-refetch after initial load is complete
    if (!isInitialLoad) {
      const intervalId = setInterval(() => {
        fetchCourtsSchedule(false); // Silent refresh without loader
      }, AUTO_REFETCH_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }
  }, [isInitialLoad, fetchCourtsSchedule]);

  // Determine grid layout based on number of courts
  const getGridLayout = () => {
    if (courtsData.length === 1) return "grid-cols-1";
    if (courtsData.length === 2) return "grid-cols-1 lg:grid-cols-2";
    if (courtsData.length >= 3)
      return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3";
    return "grid-cols-1";
  };

  if (!masterTournamentId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#093337] via-[#003184] to-[#093337]">
        <div className="text-4xl font-bold text-white">
          Master Tournament ID is required
        </div>
      </div>
    );
  }

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

      {/* Header */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container-fluid mx-auto px-4 py-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-white mb-2">Court Schedule</h1>
          <p className="text-xl text-gray-300">
            {currentTime.format("dddd, MMMM D, YYYY - HH:mm")}
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-2xl font-bold text-white">
              Loading schedules...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-2xl font-bold text-red-400">
              Error: {error}
            </div>
          </div>
        )}

        {/* Courts Grid */}
        {!loading && !error && courtsData.length > 0 && (
          <div className={`grid ${getGridLayout()} gap-6`}>
            {courtsData.map((court, index) => (
              <motion.div
                key={court.courtId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CourtScheduleTable
                  courtData={court}
                  currentTime={currentTime}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* No Courts Found */}
        {!loading && !error && courtsData.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-2xl font-bold text-gray-400">
              No courts found for the selected criteria
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
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

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white overflow-hidden">
        <div className="marquee-wrapper">
          <div className="marquee-content-scroll">
            <img
              src={ImageConstants.sponsor2}
              alt="Sponsor"
              className="marquee-image"
            />
            <img
              src={ImageConstants.sponsor1}
              alt="Sponsor"
              className="marquee-image"
            />
            <img
              src={ImageConstants.sponsor2}
              alt="Sponsor"
              className="marquee-image"
            />
            <img
              src={ImageConstants.sponsor1}
              alt="Sponsor"
              className="marquee-image"
            />
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

export default MultiCourtSchedule;
