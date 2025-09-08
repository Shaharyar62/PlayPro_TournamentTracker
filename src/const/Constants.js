// Constants for game logic
const POINTS_PER_GAME = 4; // Number of points to win a game
const GAMES_PER_SET_GROUP = 8; // Games needed to win a set in group stage
const GAMES_PER_SET_KNOCKOUT = 6; // Games needed to win a set in knockout stage
const SETS_TO_WIN_KNOCKOUT = 2; // Sets needed to win in knockout stage

export const isLive = false;
const devUrl = "https://dev2playpro.nascentinnovations.com/api/Service";
const liveUrl = "https://playpro.nascentinnovations.com/api/Service";
export const baseUrl = isLive ? liveUrl : devUrl;

const TournamentMatchPlayStatusEnum = {
  pending: 0,
  inProgress: 1,
  completed: 2,
};

const TournamentMatchResultEnum = {
  notUploaded: 0,
  teamAWon: 1,
  teamBWon: 2,
  tied: 3,
  noResult: 4,
};

const TournamentRuleMatchFormatTypeEnum = {
  raceToSix: 1,
  twoSetsSuperTieBreak: 2,
  threeSets: 3,
};

export {
  POINTS_PER_GAME,
  GAMES_PER_SET_GROUP,
  GAMES_PER_SET_KNOCKOUT,
  SETS_TO_WIN_KNOCKOUT,
  TournamentMatchPlayStatusEnum,
  TournamentMatchResultEnum,
  TournamentRuleMatchFormatTypeEnum,
};
