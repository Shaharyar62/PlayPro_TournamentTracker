import React, { createContext, useContext, useReducer, useEffect } from "react";
import { umpireAPI } from "../services/umpireAPI";
import {
  setUmpireToken,
  getUmpireToken,
  clearUmpireToken,
} from "../helpers/tokenHelper";
import { transformCourtsScheduleToMatches } from "../helpers/matchDataTransformer";

// Load initial state from localStorage
const loadInitialState = () => {
  const token = getUmpireToken();
  const umpireData = localStorage.getItem("umpireData");
  const tournaments = localStorage.getItem("umpireTournaments");
  const selectedTournamentId = localStorage.getItem("selectedMasterTournamentId");

  let parsedUmpireData = null;
  let parsedTournaments = [];
  let parsedSelectedTournamentId = null;

  try {
    if (umpireData) parsedUmpireData = JSON.parse(umpireData);
    if (tournaments) parsedTournaments = JSON.parse(tournaments);
    if (selectedTournamentId)
      parsedSelectedTournamentId = parseInt(selectedTournamentId);
  } catch (error) {
    console.error("Error loading initial state:", error);
  }

  return {
    isAuthenticated: !!token,
    umpireData: parsedUmpireData,
    masterTournaments: parsedTournaments,
    masterTournamentId: parsedSelectedTournamentId,
    matches: [],
    currentMatch: null,
    loading: false,
    error: null,
  };
};

// Initial state
const initialState = loadInitialState();

// Action types
const actionTypes = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  SET_MASTER_TOURNAMENTS: "SET_MASTER_TOURNAMENTS",
  SET_MASTER_TOURNAMENT_ID: "SET_MASTER_TOURNAMENT_ID",
  SET_CURRENT_MATCH: "SET_CURRENT_MATCH",
  SET_MATCHES: "SET_MATCHES",
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
        umpireData: action.payload.umpireData,
        masterTournaments: action.payload.tournaments || [],
        masterTournamentId: action.payload.selectedTournamentId || null,
        loading: false,
        error: null,
      };

    case actionTypes.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        umpireData: null,
        loading: false,
        error: action.payload.error,
      };

    case actionTypes.LOGOUT:
      return {
        ...initialState,
        isAuthenticated: false,
        umpireData: null,
        masterTournaments: [],
        masterTournamentId: null,
        matches: [],
        currentMatch: null,
      };

    case actionTypes.SET_MASTER_TOURNAMENTS:
      return {
        ...state,
        masterTournaments: action.payload,
      };

    case actionTypes.SET_MASTER_TOURNAMENT_ID:
      return {
        ...state,
        masterTournamentId: action.payload,
      };

    case actionTypes.SET_MATCHES:
      return {
        ...state,
        matches: action.payload,
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

  // Login with phone and password
  const login = async (phone, password) => {
    dispatch({ type: actionTypes.LOGIN_START });

    try {
      // Call API to sign in
      const response = await umpireAPI.umpireSignIn(phone, password);

      if (!response.success) {
        throw new Error(response.error || "Login failed");
      }

      // Extract umpire data from response
      const umpireDataArray = response.data || [];
      if (umpireDataArray.length === 0) {
        throw new Error("No umpire data received");
      }

      const umpireData = umpireDataArray[0];
      const token = umpireData.token;

      if (!token) {
        throw new Error("No token received from server");
      }

      // Encrypt and store token
      setUmpireToken(token);

      // Store umpire data
      localStorage.setItem("umpireData", JSON.stringify(umpireData));

      // Delete old tournament data
      localStorage.removeItem("umpireTournaments");
      localStorage.removeItem("selectedMasterTournamentId");

      // Fetch tournaments
      const tournamentsResponse = await umpireAPI.getUmpireMasterTournaments();

      if (!tournamentsResponse.success) {
        throw new Error(
          tournamentsResponse.error || "Failed to fetch tournaments"
        );
      }

      const tournaments = tournamentsResponse.data || [];
      let selectedTournamentId = null;

      // Store tournaments
      if (tournaments.length > 0) {
        localStorage.setItem("umpireTournaments", JSON.stringify(tournaments));
        // Select first tournament by default
        selectedTournamentId = tournaments[0].id;
        localStorage.setItem(
          "selectedMasterTournamentId",
          selectedTournamentId.toString()
        );
      }

      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: {
          umpireData,
          tournaments,
          selectedTournamentId,
          message: response.message,
        },
      });

      return {
        success: true,
        message: response.message || "Login successful",
      };
    } catch (error) {
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = () => {
    // Clear token
    clearUmpireToken();

    // Clear localStorage
    localStorage.removeItem("umpireData");
    localStorage.removeItem("umpireTournaments");
    localStorage.removeItem("selectedMasterTournamentId");

    dispatch({ type: actionTypes.LOGOUT });
  };

  // Fetch master tournaments
  const fetchMasterTournaments = async () => {
    try {
      const response = await umpireAPI.getUmpireMasterTournaments();

      if (response.success) {
        const tournaments = response.data || [];
        localStorage.setItem("umpireTournaments", JSON.stringify(tournaments));
        dispatch({
          type: actionTypes.SET_MASTER_TOURNAMENTS,
          payload: tournaments,
        });
        return tournaments;
      } else {
        throw new Error(response.error || "Failed to fetch tournaments");
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error.message,
      });
      return [];
    }
  };

  // Set master tournament ID
  const setMasterTournamentId = (tournamentId) => {
    localStorage.setItem("selectedMasterTournamentId", tournamentId.toString());
    dispatch({
      type: actionTypes.SET_MASTER_TOURNAMENT_ID,
      payload: tournamentId,
    });
  };

  // Fetch matches for selected tournament
  const fetchMatches = async (tournamentId = null) => {
    const targetTournamentId = tournamentId || state.masterTournamentId;

    if (!targetTournamentId) {
      dispatch({ type: actionTypes.SET_MATCHES, payload: [] });
      return [];
    }

    dispatch({ type: actionTypes.SET_LOADING, payload: true });

    try {
      const response =
        await umpireAPI.getUmpireMasterTournamentCourtsSchedule(
          targetTournamentId
        );

      if (response.success) {
        // Find tournament object for name
        const tournament = state.masterTournaments.find(
          (t) => t.id === targetTournamentId
        );

        // Transform API data to UI format
        const matches = transformCourtsScheduleToMatches(
          response,
          tournament
        );

        dispatch({ type: actionTypes.SET_MATCHES, payload: matches });
        return matches;
      } else {
        throw new Error(response.error || "Failed to fetch matches");
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error.message,
      });
      dispatch({ type: actionTypes.SET_MATCHES, payload: [] });
      return [];
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  // Get matches for current tournament (filtered by status if provided)
  const getMatchesForCourt = (status = null) => {
    let matches = state.matches || [];

    if (status) {
      matches = matches.filter((match) => match.status === status);
    }

    return matches.sort(
      (a, b) => new Date(a.scheduledTime || 0) - new Date(b.scheduledTime || 0)
    );
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

  // Fetch matches when tournament changes
  useEffect(() => {
    if (state.isAuthenticated && state.masterTournamentId) {
      fetchMatches();
    }
  }, [state.masterTournamentId, state.isAuthenticated]);

  const value = {
    ...state,
    login,
    logout,
    fetchMasterTournaments,
    setMasterTournamentId,
    fetchMatches,
    setCurrentMatch,
    startMatch,
    updateScore,
    endMatch,
    getMatchesForCourt,
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
