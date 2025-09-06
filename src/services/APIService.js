import Logger from "./Logger";
import { queryParams } from "../pages/ScorePortal";
import { baseUrl } from "../const/Constants";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjciLCJqdGkiOiI3MzdmMWQ0Mi1lMzEzLTRmYTYtYmNlYy1mMjFlNWE3ZDBlYjAiLCJleHAiOjQ5MTMyNTc5MjksImlzcyI6Imh0dHA6Ly9uYXNjZW50aW5vdm8uY28uemEiLCJhdWQiOiJodHRwOi8vbmFzY2VudGlub3ZvLmNvLnphIn0.taFZTgcWcbQP95Tg5Rkjf_TZ8KByKtv8uPREtAjsx7A";

const getConfig = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${queryParams.token ?? token}`,
  },
});

export const getTournament = async (tournamentId, matchId) => {
  console.log("getTournament", tournamentId, matchId);
  const response = await fetch(
    `${baseUrl}/GetTournamentDetails?id=${tournamentId}`,
    getConfig()
  );
  if (response.ok) {
    var data = await response.json();
    Logger.log(data.data[0]);

    var tournament = data.data[0];
    var matches = matchId
      ? tournament.matches.filter((match) => match.id == matchId)
      : tournament.matches;

    var teamIds = [matches[0].teamAId, matches[0].teamBId];
    var teams = matchId
      ? tournament.teams
          .filter((team) => teamIds.includes(team.id))
          .map((item) => ({
            ...item,
            players: item.players.map((player) => ({
              ...player,
              groupId: item.group,
              teamId: item.id,
            })),
          }))
      : tournament.teams;
    return {
      ...tournament,
      matches,
      teams,
    };
  } else return null;
};

export const updateTournamentStatus = async (matchId, status) => {
  const response = await fetch(`${baseUrl}/UpdateTournamentMatchStatus`, {
    ...getConfig(),
    method: "POST",
    body: JSON.stringify({
      tournamentScheduleId: matchId,
      playStatus: status,
    }),
  });
  if (response.ok) {
    var data = await response.json();
    return data.status == 1;
  } else return false;
};

export const updateMatchScore = async (data) => {
  const response = await fetch(`${baseUrl}/UpdateTournamentMatchResult`, {
    ...getConfig(),
    method: "POST",
    body: JSON.stringify(data),
  });
  if (response.ok) {
    var data = await response.json();
    return data.status == 1;
  } else return false;
};

export const completeMatch = async (
  tournamentId,
  matchId,
  externalApiEndpoint
) => {
  try {
    const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
      throw new Error("Match not found");
    }

    const matchData = matchSnap.data();

    // Update match status in Firebase
    await updateDoc(matchRef, {
      status: "completed",
      endTime: serverTimestamp(),
    });

    // Push results to external API
    const response = await fetch(externalApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchId,
        tournamentId,
        team1Id: matchData.team1Id,
        team2Id: matchData.team2Id,
        score: matchData.score,
        winner: matchData.score.winner,
        completedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to push match results to external API");
    }

    return { success: true };
  } catch (error) {
    console.error("Error completing match:", error);
    return { success: false, error: error.message };
  }
};
