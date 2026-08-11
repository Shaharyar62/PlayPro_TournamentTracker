import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useSearchParams } from "react-router-dom";
import io from "socket.io-client";
import Common from "../../helper/common";
import moment from "moment-timezone";
import { TournamentRuleMatchFormatTypeEnum } from "../../const/Constants";
import MatchIdHelper from "../../umpireScoring/utils/matchIdHelper.js";
import { SERVER_URL } from "../../umpireScoring/utils/constants.js";
import { useScorebugSettings } from "../../hooks/useScorebugSettings.js";
import "./scorebug.css";
import ScorebugOverlay from "./ScorebugOverlay.jsx";

const StreamingLiveCourt = () => {
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const courtId = searchParams.get("courtId");
  const displayId = searchParams.get("displayId");
  useScorebugSettings({ displayId, listenOnly: true });
  // Optional: &vmix=1 or &opaque=1 for vMix Browser (solid bg). OBS URLs stay transparent.
  const isVmixMode =
    searchParams.get("vmix") === "1" || searchParams.get("opaque") === "1";

  // State management
  const [matchData, setMatchData] = useState(null);
  const [upcomingMatch, setUpcomingMatch] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayTime, setDisplayTime] = useState(moment().tz("Asia/Karachi"));
  const [liveMatchData, setLiveMatchData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showResetNotification, setShowResetNotification] = useState(false);

  const matchStatus = useRef();
  const socketRef = useRef(null);

  useEffect(() => {
    if (liveMatchData) {
      matchStatus.current = liveMatchData.status;
    }
  }, [liveMatchData]);

  const marqueeVariants = {
    animate: {
      x: ["0%", "-100%"],
      transition: {
        duration: 30,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  const getMatchFormat = () => {
    var matchFormat = liveMatchData?.matchSettings?.matchFormat;
    switch (matchFormat) {
      case TournamentRuleMatchFormatTypeEnum.raceToSix:
        return "Race to 8";
      case TournamentRuleMatchFormatTypeEnum.twoSetsSuperTieBreak:
        return "2 Sets - Super Tie Break";
      case TournamentRuleMatchFormatTypeEnum.threeSets:
        return "3 Sets";
    }
  };

  // WebSocket data handling

  // Function to fetch court match schedule
  const fetchCourtMatchSchedule = async () => {
    if (matchStatus.current && matchStatus.current !== "completed") {
      return;
    }
    console.log("Fetching court match schedule");
    if (!tournamentId || !courtId) {
      setError("Tournament ID and Court ID are required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get current UTC time + 5 hours
      const currentDateTime = Common.Utility.GetCurrentDateTime(5);

      const response = await Common.ApiService.getInstance().request(
        `GetMasterTournamentMatchScheduleByCourt?masterTournamentId=${tournamentId}&courtId=${courtId}`,
      );

      if (response?.data) {
        setUpcomingMatch(response.data.upcomingMatch);
        var currentMatch = response.data.currentMatch;
        setMatchData(currentMatch);

        // Always try to set up WebSocket connection for any current match
        if (currentMatch) {
          console.log("Setting up WebSocket for current match:", currentMatch);
          console.log(
            "Match ID:",
            currentMatch.id,
            "Type:",
            typeof currentMatch.id,
          );
          console.log(
            "Tournament ID:",
            tournamentId,
            "Type:",
            typeof tournamentId,
          );
          setupWebSocketConnection(currentMatch);
        } else {
          console.log("No current match found");
          setLiveMatchData(null);
        }

        setError(null);
      } else {
        setError("No match data found");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch match data");
    } finally {
      setLoading(false);
    }
  };

  // Function to setup WebSocket connection
  const setupWebSocketConnection = (currentMatch) => {
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // websocket first, polling fallback (helps older CEF / vMix Browser)
    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
      // Keep API scoreboard visible — do not blank overlay if match already loaded
      if (!currentMatch) {
        setError("Failed to connect to live match server");
      }
    });

    // Prefix match and tournament IDs for environment separation
    const prefixedMatchId = MatchIdHelper.prefixMatchId(currentMatch.id);
    const prefixedTournamentId = MatchIdHelper.prefixTournamentId(tournamentId);

    // Listen for match updates
    socket.on(`match_update_${prefixedMatchId}`, (data) => {
      console.log("Match update received:", data);
      // Filter by environment - ignore matches from other environments
      if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
        console.log("Ignoring match update from different environment");
        return; // Ignore matches from other environment
      }
      matchStatus.current = data.status;
      setLiveMatchData(data);
    });

    // Listen for reset events
    socket.on(`match_reset_${prefixedMatchId}`, (data) => {
      console.log("Match reset received:", data);
      // Filter by environment - ignore matches from other environments
      if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
        console.log("Ignoring match reset from different environment");
        return; // Ignore matches from other environment
      }
      setLiveMatchData(data);
      setShowResetNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowResetNotification(false), 3000);
    });

    // Listen for tournament updates
    socket.on(`tournament_update_${prefixedTournamentId}`, (data) => {
      console.log("Tournament update received:", data);
      // Filter by environment - ignore tournaments from other environments
      if (
        data.tournamentId &&
        !MatchIdHelper.isMatchForCurrentEnv(data.tournamentId)
      ) {
        console.log("Ignoring tournament update from different environment");
        return; // Ignore tournaments from other environment
      }
    });

    // Request initial match state
    const matchStateRequest = {
      tournamentId: prefixedTournamentId,
      matchId: prefixedMatchId,
    };
    console.log("Requesting match state with:", matchStateRequest);
    socket.emit("get_match_state", matchStateRequest);

    // Set a timeout to use API data if no response from server
    const fallbackTimeout = setTimeout(() => {
      console.log("Timeout waiting for match state, using API data");
      setLiveMatchData(currentMatch);
    }, 5000); // 5 second timeout

    // Handle match state response
    socket.on("get_match_state_response", (data) => {
      console.log("Match state response received:", data);
      clearTimeout(fallbackTimeout); // Clear timeout since we got a response

      if (data) {
        // Filter by environment - ignore matches from other environments
        if (data.matchId && !MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
          console.log(
            "Ignoring match state response from different environment",
          );
          // Use API data as fallback when response is from different environment
          setLiveMatchData(currentMatch);
          return;
        }
        matchStatus.current = data.status;
        setLiveMatchData(data);
      } else {
        console.log("No match state from server, using API data as fallback");
        // Use API data as fallback when server doesn't have the match
        setLiveMatchData(currentMatch);
      }
    });
  };

  // Initial fetch and setup interval
  useEffect(() => {
    let intervalId;

    const setupDataFetching = async () => {
      await fetchCourtMatchSchedule();

      // Set up 10-minute interval for schedule updates
      intervalId = setInterval(async () => {
        await fetchCourtMatchSchedule();
      }, 30000); // 30 seconds
    };

    setupDataFetching();

    return () => {
      if (intervalId) clearInterval(intervalId);
      // Cleanup WebSocket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [tournamentId, courtId]);

  // Update display time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(moment().tz("Asia/Karachi"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // OBS: transparent. vMix (&vmix=1 / &opaque=1): solid white only — no other routes affected.
  useEffect(() => {
    const bg = isVmixMode ? "#ffffff" : "transparent";
    document.body.style.background = bg;
    document.body.style.backgroundColor = bg;
    document.documentElement.style.background = bg;
    document.documentElement.style.backgroundColor = bg;

    const root = document.getElementById("root");
    if (root) {
      root.style.background = bg;
      root.style.backgroundColor = bg;
    }

    return () => {
      document.body.style.background = "";
      document.body.style.backgroundColor = "";
      document.documentElement.style.background = "";
      document.documentElement.style.backgroundColor = "";
      if (root) {
        root.style.background = "";
        root.style.backgroundColor = "";
      }
    };
  }, [isVmixMode]);

  // Transparent-strip logic is OBS-only. Skip entirely for vMix so score box bg stays visible.
  useLayoutEffect(() => {
    if (isVmixMode) return;

    const BODY_CLASS = "route-clean-remove-bg";
    const STYLE_ID = "route-clean-remove-bg-style";

    let whitelistCSS = "";

    const css = `
      /* Scope to the body class so other pages are unaffected */
      .${BODY_CLASS}, .${BODY_CLASS}  {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }

      /* Make sure pseudo-elements are covered */
      .${BODY_CLASS} ::before,
      .${BODY_CLASS} ::after {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        content: inherit !important; /* keep content but transparent background */
      }

      /* Also cover html/body themselves */
      html.${BODY_CLASS}, body {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }


      ${whitelistCSS}
    `;

    // Insert stylesheet
    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.appendChild(document.createTextNode(css));
    document.head.appendChild(styleEl);

    // Add class to body to scope overrides to this route/page
    document.body.classList.add(BODY_CLASS);

    // MutationObserver to strip inline backgrounds (including those set with !important)
    const stripBackgroundFromElement = (el) => {
      if (!el || !el.style) return;
      if (
        el.classList?.contains("scorebug-panel") ||
        el.classList?.contains("scorebug-footer") ||
        el.closest?.(".scorebug-bar")
      ) {
        return;
      }
      try {
        // remove the properties (works even if they were set !important)
        el.style.removeProperty("background");
        el.style.removeProperty("background-image");
        el.style.removeProperty("background-color");
        el.style.removeProperty("background-repeat");
        el.style.removeProperty("background-position");
        el.style.removeProperty("background-size");
        // also clear shorthand if present
        // (this helps when inline cssText contains "background: red !important")
      } catch (e) {
        // ignore if element.style is readonly for some node types
      }
    };

    const observer = new MutationObserver((mutationsList) => {
      for (const m of mutationsList) {
        if (
          m.type === "attributes" &&
          m.attributeName === "style" &&
          m.target
        ) {
          stripBackgroundFromElement(m.target);
        }
        if (m.type === "childList") {
          // For added nodes, remove inline background if any and also observe children
          m.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            // remove inline background from the added element and its subtree
            node.querySelectorAll
              ? node.querySelectorAll("*").forEach(stripBackgroundFromElement)
              : null;
            stripBackgroundFromElement(node);
          });
        }
      }
    });

    // start observing the whole document body for inline style changes and DOM additions
    observer.observe(document.documentElement || document.body, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
      childList: true,
    });

    // Also proactively remove inline background styles that already exist
    try {
      document
        .querySelectorAll("*")
        .forEach((el) => stripBackgroundFromElement(el));
    } catch (e) {
      // ignore any rare Node types that throw
    }

    // Cleanup on unmount (leaving the page)
    return () => {
      observer.disconnect();
      document.body.classList.remove(BODY_CLASS);
      const existing = document.getElementById(STYLE_ID);
      if (existing) existing.remove();
    };
  }, [isVmixMode]);

  // Loading state
  if (loading) {
    return (
      <p
        style={{
          all: "unset",
          display: "revert",
          boxSizing: "border-box",
        }}
      >
        Loading matceh data...
      </p>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <div className="text-4xl font-bold text-red-600 bg-white px-8 py-4 rounded-lg shadow-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  // No match data
  if (!liveMatchData && !matchData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <div className="text-4xl font-bold text-gray-600 bg-white px-8 py-4 rounded-lg shadow-lg">
          No match data available
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="obs-streaming-container">
        {showResetNotification && (
          <div className="scorebug-reset-toast">Match reset</div>
        )}

        <div className="scorebug-stage">
          <ScorebugOverlay matchData={matchData} liveMatchData={liveMatchData} />
        </div>

        <style>{`
          body {
            background: ${isVmixMode ? "#ffffff" : "transparent"} !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          html {
            background: ${isVmixMode ? "#ffffff" : "transparent"} !important;
          }

          #root {
            background: ${isVmixMode ? "#ffffff" : "transparent"} !important;
          }

          .obs-streaming-container {
            background: ${isVmixMode ? "#ffffff" : "transparent"} !important;
          }
        `}</style>
      </div>
    </>
  );
};

export default StreamingLiveCourt;
