import { motion } from "framer-motion";
import { ImageConstants } from "../assets/images/ImageConstants";
import LogoFlipBox from "../components/logoFlipBox";
import Common from "../helper/common";
import { useEffect, useRef, useState } from "react";
import moment from "moment-timezone";
import Header from "./sections/header";
import Footer from "./sections/footer";

const matches = [
  {
    date: "5 APRIL 2025",
    time: "16:00 - 16:40",
    teams: ["Aleesha & Zain", "Hamza & Jackie"],
    court: "Galaxy 1",
    group: "U13",
  },
  {
    date: "5 APRIL 2025",
    time: "16:00 - 16:40",
    teams: ["Sameer & Natasha", "Sarah & Durrani"],
    court: "Galaxy 2",
    group: "U13",
  },
  {
    date: "5 APRIL 2025",
    time: "16:00 - 16:40",
    teams: ["Neha & Talha", "Saira & Umer"],
    court: "Galaxy 3",
    group: "Women B",
  },
  {
    date: "5 APRIL 2025",
    time: "16:00 - 16:40",
    teams: ["Zaid & Asma", "Shamael & Samia"],
    court: "Galaxy 4",
    group: "Women B",
  },

  {
    date: "5 APRIL 2025",
    time: "16:00 - 16:40",
    teams: ["Farhan & Abdul", "Ahmed & Athar"],
    court: "Black Star 1",
    group: "Women B+",
  },
  {
    date: "5 APRIL 2025",
    time: "16:00 - 16:40",
    teams: ["Zain & Asim", "Ali & Abdullah"],
    court: "Black Star 2",
    group: "Women B+",
  },
  {
    date: "5 APRIL 2025",
    time: "16:00 - 16:40",
    teams: ["Syed & Agha", "Immar & Moeed"],
    court: "Infinity",
    group: "Men B",
  },
];
const now = moment().tz("Asia/Karachi");

const marqueeVariants = {
  animate: {
    x: ["100%", "-100%"],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 40,
        ease: "linear",
        delay: 0,
        onComplete: () => {
          // Reset to starting position when animation completes
          return { x: "100%" };
        },
      },
    },
  },
};

const TimeTable = () => {
  const isLoaded = useRef(false);
  const [matchesByCourt, setMatchesByCourt] = useState({});
  const [rawMatches, setRawMatches] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  // Separate the display time from the processing time
  const [displayTime, setDisplayTime] = useState(moment().tz("Asia/Karachi"));
  const [currentTime, setCurrentTime] = useState(moment().tz("Asia/Karachi"));

  // Update display time every second for the live clock
  useEffect(() => {
    const displayTimer = setInterval(() => {
      setDisplayTime(moment().tz("Asia/Karachi"));
    }, 1000); // Update every second for smooth clock display

    return () => clearInterval(displayTimer);
  }, []);

  // Update processing time every 30 seconds
  useEffect(() => {
    const processingTimer = setInterval(() => {
      console.log("Updating current time for processing");
      setCurrentTime(moment().tz("Asia/Karachi"));
    }, 120000); // Update every 2 minutes for data processing

    return () => clearInterval(processingTimer);
  }, []);

  useEffect(() => {
    if (!isLoaded.current) {
      getTournamentScheduleMatches();
      isLoaded.current = true;
      console.log("Initial data fetch completed");
    }

    // Set up periodic data refresh every minute
    // const dataRefreshInterval = setInterval(() => {
    //   console.log("Timer triggered - attempting to fetch new data");
    //   getTournamentScheduleMatches(); // Fetch fresh data every minute
    // }, 60 * 1000); // Changed to 60 seconds (1 minute)

    // Clean up interval on component unmount
    return () => {
      console.log("Clearing data refresh interval");
      clearInterval(dataRefreshInterval);
    };
  }, []);

  // Modified getTournamentScheduleMatches function with logging
  const getTournamentScheduleMatches = async () => {
    console.log(
      "getTournamentScheduleMatches called at:",
      new Date().toISOString()
    );
    try {
      var res = await Common.ApiService.getInstance().request(
        "GetTournamentScheduleMatches",
        {
          // tournamentIds: [6, 7, 8, 9, 10, 11, 12, 13, 14],
          tournamentIds: [67],
          playStatus: null,
        },
        "POST"
      );

      console.log("API response received:", res ? "Success" : "Failed");

      if (res && res.data && res.data.length > 0) {
        console.log(`Received ${res.data.length} matches from API`);
        // Store raw matches in state
        setRawMatches(res.data);
        // Process matches immediately
        processMatches(res.data);
        console.log("Data processing complete");
      } else {
        console.warn("API returned empty or invalid data:", res);
      }
    } catch (error) {
      console.error("Error fetching tournament schedule:", error);
    }
  };

  // Format date and time for display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";

    // Use moment-timezone to handle dates in a specific timezone
    const date = moment.tz(dateTimeString, "Asia/Karachi");
    const day = date.date();
    const month = date.format("MMM").toUpperCase();
    const year = date.year();
    const hours = date.format("HH");
    const minutes = date.format("mm");

    return `${day} ${month} ${year} | ${hours}:${minutes}`;
  };

  // Function to process matches and group them
  const processMatches = (matches) => {
    if (!matches || matches.length === 0) return;

    console.log("Processing matches at:", currentTime.format("HH:mm:ss"));

    // Group matches by court name
    const matchesByCourt = {};

    // Sort matches by startDateTime
    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
    );

    // Get current date and time in the specified timezone
    // IMPORTANT: Use currentTime state instead of creating a new moment object
    // This ensures the function uses fresh time when it runs
    const now = currentTime;
    console.log("Current time used for processing:", now.format());

    // Group matches by court name
    sortedMatches.forEach((match) => {
      if (!matchesByCourt[match.courtName]) {
        matchesByCourt[match.courtName] = [];
      }
      matchesByCourt[match.courtName].push(match);
    });

    // For each court, find current and next match
    const currentAndNextMatches = {};

    Object.keys(matchesByCourt).forEach((courtName) => {
      const courtMatches = matchesByCourt[courtName];
      console.log(`Processing court: ${courtName}`);
      console.log(`Total matches for this court: ${courtMatches.length}`);

      // Sort matches by start time for this court
      const sortedCourtMatches = [...courtMatches].sort(
        (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
      );

      // Find current match (now is between startDateTime and endDateTime)
      const currentMatchIndex = sortedCourtMatches.findIndex((match) => {
        const startTime = moment.tz(match.startDateTime, "Asia/Karachi");
        const endTime = moment
          .tz(match.startDateTime, "Asia/Karachi")
          .add(40, "minutes");
        //TODO: Remove this
        const isCurrent = now.isBetween(startTime, endTime, null, "[]");
        console.log(`Match ${match.teamAName} vs ${match.teamBName}:`, {
          startTime: startTime.format(),
          endTime: endTime.format(),
          isCurrent,
        });

        return isCurrent;
      });

      // Find all future matches
      const futureMatches = sortedCourtMatches.filter((match) =>
        moment.tz(match.startDateTime, "Asia/Karachi").isAfter(now)
      );

      console.log(`Future matches for ${courtName}:`, futureMatches.length);

      if (currentMatchIndex !== -1) {
        // Current match found
        const currentMatch = sortedCourtMatches[currentMatchIndex];
        console.log(`Current match found for ${courtName}:`, currentMatch);

        // Find the next match after the current match
        const nextMatch = futureMatches.find((match) =>
          moment
            .tz(match.startDateTime, "Asia/Karachi")
            .isAfter(moment.tz(currentMatch.startDateTime, "Asia/Karachi"))
        );

        console.log(`Next match for ${courtName}:`, nextMatch);

        currentAndNextMatches[courtName] = {
          current: currentMatch,
          next: nextMatch || null,
        };
      } else if (futureMatches.length > 0) {
        // No current match, but future matches exist
        console.log(
          `No current match for ${courtName}, using first future match`
        );

        // Always show the first upcoming match as "current" regardless of how many matches there are
        currentAndNextMatches[courtName] = {
          current: futureMatches[0],
          next: futureMatches.length > 1 ? futureMatches[1] : null,
        };
      } else {
        // No upcoming matches
        console.log(`No upcoming matches for ${courtName}`);
        currentAndNextMatches[courtName] = {
          current: null,
          next: null,
        };
      }
    });

    console.log("Final grouped matches:", currentAndNextMatches);

    // Ensure we create a completely new object reference
    const newCurrentAndNextMatches = { ...currentAndNextMatches };
    console.log("Setting new matchesByCourt:", newCurrentAndNextMatches);
    setMatchesByCourt(newCurrentAndNextMatches);
  };

  // Ensure processMatches runs whenever currentTime changes
  useEffect(() => {
    if (rawMatches.length > 0) {
      console.log("Running processMatches due to time change");
      processMatches(rawMatches);
    }
  }, [currentTime, rawMatches]);

  // Update lastUpdated whenever matchesByCourt changes
  useEffect(() => {
    setLastUpdated(new Date().toISOString());
    console.log(
      "UI should update - matchesByCourt changed:",
      Object.keys(matchesByCourt).length
    );
  }, [matchesByCourt]);

  return (
    <div className="min-h-screen">
      <div className="-mt-7 min-h-screen mx-auto text-white flex flex-col items-center pt-0 p-6">
        <Header displayTime={displayTime} />

        <div className="mt-5 w-full grid grid-cols-2 md:grid-cols-2 gap-5">
          {Object.keys(matchesByCourt)
            .filter((x) => matchesByCourt[x].current || matchesByCourt[x].next)
            .map((courtName, index, filteredArray) => {
              const { current, next } = matchesByCourt[courtName];

              // Force React to see this as a new component when data changes
              const key = `${courtName}-${current?.teamAName}-${current?.teamBName}-${next?.teamAName}-${next?.teamBName}-${lastUpdated}`;

              // Check if this is the last item and needs centering
              const isLastItem = index === filteredArray.length - 1;
              const needsCentering =
                filteredArray.length % 3 === 1 && isLastItem;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className={`bg-[#00084e] p-2 pt-3 rounded-2xl min-w-[650px] shadow-lg relative text-center ${
                    needsCentering ? "md:col-span-3 md:max-w-md md:mx-auto" : ""
                  }`}
                >
                  <h2 className="text-3xl absoluteXX top-3X mt-0 inset-x-0 font-bold text-[#fff] mb-4">
                    {courtName}
                  </h2>

                  <div className="space-y-4">
                    {/* Current Match */}
                    {current && (
                      <div className=" rounded-xl pb-0 pt-0 mb-8 p-4 relative">
                        {/* <p className="text-lg font-semibold mt-0 mb-2 flex justify-between">
                          <div
                            className={`${
                              moment
                                .tz(current.startDateTime, "Asia/Karachi")
                                .isSame(now, "day")
                                ? "bg-[#0caced]"
                                : "bg-[#ec5228]"
                            } text-white px-3 opacity-0 py-1 text-start rounded-full text-lg font-bold`}
                          >
                            {moment
                              .tz(current.startDateTime, "Asia/Karachi")
                              .isSame(now, "day")
                              ? "CURRENT MATCH"
                              : "UPCOMING MATCH"}
                          </div>{" "}
                          <div className="text-white px-0 py-1 rounded-full text-lg font-bold">
                            {formatDateTime(current.startDateTime)}
                          </div>
                        </p> */}
                        <div className="flex items-center justify-center text-xl font-bold">
                          <span className="bg-gray-200 text-purple-900 px-6 py-2 rounded-l-xl w-100">
                            {current.teamAName}
                          </span>
                          <span className="bg-[#003184] text-white px-6 py-2">
                            VS
                          </span>
                          <span className="bg-gray-200 text-purple-900 px-6 py-2 rounded-r-xl w-100">
                            {current.teamBName}
                          </span>
                        </div>
                        {moment
                          .tz(current.startDateTime, "Asia/Karachi")
                          .isSame(now, "day") && (
                          <div className="bg-[#0caced] absolute -bottom-5 inset-x-0 mx-auto text-white px-3 py-1 text-start rounded-full text-sm font-bold w-fit">
                            START TIME:{" "}
                            {moment
                              .tz(current.startDateTime, "Asia/Karachi")
                              .format("HH:mm")}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Next Match */}
                    {next && (
                      <div className=" srounded-xl p-4 pt-0 opacity-90">
                        <div className="flex items-center justify-center text-xl font-bold">
                          <span className="bg-gray-200 text-purple-900 px-6 py-2 rounded-l-xl w-100">
                            {moment
                              .tz(next.startDateTime, "Asia/Karachi")
                              .isSame(now, "day")
                              ? next.teamAName
                              : "TBA"}
                          </span>
                          <span className="bg-[#003184] text-white px-6 py-2">
                            VS
                          </span>
                          <span className="bg-gray-200 text-purple-900 px-6 py-2 rounded-r-xl w-100">
                            {moment
                              .tz(next.startDateTime, "Asia/Karachi")
                              .isSame(now, "day")
                              ? next.teamBName
                              : "TBA"}
                          </span>
                        </div>
                        {moment
                          .tz(next.startDateTime, "Asia/Karachi")
                          .isSame(now, "day") && (
                          <div className="bg-[#ec5228] absolute bottom-1 inset-x-0 mx-auto text-white px-3 py-1 text-start rounded-full text-sm font-bold w-fit">
                            NEXT&nbsp;MATCH:{" "}
                            {moment
                              .tz(next.startDateTime, "Asia/Karachi")
                              .format("HH:mm")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TimeTable;
