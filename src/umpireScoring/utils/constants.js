import { MatchFormat } from "../types/match.types.js";

const isLocal = false;

export const SERVER_URL = isLocal
  ? "http://localhost:3000"
  : "https://ttwp.playpro.pk";
export const SOCKET_PATH = "/socket.io/";

/**
 * Server configuration
 */

/**
 * Default Match Settings for standard Padel match
 */
export const DEFAULT_MATCH_SETTINGS = {
  autoStartTime: true,
  pointTimerMinutes: 0,
  pointTimerSeconds: 20,
  changeSide1_Minutes: 0,
  changeSide1_Seconds: 90,
  changeSideMinutes: 0,
  changeSideSeconds: 90,
  setTimerMinutes: 0,
  setTimerSeconds: 0,
  numberOfSets: 3,
  numberOfGames: 6,
  autoChangeSide: true,
  goldenPoint: false,
  goldenPointInTiebreak: false,
  advantagesWithGoldenPoint: 2,
  tiebreakOnLastSet: true,
  pointsInTiebreak: 7,
  superTieBreakPoints: 10,
  gamesToStartTiebreak: "6 - 6",
  matchFormat: MatchFormat.THREE_SETS,
};

/**
 * Score display mapping for regular game points
 */
export const SCORE_STRINGS = ["00", "15", "30", "40", "AD"];

/**
 * Warning levels
 */
export const WARNING_LEVELS = {
  W1: "W1",
  W2: "W2",
  W3: "W3",
};

/**
 * Maximum undo stack size
 */
export const MAX_UNDO_STACK_SIZE = 100;

/**
 * WebSocket timeout for match state requests (ms)
 */
export const MATCH_STATE_TIMEOUT = 5000;
