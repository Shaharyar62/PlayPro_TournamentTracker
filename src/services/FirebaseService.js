// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import {
  POINTS_PER_GAME,
  GAMES_PER_SET_GROUP,
  GAMES_PER_SET_KNOCKOUT,
  SETS_TO_WIN_KNOCKOUT,
  isLive,
} from "../const/Constants";

var tableName = isLive ? "tournaments" : "tournaments_dev";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDAwYOp0cdbMbJf1BcPElWErj5wkO7RNKM",
  authDomain: "playpro-1ea88.firebaseapp.com",
  projectId: "playpro-1ea88",
  storageBucket: "playpro-1ea88.firebasestorage.app",
  messagingSenderId: "860751152822",
  appId: "1:860751152822:web:44f056b3cdbb97165f8817",
  measurementId: "G-R53K1R27JM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

/**
 * Initialize a match in Firebase
 */
export const initializeMatch = async (matchData) => {
  try {
    const { tournamentId, matchId, isKnockout, groupId, maxSets } = matchData;

    var team1Id = matchData.teams.team1.id;
    var team2Id = matchData.teams.team2.id;
    var team1Players = matchData.teams.team1.players;
    var team2Players = matchData.teams.team2.players;

    // Create initial score structure
    const initialScoreData = {
      currentSet: 0,
      currentGame: { team1Points: 0, team2Points: 0 },
      sets: isKnockout
        ? [
            { team1Games: 0, team2Games: 0, completed: false },
            { team1Games: 0, team2Games: 0, completed: false },
            { team1Games: 0, team2Games: 0, completed: false }, // Third set if needed
          ]
        : [{ team1Games: 0, team2Games: 0, completed: false }],
      matchScore: { team1Sets: 0, team2Sets: 0 },
      completed: false,
      winner: null,
      lastUpdated: serverTimestamp(),
    };

    // Create initial pointsHistory for API upload
    const pointsHistory = [];

    // Create match document
    const matchRef = doc(db, tableName, tournamentId, "matches", matchId);

    await setDoc(matchRef, {
      team1Id,
      team2Id,
      team1Players,
      team2Players,
      isKnockout,
      groupId: groupId || null,
      maxSets: maxSets || (isKnockout ? 3 : 1),
      currentMatchState: {
        score: initialScoreData,
        pointsHistory: pointsHistory,
      },
      status: "in-progress",
      startTime: serverTimestamp(),
    });

    return { success: true, matchId };
  } catch (error) {
    console.error("Error initializing match:", error);
    return { success: false, error: error.message };
  }
};

export const getIsMatchInitialized = async (tournamentId, matchId) => {
  try {
    const matchRef = doc(db, tableName, tournamentId, "matches", matchId);
    const matchSnap = await getDoc(matchRef);
    const matchData = matchSnap.data();

    return (
      matchData !== undefined &&
      matchSnap.exists() &&
      matchData !== null &&
      Object.keys(matchData).length > 0
    );
  } catch (error) {
    console.error("Error checking if match is initialized:", error);
    return false;
  }
};

export const addPoint = async (
  tournamentId,
  matchId,
  team,
  increment,
  historyEntry,
  isKnockout
) => {
  const matchRef = doc(db, tableName, tournamentId, "matches", matchId);

  try {
    const matchDoc = await getDoc(matchRef);
    const matchData = matchDoc.data();

    // Calculate new score
    const updatedScore = calculateNewScore(
      matchData.currentMatchState.score,
      team,
      increment,
      isKnockout
    );

    // Add result to history entry
    historyEntry.resultState = {
      currentSet: updatedScore.currentSet,
      currentGame: { ...updatedScore.currentGame },
      sets: JSON.parse(JSON.stringify(updatedScore.sets)),
    };

    // Update Firebase with new score and append to history
    await updateDoc(matchRef, {
      "currentMatchState.score": updatedScore,
      "currentMatchState.pointHistory": arrayUnion(historyEntry),
    });
  } catch (error) {
    console.error("Error updating score:", error);
  }
};

const calculateNewScore = (score, team, increment, isKnockout) => {
  const currentSet = score.currentSet;
  const currentGame = score.currentGame;
  const sets = [...score.sets];
  const scorePoints = ["0", "15", "30", "40", "AD"];

  const currentTeamPoints =
    team === "team1" ? currentGame.team1Points : currentGame.team2Points;
  const oppositeTeamPoints =
    team === "team1" ? currentGame.team2Points : currentGame.team1Points;

  let currentScore = scorePoints.indexOf(currentTeamPoints.toString());
  let oppositeScore = scorePoints.indexOf(oppositeTeamPoints.toString());

  const oppositeTeam = team === "team1" ? "team2" : "team1";

  const updates = {
    ...score,
    currentGame: { ...currentGame },
    sets: JSON.parse(JSON.stringify(sets)),
  };

  if (increment) {
    if (currentScore === 3 && oppositeScore === 3) {
      // Deuce
      updates.currentGame[`${team}Points`] = "AD";
    } else if (currentScore === 3 && oppositeScore === 4) {
      // Back to deuce
      updates.currentGame[`${oppositeTeam}Points`] = "40";
    } else if (
      currentScore === 4 ||
      (currentScore === 3 && oppositeScore < 3)
    ) {
      // Win game
      updates.sets[currentSet].team1Games += team === "team1" ? 1 : 0;
      updates.sets[currentSet].team2Games += team === "team2" ? 1 : 0;

      updates.currentGame.team1Points = "0";
      updates.currentGame.team2Points = "0";

      // Check for set/match win based on match type
      const gamesNeededToWin = isKnockout ? 6 : 8;
      const team1Games = updates.sets[currentSet].team1Games;
      const team2Games = updates.sets[currentSet].team2Games;
      const leadingTeam = team1Games > team2Games ? "team1" : "team2";
      const gamesDiff = Math.abs(team1Games - team2Games);

      if (
        (isKnockout &&
          ((team1Games >= gamesNeededToWin && gamesDiff >= 2) ||
            (team2Games >= gamesNeededToWin && gamesDiff >= 2))) ||
        (!isKnockout &&
          (team1Games >= gamesNeededToWin || team2Games >= gamesNeededToWin))
      ) {
        // Set is won
        updates.sets[currentSet].completed = true;
        updates.sets[currentSet].winner = leadingTeam;

        if (isKnockout) {
          // For knockout matches, check if match is won (best of 3)
          let team1Sets = 0;
          let team2Sets = 0;
          updates.sets.forEach((set) => {
            if (set.winner === "team1") team1Sets++;
            if (set.winner === "team2") team2Sets++;
          });

          if (team1Sets >= 2 || team2Sets >= 2) {
            updates.completed = true;
            updates.winner = team1Sets > team2Sets ? "team1" : "team2";
          } else if (currentSet < 2) {
            updates.currentSet = currentSet + 1;
          }
        } else {
          // For group matches, single set determines winner
          updates.completed = true;
          updates.winner = leadingTeam;
        }
      }
    } else {
      // Normal point progression
      updates.currentGame[`${team}Points`] = scorePoints[currentScore + 1];
    }
  } else {
    // Handle point subtraction
    if (currentScore > 0) {
      updates.currentGame[`${team}Points`] = scorePoints[currentScore - 1];
    }
  }

  return updates;
};

// /**
//  * Add a point to a team
//  */
// export const addPoint = async (tournamentId, matchId, teamSide) => {
//   try {
//     const matchRef = doc(db, tableName, tournamentId, "matches", matchId);
//     const matchSnap = await getDoc(matchRef);

//     if (!matchSnap.exists()) {
//       throw new Error("Match not found");
//     }

//     const matchData = matchSnap.data();
//     const { team1Players, team2Players, isKnockout, currentMatchState } =
//       matchData;
//     const { score, pointsHistory } = currentMatchState;

//     // Clone the current score to work with
//     const newScore = JSON.parse(JSON.stringify(score));

//     // Handle point addition based on team side
//     if (teamSide === "team1") {
//       newScore.currentGame.team1Points += 1;
//     } else {
//       newScore.currentGame.team2Points += 1;
//     }

//     // Create point history entry
//     const pointEntry = createPointHistoryEntry(
//       teamSide === "team1" ? team1Players : team2Players,
//       teamSide === "team1" ? "A" : "B",
//       newScore.currentSet,
//       teamSide === "team1"
//         ? newScore.sets[newScore.currentSet - 1].team1Games
//         : newScore.sets[newScore.currentSet - 1].team2Games,
//       1 // gameType
//     );

//     // Add point to history
//     const newPointsHistory = [...pointsHistory, ...pointEntry];

//     // Check if the game is completed
//     const gameCompleted = checkGameCompletion(newScore.currentGame);
//     if (gameCompleted) {
//       // Update games in the current set
//       if (newScore.currentGame.team1Points > newScore.currentGame.team2Points) {
//         newScore.sets[newScore.currentSet - 1].team1Games += 1;
//       } else {
//         newScore.sets[newScore.currentSet - 1].team2Games += 1;
//       }

//       // Reset current game
//       newScore.currentGame = { team1Points: 0, team2Points: 0 };

//       // Check if the set is completed
//       const setCompleted = checkSetCompletion(
//         newScore.sets[newScore.currentSet - 1],
//         isKnockout ? GAMES_PER_SET_KNOCKOUT : GAMES_PER_SET_GROUP
//       );

//       if (setCompleted) {
//         // Mark the set as completed
//         newScore.sets[newScore.currentSet - 1].completed = true;

//         // Update match score
//         if (
//           newScore.sets[newScore.currentSet - 1].team1Games >
//           newScore.sets[newScore.currentSet - 1].team2Games
//         ) {
//           newScore.matchScore.team1Sets += 1;
//         } else {
//           newScore.matchScore.team2Sets += 1;
//         }

//         // Check if match is completed
//         const matchCompleted = checkMatchCompletion(newScore, isKnockout);

//         if (matchCompleted) {
//           // Determine the winner
//           newScore.completed = true;
//           newScore.winner =
//             newScore.matchScore.team1Sets > newScore.matchScore.team2Sets
//               ? "team1"
//               : "team2";
//         } else if (isKnockout && newScore.currentSet < newScore.sets.length) {
//           // Move to next set in knockout stage
//           newScore.currentSet += 1;
//         }
//       }
//     }

//     // Update the match in Firebase
//     await updateDoc(matchRef, {
//       "currentMatchState.score": newScore,
//       "currentMatchState.pointsHistory": newPointsHistory,
//       lastUpdated: serverTimestamp(),
//       status: newScore.completed ? "completed" : "in-progress",
//     });

//     return {
//       success: true,
//       newScore,
//       completed: newScore.completed,
//       winner: newScore.winner,
//     };
//   } catch (error) {
//     console.error("Error adding point:", error);
//     return { success: false, error: error.message };
//   }
// };

/**
 * Remove a point from a team
 */
// export const removePoint = async (tournamentId, matchId, teamSide) => {
//   try {
//     const matchRef = doc(db, tableName, tournamentId, "matches", matchId);
//     const matchSnap = await getDoc(matchRef);

//     if (!matchSnap.exists()) {
//       throw new Error("Match not found");
//     }

//     const matchData = matchSnap.data();
//     const { currentMatchState } = matchData;
//     const { score, pointsHistory } = currentMatchState;

//     // Clone the current score to work with
//     const newScore = JSON.parse(JSON.stringify(score));

//     // Handle point subtraction based on team side
//     if (teamSide === "team1" && newScore.currentGame.team1Points > 0) {
//       newScore.currentGame.team1Points -= 1;
//     } else if (teamSide === "team2" && newScore.currentGame.team2Points > 0) {
//       newScore.currentGame.team2Points -= 1;
//     } else {
//       // Cannot remove points if already at zero
//       return { success: false, error: "Cannot remove points from zero" };
//     }

//     // Remove the last point entry for this team from history
//     const newPointsHistory = [...pointsHistory];

//     // Find the last point entry for this team
//     for (let i = newPointsHistory.length - 1; i >= 0; i--) {
//       const entry = newPointsHistory[i];
//       if (
//         (teamSide === "team1" && entry.side === "A") ||
//         (teamSide === "team2" && entry.side === "B")
//       ) {
//         newPointsHistory.splice(i, 1);
//         break;
//       }
//     }

//     // Update the match in Firebase
//     await updateDoc(matchRef, {
//       "currentMatchState.score": newScore,
//       "currentMatchState.pointsHistory": newPointsHistory,
//       lastUpdated: serverTimestamp(),
//     });

//     return { success: true, newScore };
//   } catch (error) {
//     console.error("Error removing point:", error);
//     return { success: false, error: error.message };
//   }
// };

/**
 * Check if a game is completed
 */
const checkGameCompletion = (currentGame) => {
  return (
    currentGame.team1Points >= POINTS_PER_GAME ||
    currentGame.team2Points >= POINTS_PER_GAME
  );
};

/**
 * Check if a set is completed
//  */
// const checkSetCompletion = (currentSet, gamesRequired) => {
//   return (
//     currentSet.team1Games >= gamesRequired ||
//     currentSet.team2Games >= gamesRequired
//   );
// };

/**
 * Check if the match is completed
 */
// const checkMatchCompletion = (score, isKnockout) => {
//   if (isKnockout) {
//     // In knockout stage, a team needs to win 2 sets
//     return (
//       score.matchScore.team1Sets >= SETS_TO_WIN_KNOCKOUT ||
//       score.matchScore.team2Sets >= SETS_TO_WIN_KNOCKOUT
//     );
//   } else {
//     // In group stage, only one set is played
//     return score.sets[0].completed;
//   }
// };

/**
 * Create point history entries in the format required by the external API
 */
const createPointHistoryEntry = (players, side, round, points, gameType) => {
  const entries = [];

  players.forEach((player) => {
    entries.push({
      bookingResultTmpId: 0,
      playerId: player.id,
      side: side,
      round: round,
      points: points,
      gameType: gameType,
      resultType: 1,
    });
  });

  return entries;
};

/**
 * Get the current match state
 */
export const getMatchState = async (tournamentId, matchId) => {
  try {
    const matchRef = doc(db, tableName, tournamentId, "matches", matchId);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
      throw new Error("Match not found");
    }

    return {
      success: true,
      matchData: matchSnap.data(),
    };
  } catch (error) {
    console.error("Error getting match state:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Complete a match and prepare data for external API
 */
export const completeMatch = async (
  tournamentId,
  matchId,
  externalApiEndpoint
) => {
  try {
    const matchRef = doc(db, tableName, tournamentId, "matches", matchId);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
      throw new Error("Match not found");
    }

    const matchData = matchSnap.data();
    const { currentMatchState } = matchData;

    // Format the points history for the external API
    const formattedResults = currentMatchState.pointsHistory;

    // Update match status
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
      body: JSON.stringify(formattedResults),
    });

    if (!response.ok) {
      throw new Error("Failed to push match results to external API");
    }

    return {
      success: true,
      apiResponse: await response.json(),
    };
  } catch (error) {
    console.error("Error completing match:", error);
    return { success: false, error: error.message };
  }
};

export const listenToMatchUpdates = (tournamentId, matchId, callback) => {
  debugger;
  const matchRef = doc(
    db,
    tableName,
    tournamentId,
    "matches",
    matchId.toString()
  );

  // Set up real-time listener
  const unsubscribe = onSnapshot(
    matchRef,
    (doc) => {
      debugger;
      if (doc.exists()) {
        const matchData = doc.data();
        callback(matchData);
      } else {
        console.log("No match document found!");
      }
    },
    (error) => {
      console.error("Error listening to match updates:", error);
    }
  );

  // Return unsubscribe function
  return unsubscribe;
};

// Add function to get point history
export const getPointHistory = async (tournamentId, matchId) => {
  const matchRef = doc(db, tableName, tournamentId, "matches", matchId);

  try {
    const matchDoc = await getDoc(matchRef);
    const matchData = matchDoc.data();
    return matchData.currentMatchState.pointHistory || [];
  } catch (error) {
    console.error("Error getting point history:", error);
    return [];
  }
};

// Add function to undo last point
export const undoLastPoint = async (tournamentId, matchId) => {
  const matchRef = doc(db, tableName, tournamentId, "matches", matchId);

  try {
    const matchDoc = await getDoc(matchRef);
    const matchData = matchDoc.data();
    const history = matchData.currentMatchState.pointHistory || [];

    if (history.length === 0) {
      console.log("No points to undo");
      return;
    }

    // Get the last history entry
    const lastEntry = history[history.length - 1];

    // Update the score to the previous state
    await updateDoc(matchRef, {
      "currentMatchState.score": {
        ...lastEntry.previousState,
        // completed: false,
        // winner: null,
      },
      // Remove the last entry from history
      "currentMatchState.pointHistory": history.slice(0, -1),
    });
  } catch (error) {
    console.error("Error undoing last point:", error);
  }
};

// Add function to delete a match
export const deleteMatch = async (tournamentId, matchId) => {
  const matchRef = doc(db, tableName, tournamentId, "matches", matchId);

  try {
    // Check if the match exists first
    const matchDoc = await getDoc(matchRef);

    if (!matchDoc.exists()) {
      console.log("Match does not exist");
      return { success: false, error: "Match not found" };
    }

    // Delete the match document
    await deleteDoc(matchRef);

    console.log("Match successfully deleted");
    return { success: true };
  } catch (error) {
    console.error("Error deleting match:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to live matches in a tournament
 */
export const initializeLiveMatchesListener = (tournamentId, callback) => {
  const matchesCollectionRef = collection(
    db,
    tableName,
    tournamentId,
    "matches"
  );
  const liveMatchesQuery = query(
    matchesCollectionRef,
    where("status", "==", "ongoing")
  );

  // Set up real-time listener for live matches
  const unsubscribe = onSnapshot(
    liveMatchesQuery,
    (snapshot) => {
      const liveMatches = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(liveMatches);
    },
    (error) => {
      console.error("Error listening to live matches:", error);
    }
  );

  // Return unsubscribe function
  return unsubscribe;
};

/**
 * Get a specific match by tournament ID and match ID
 */
export const getSpecificMatch = async (tournamentId, matchId) => {
  try {
    const matchRef = doc(db, tableName, tournamentId, "matches", matchId);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
      throw new Error("Match not found");
    }

    return {
      success: true,
      matchData: {
        id: matchSnap.id,
        ...matchSnap.data(),
      },
    };
  } catch (error) {
    console.error("Error getting specific match:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to a specific match updates
 */
export const listenToSpecificMatch = (tournamentId, matchId, callback) => {
  const matchRef = doc(db, tableName, tournamentId, "matches", matchId);

  // Set up real-time listener for specific match
  const unsubscribe = onSnapshot(
    matchRef,
    (doc) => {
      if (doc.exists()) {
        const matchData = {
          id: doc.id,
          ...doc.data(),
        };
        callback(matchData);
      } else {
        console.log("No match document found!");
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to specific match updates:", error);
    }
  );

  // Return unsubscribe function
  return unsubscribe;
};
