import React, { createContext, useContext, useReducer, useEffect } from "react";

// Mock data for development
const mockCourts = [
  { id: "COURT001", name: "Court 1", location: "Main Arena" },
  { id: "COURT002", name: "Court 2", location: "Side Arena" },
  { id: "COURT003", name: "Court 3", location: "Practice Court" },
];

const mockMatches = [
  {
    id: 1,
    courtId: "COURT001",
    teamA: { name: "Team Alpha", players: ["John Doe", "Jane Smith"] },
    teamB: { name: "Team Beta", players: ["Mike Johnson", "Sarah Wilson"] },
    scheduledTime: "2024-10-29T14:00:00",
    status: "upcoming", // upcoming, live, completed
    tournament: "Premier Cup 2024",
    round: "Quarter Final",
    scores: {
      teamA: { sets: [0, 0, 0], games: [0, 0, 0], points: 0 },
      teamB: { sets: [0, 0, 0], games: [0, 0, 0], points: 0 },
    },
  },
  {
    id: 2,
    courtId: "COURT001",
    teamA: { name: "Team Gamma", players: ["Alex Brown", "Lisa Davis"] },
    teamB: { name: "Team Delta", players: ["Tom Wilson", "Emma Taylor"] },
    scheduledTime: "2024-10-29T16:00:00",
    status: "upcoming",
    tournament: "Premier Cup 2024",
    round: "Semi Final",
    scores: {
      teamA: { sets: [0, 0, 0], games: [0, 0, 0], points: 0 },
      teamB: { sets: [0, 0, 0], games: [0, 0, 0], points: 0 },
    },
  },
  {
    id: 3,
    courtId: "COURT002",
    teamA: { name: "Team Echo", players: ["David Lee", "Anna White"] },
    teamB: { name: "Team Foxtrot", players: ["Chris Green", "Maria Garcia"] },
    scheduledTime: "2024-10-29T13:30:00",
    status: "live",
    tournament: "Premier Cup 2024",
    round: "Group Stage",
    scores: {
      teamA: { sets: [6, 3, 0], games: [1, 0, 0], points: 30 },
      teamB: { sets: [4, 2, 0], games: [0, 0, 0], points: 15 },
    },
  },
  {
    id: 4,
    courtId: "COURT001",
    teamA: { name: "Team Hotel", players: ["Robert King", "Jennifer Adams"] },
    teamB: { name: "Team India", players: ["Steven Clark", "Michelle Lewis"] },
    scheduledTime: "2024-10-28T15:00:00",
    status: "completed",
    tournament: "Premier Cup 2024",
    round: "Group Stage",
    scores: {
      teamA: { sets: [6, 6, 0], games: [2, 1, 0], points: 0 },
      teamB: { sets: [4, 3, 0], games: [0, 0, 0], points: 0 },
    },
  },
];

// Initial state
const initialState = {
  isAuthenticated: false,
  currentCourt: null,
  matches: mockMatches,
  currentMatch: null,
  loading: false,
  error: null,
};

// Action types
const actionTypes = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  SET_CURRENT_MATCH: "SET_CURRENT_MATCH",
  UPDATE_MATCH_STATUS: "UPDATE_MATCH_STATUS",
  UPDATE_SCORE: "UPDATE_SCORE",
  END_MATCH: "END_MATCH",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
};

// Reducer
const umpireReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        currentCourt: action.payload.court,
        loading: false,
        error: null,
      };

    case actionTypes.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        currentCourt: null,
        loading: false,
        error: action.payload.error,
      };

    case actionTypes.LOGOUT:
      return {
        ...initialState,
        matches: state.matches, // Keep matches data
      };

    case actionTypes.SET_CURRENT_MATCH:
      return {
        ...state,
        currentMatch: action.payload.match,
      };

    case actionTypes.UPDATE_MATCH_STATUS:
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === action.payload.matchId
            ? { ...match, status: action.payload.status }
            : match
        ),
        currentMatch:
          state.currentMatch?.id === action.payload.matchId
            ? { ...state.currentMatch, status: action.payload.status }
            : state.currentMatch,
      };

    case actionTypes.UPDATE_SCORE:
      const updatedMatches = state.matches.map((match) =>
        match.id === action.payload.matchId
          ? { ...match, scores: action.payload.scores }
          : match
      );

      return {
        ...state,
        matches: updatedMatches,
        currentMatch:
          state.currentMatch?.id === action.payload.matchId
            ? { ...state.currentMatch, scores: action.payload.scores }
            : state.currentMatch,
      };

    case actionTypes.END_MATCH:
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === action.payload.matchId
            ? {
                ...match,
                status: "completed",
                scores: action.payload.finalScores,
              }
            : match
        ),
        currentMatch: null,
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const UmpireContext = createContext();

// Provider component
export const UmpireProvider = ({ children }) => {
  const [state, dispatch] = useReducer(umpireReducer, initialState);

  // Actions
  const login = async (courtId) => {
    dispatch({ type: actionTypes.LOGIN_START });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const court = mockCourts.find((c) => c.id === courtId);

      if (court) {
        dispatch({
          type: actionTypes.LOGIN_SUCCESS,
          payload: { court },
        });
        return { success: true };
      } else {
        throw new Error("Invalid Court ID");
      }
    } catch (error) {
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    dispatch({ type: actionTypes.LOGOUT });
  };

  const setCurrentMatch = (match) => {
    dispatch({
      type: actionTypes.SET_CURRENT_MATCH,
      payload: { match },
    });
  };

  const startMatch = (matchId) => {
    dispatch({
      type: actionTypes.UPDATE_MATCH_STATUS,
      payload: { matchId, status: "live" },
    });
  };

  const updateScore = (matchId, scores) => {
    dispatch({
      type: actionTypes.UPDATE_SCORE,
      payload: { matchId, scores },
    });
  };

  const endMatch = (matchId, finalScores) => {
    dispatch({
      type: actionTypes.END_MATCH,
      payload: { matchId, finalScores },
    });
  };

  // Get matches for current court
  const getMatchesForCourt = (status = null) => {
    if (!state.currentCourt) return [];

    let matches = state.matches.filter(
      (match) => match.courtId === state.currentCourt.id
    );

    if (status) {
      matches = matches.filter((match) => match.status === status);
    }

    return matches.sort(
      (a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)
    );
  };

  const value = {
    ...state,
    login,
    logout,
    setCurrentMatch,
    startMatch,
    updateScore,
    endMatch,
    getMatchesForCourt,
    mockCourts, // For development
  };

  return (
    <UmpireContext.Provider value={value}>{children}</UmpireContext.Provider>
  );
};

// Custom hook to use the context
export const useUmpire = () => {
  const context = useContext(UmpireContext);
  if (!context) {
    throw new Error("useUmpire must be used within an UmpireProvider");
  }
  return context;
};

export default UmpireContext;
