import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { listenToSpecificMatch } from "../../services/FirebaseService";

const Scoreboard = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();

  // Support both URL parameters and query parameters
  const tournamentId = params.tournamentId || searchParams.get("tournamentId");
  const matchId = params.matchId || searchParams.get("matchId");

  const [data, setData] = useState({
    teamA: "ALLAWALA",
    teamB: "TEAM ISLAMABAD",
    scoreA: [0, 6, 6, 3],
    scoreB: [15, 2, 2, 0],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to map Firebase data to scorebar format
  const mapFirebaseToScorebarData = (firebaseMatch) => {
    if (!firebaseMatch) return null;

    const team1Name =
      firebaseMatch.team1?.players?.map((p) => p.name).join(" & ") || "TEAM 1";
    const team2Name =
      firebaseMatch.team2?.players?.map((p) => p.name).join(" & ") || "TEAM 2";

    // Create score arrays for sets, games, and current score
    // Format: [Set1, Set2, Set3, CurrentScore]
    const scoreA = [
      firebaseMatch.team1?.sets || 0,
      0, // Set 2 placeholder
      0, // Set 3 placeholder
      firebaseMatch.team1?.score || 0,
    ];

    const scoreB = [
      firebaseMatch.team2?.sets || 0,
      0, // Set 2 placeholder
      0, // Set 3 placeholder
      firebaseMatch.team2?.score || 0,
    ];

    return {
      teamA: team1Name.toUpperCase(),
      teamB: team2Name.toUpperCase(),
      scoreA,
      scoreB,
    };
  };

  // Real-time Firebase listener
  useEffect(() => {
    if (!tournamentId || !matchId) {
      setError("Tournament ID and Match ID are required");
      setLoading(false);
      return;
    }

    const unsubscribe = listenToSpecificMatch(
      tournamentId,
      matchId,
      (firebaseMatch) => {
        if (firebaseMatch) {
          const scorebarData = mapFirebaseToScorebarData(firebaseMatch);
          if (scorebarData) {
            setData(scorebarData);
          }
          setError(null);
        } else {
          setError("Match not found");
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tournamentId, matchId]);

  // Show loading state
  if (loading) {
    return (
      <div className="transform-gpu" style={{ float: "left" }}>
        <div className="w-[400px] bg-gray-800 text-white p-4 text-center">
          Loading match data...
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="transform-gpu" style={{ float: "left" }}>
        <div className="w-[400px] bg-red-800 text-white p-4 text-center">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="transform-gpu" style={{ float: "left" }}>
      <div
        className="w-[400px]"
        style={{
          transform: "  ",
          boxShadow: `
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 10px 20px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.8)
          `,
        }}
      >
        {/* Team A Row */}
        <div className="flex">
          <div
            className="px-8 text-sm py-2 w-64 flex items-center font-bold  tracking-wide text-white relative"
            style={{
              background: "linear-gradient(145deg, #2a2a2a, #000000)",
              boxShadow: `
                inset 3px 3px 6px rgba(80, 80, 80, 0.3),
                inset -3px -3px 6px rgba(0, 0, 0, 0.8)
              `,
            }}
          >
            {data.teamA}
            {/* 3D depth edge */}
            <div
              className="absolute -bottom-1 -right-1 w-full h-full bg-black -z-10"
              style={{ transform: "translate(2px, 2px)" }}
            ></div>
          </div>

          {data.scoreA.map((score, index) => (
            <div
              key={index}
              className="w-16 h-16 flex items-center justify-center font-bold text-xl text-white relative"
              style={{
                background: "linear-gradient(145deg, #3b82f6, #1d4ed8)",
                boxShadow: `
                  inset 2px 2px 4px rgba(96, 165, 250, 0.4),
                  inset -2px -2px 4px rgba(29, 78, 216, 0.8),
                  0 4px 8px rgba(0, 0, 0, 0.3)
                `,
              }}
            >
              {score}
              {/* 3D depth edge */}
              <div
                className="absolute -bottom-1 -right-1 w-full h-full bg-blue-800 -z-10"
                style={{ transform: "translate(2px, 2px)" }}
              ></div>
            </div>
          ))}
        </div>

        {/* Team B Row */}
        <div className="flex">
          <div
            className="px-8 py-4 w-64 flex items-center font-bold text-sm tracking-wide text-white relative"
            style={{
              background: "linear-gradient(145deg, #2a2a2a, #000000)",
              boxShadow: `
                inset 3px 3px 6px rgba(80, 80, 80, 0.3),
                inset -3px -3px 6px rgba(0, 0, 0, 0.8)
              `,
            }}
          >
            {data.teamB}

            {/* White arrow */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full">
              <div
                className="w-0 h-0 relative"
                style={{
                  borderLeft: "20px solid white",
                  borderTop: "15px solid transparent",
                  borderBottom: "15px solid transparent",
                  filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.4))",
                }}
              >
                {/* Arrow 3D depth */}
                <div
                  className="absolute w-0 h-0 -z-10"
                  style={{
                    borderLeft: "20px solid #e5e5e5",
                    borderTop: "15px solid transparent",
                    borderBottom: "15px solid transparent",
                    left: "2px",
                    top: "-13px",
                  }}
                ></div>
              </div>
            </div>

            {/* 3D depth edge */}
            <div
              className="absolute -bottom-1 -right-1 w-full h-full bg-black -z-10"
              style={{ transform: "translate(2px, 2px)" }}
            ></div>
          </div>

          {data.scoreB.map((score, index) => (
            <div
              key={index}
              className="w-16 h-16 flex items-center justify-center font-bold text-xl text-white relative"
              style={{
                background: "linear-gradient(145deg, #3b82f6, #1d4ed8)",
                boxShadow: `
                  inset 2px 2px 4px rgba(96, 165, 250, 0.4),
                  inset -2px -2px 4px rgba(29, 78, 216, 0.8),
                  0 4px 8px rgba(0, 0, 0, 0.3)
                `,
              }}
            >
              {score}
              {/* 3D depth edge */}
              <div
                className="absolute -bottom-1 -right-1 w-full h-full bg-blue-800 -z-10"
                style={{ transform: "translate(2px, 2px)" }}
              ></div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-8 py-3 text-center font-bold text-white tracking-wider text-sm relative"
          style={{
            background: "linear-gradient(145deg, #3b82f6, #1d4ed8)",
            boxShadow: `
              inset 2px 2px 4px rgba(96, 165, 250, 0.4),
              inset -2px -2px 4px rgba(29, 78, 216, 0.8),
              0 6px 12px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          PLAYPRO.PK
          {/* 3D depth edge */}
          <div
            className="absolute -bottom-1 -right-1 w-full h-full bg-blue-800 -z-10"
            style={{ transform: "translate(2px, 2px)" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
