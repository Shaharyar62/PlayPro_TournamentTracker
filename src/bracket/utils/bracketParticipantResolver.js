import { TournamentMatchResultEnum } from "../../const/appConstant";
import { createBracketParticipant } from "../models/tournamentBracketGraph";
import { hasContent } from "./bracketHelpers";

export class BracketParticipantResolver {
  constructor({ teams, isTeamOnly }) {
    this.teams = teams;
    this.isTeamOnly = isTeamOnly;
  }

  static parseTeamId(raw) {
    if (typeof raw === "number") return raw;
    if (raw == null) return null;
    const s = String(raw).trim();
    if (!s || s === "null" || s === "0") return null;
    const direct = parseInt(s, 10);
    if (!Number.isNaN(direct) && direct !== 0) return direct;
    const asDouble = parseFloat(s);
    if (!Number.isNaN(asDouble)) return Math.trunc(asDouble);
    return null;
  }

  static teamObjectFromMatch(match, side) {
    const nested = side === "A" ? match.teamA : match.teamB;
    if (nested && typeof nested === "object") return nested;
    return null;
  }

  static teamIdFromMatch(match, side) {
    const nested = BracketParticipantResolver.teamObjectFromMatch(match, side);
    if (side === "A") {
      return (
        BracketParticipantResolver.parseTeamId(match.team_A_id) ??
        BracketParticipantResolver.parseTeamId(match.teamAId) ??
        BracketParticipantResolver.parseTeamId(match.teamA_Id) ??
        BracketParticipantResolver.parseTeamId(nested?.id)
      );
    }
    return (
      BracketParticipantResolver.parseTeamId(match.team_B_id) ??
      BracketParticipantResolver.parseTeamId(match.teamBId) ??
      BracketParticipantResolver.parseTeamId(match.teamB_Id) ??
      BracketParticipantResolver.parseTeamId(nested?.id)
    );
  }

  static nameFromMatch(match, side) {
    const nested = BracketParticipantResolver.teamObjectFromMatch(match, side);
    if (nested) {
      const nestedName = nested.teamName ?? nested.name ?? nested.team_name;
      if (hasContent(nestedName)) return String(nestedName).trim();
    }

    const keys =
      side === "A"
        ? ["teamAName", "team_A_name", "team_a_name"]
        : ["teamBName", "team_B_name", "team_b_name"];
    for (const key of keys) {
      const v = match[key];
      if (hasContent(v)) return String(v).trim();
    }
    return null;
  }

  static logoFromMatch(match, side) {
    const nested = BracketParticipantResolver.teamObjectFromMatch(match, side);
    if (nested) {
      const nestedLogo =
        nested.logo ?? nested.image ?? nested.teamLogo ?? nested.team_logo;
      if (hasContent(nestedLogo)) return String(nestedLogo);
    }

    const keys =
      side === "A"
        ? ["teamALogo", "team_A_logo", "team_a_logo"]
        : ["teamBLogo", "team_B_logo", "team_b_logo"];
    for (const key of keys) {
      const v = match[key];
      if (hasContent(v)) return String(v);
    }
    return null;
  }

  static playersFromMatch(match, side) {
    const nested = BracketParticipantResolver.teamObjectFromMatch(match, side);
    if (Array.isArray(nested?.players) && nested.players.length) {
      return nested.players;
    }
    return null;
  }

  static isByeLabel(name) {
    if (name == null) return false;
    const n = name.trim().toLowerCase();
    return n === "bye" || n === "tbd" || n === "";
  }

  static isGroupQualificationPlaceholder(name) {
    const n = name.trim().toLowerCase();
    return (
      n.includes("group") ||
      n.includes("runner") ||
      n.includes("runners") ||
      n.includes("third place") ||
      n.includes("best third") ||
      n.includes("highest seed") ||
      n.includes("lucky loser") ||
      n.includes("qualifier") ||
      n.includes("seed")
    );
  }

  _teamById(teamId) {
    if (teamId == null) return null;
    for (const t of this.teams) {
      if (t && BracketParticipantResolver.parseTeamId(t.id) === teamId) {
        return { ...t };
      }
    }
    return null;
  }

  _playerDisplayName(team) {
    const players = team.players;
    if (!Array.isArray(players) || players.length === 0) {
      return team.teamName?.toString() ?? "TBD";
    }
    return players
      .map((e) => {
        const name = e.playerName?.toString() ?? "";
        if (!name.includes(" ")) return name;
        return name.split(" ")[0];
      })
      .join(" & ");
  }

  resolveSide(match, side, { matchResult = null } = {}) {
    const teamId = BracketParticipantResolver.teamIdFromMatch(match, side);
    const inlineName = BracketParticipantResolver.nameFromMatch(match, side);
    const inlineLogo = BracketParticipantResolver.logoFromMatch(match, side);
    const nestedTeam = BracketParticipantResolver.teamObjectFromMatch(match, side);
    const nestedPlayers = BracketParticipantResolver.playersFromMatch(match, side);

    const resolveNameFromNested = () => {
      if (!nestedTeam) return null;
      if (this.isTeamOnly) {
        return (
          nestedTeam.teamName?.toString() ??
          nestedTeam.name?.toString() ??
          inlineName ??
          null
        );
      }
      if (nestedPlayers?.length) {
        return nestedPlayers
          .map((e) => {
            const name = e.playerName?.toString() ?? e.name?.toString() ?? "";
            if (!name.includes(" ")) return name;
            return name.split(" ")[0];
          })
          .join(" & ");
      }
      return nestedTeam.teamName?.toString() ?? nestedTeam.name?.toString() ?? null;
    };

    if (teamId != null) {
      const team = this._teamById(teamId);
      if (team) {
        const name = this.isTeamOnly
          ? (team.teamName?.toString() ?? inlineName ?? "TBD")
          : this._playerDisplayName(team);
        const logo = this.isTeamOnly
          ? team.logo?.toString()
          : Array.isArray(team.players) && team.players.length > 0
            ? team.players[0].playerImage?.toString()
            : null;
        return createBracketParticipant({
          displayName: name,
          logoUrl: logo ?? inlineLogo,
          teamId,
          isPlaceholder: false,
          isWinner: BracketParticipantResolver._isWinnerSide(
            side,
            matchResult,
            match,
          ),
          side,
        });
      }

      const nestedName = resolveNameFromNested();
      if (hasContent(nestedName) || hasContent(inlineName)) {
        const nestedLogo =
          nestedTeam?.logo ??
          nestedTeam?.image ??
          nestedTeam?.teamLogo ??
          inlineLogo;
        return createBracketParticipant({
          displayName: nestedName ?? inlineName,
          logoUrl: nestedLogo?.toString?.() ?? inlineLogo,
          teamId,
          isPlaceholder: false,
          isWinner: BracketParticipantResolver._isWinnerSide(
            side,
            matchResult,
            match,
          ),
          side,
        });
      }
    }

    const nestedNameOnly = resolveNameFromNested();
    if (hasContent(nestedNameOnly)) {
      const nestedLogo =
        nestedTeam?.logo ??
        nestedTeam?.image ??
        nestedTeam?.teamLogo ??
        inlineLogo;
      return createBracketParticipant({
        displayName: nestedNameOnly,
        logoUrl: nestedLogo?.toString?.() ?? inlineLogo,
        teamId: null,
        isPlaceholder: false,
        isWinner: BracketParticipantResolver._isWinnerSide(
          side,
          matchResult,
          match,
        ),
        side,
      });
    }

    if (hasContent(inlineName)) {
      const isBye = BracketParticipantResolver.isByeLabel(inlineName);
      return createBracketParticipant({
        displayName: isBye ? "BYE" : inlineName,
        logoUrl: inlineLogo,
        teamId: null,
        isPlaceholder:
          !isBye &&
          (BracketParticipantResolver.isGroupQualificationPlaceholder(
            inlineName,
          ) ||
            BracketParticipantResolver._looksLikeMatchPlaceholder(inlineName)),
        isBye,
        isWinner: BracketParticipantResolver._isWinnerSide(
          side,
          matchResult,
          match,
        ),
        side,
      });
    }

    return createBracketParticipant({
      displayName: "TBD",
      teamId: null,
      isPlaceholder: true,
      isBye: false,
      isWinner: BracketParticipantResolver._isWinnerSide(
        side,
        matchResult,
        match,
      ),
      side,
    });
  }

  resolveParticipants(match) {
    const matchResult = BracketParticipantResolver._parseMatchResult(
      match.matchResult,
    );
    const a = this.resolveSide(match, "A", { matchResult });
    const b = this.resolveSide(match, "B", { matchResult });

    if (b.isBye && a.displayName !== "TBD") return [a];
    if (a.isBye && b.displayName !== "TBD") return [b];
    return [a, b];
  }

  static _looksLikeMatchPlaceholder(name) {
    const lower = name.toLowerCase();
    return (
      lower.includes("winner of") ||
      lower.includes("w match") ||
      (lower.includes("match") && lower.includes("winner")) ||
      lower.startsWith("w ") ||
      lower.includes("loser of")
    );
  }

  static _parseMatchResult(value) {
    if (value == null) return null;
    if (typeof value === "number") return value;
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  static _isWinnerSide(side, matchResult, match) {
    if (matchResult == null) return null;
    if (matchResult === TournamentMatchResultEnum.Team_A_Won) {
      return side === "A";
    }
    if (matchResult === TournamentMatchResultEnum.Team_B_Won) {
      return side === "B";
    }
    return null;
  }

  static winnerTeamId(match) {
    const result = BracketParticipantResolver._parseMatchResult(
      match.matchResult,
    );
    if (result === TournamentMatchResultEnum.Team_A_Won) {
      return BracketParticipantResolver.teamIdFromMatch(match, "A");
    }
    if (result === TournamentMatchResultEnum.Team_B_Won) {
      return BracketParticipantResolver.teamIdFromMatch(match, "B");
    }
    return null;
  }

  static parseSourceMatchIdFromPlaceholder(name) {
    const patterns = [
      /winner\s+of\s+match\s+(\d+)/i,
      /w\s+match\s+(\d+)/i,
      /match\s+(\d+)\s+winner/i,
      /loser\s+of\s+match\s+(\d+)/i,
      /winner\s+of\s+m\s*(\d+)/i,
    ];
    for (const p of patterns) {
      const m = name.match(p);
      if (m) return m[1];
    }
    return null;
  }

  static isWalkOver(match) {
    const raw = match.iswalkover ?? match.isWalkover ?? match.isWalkOver;
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") return raw === 1;
    if (raw == null) return false;
    const normalized = String(raw).trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }

  static _toInt(value) {
    if (typeof value === "number") return value;
    const parsed = parseInt(String(value ?? ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  static parseMatchResults(match) {
    let raw = match.results;
    if (raw == null) {
      raw = match.match_results ?? match.matchResults;
    }

    if (typeof raw === "string" && raw.trim()) {
      try {
        raw = JSON.parse(raw);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(raw) || raw.length === 0) return [];

    const first = raw[0];
    if (
      first &&
      typeof first === "object" &&
      (first.teamA_points != null || first.team_a_points != null)
    ) {
      return BracketParticipantResolver._legacyResultsFromMatchResults(raw);
    }

    return [...raw];
  }

  static _legacyResultsFromMatchResults(raw) {
    const out = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const r = item.round;
      const a = item.teamA_points ?? item.team_a_points;
      const b = item.teamB_points ?? item.team_b_points;
      out.push({ round: r, side: "A", points: BracketParticipantResolver._toInt(a) });
      out.push({ round: r, side: "B", points: BracketParticipantResolver._toInt(b) });
    }
    return out;
  }

  static wonSetsCount(results, side) {
    if (!results.length) return 0;
    const sideResults = results.filter((e) => e?.side === side);
    if (!sideResults.length) return 0;

    let count = 0;
    for (const result of sideResults) {
      const round = result.round;
      const points =
        parseInt(String(result.points ?? "0"), 10) || 0;
      const opponent = results.find(
        (e) => e?.side !== side && e?.round === round,
      ) ?? { points: 0 };
      const oppPoints =
        parseInt(String(opponent.points ?? "0"), 10) || 0;
      if (points > oppPoints) count++;
    }
    return count;
  }

  static getSideResults(match, side) {
    const results = BracketParticipantResolver.parseMatchResults(match);
    if (!results.length) return [];

    const byRound = {};
    for (const entry of results) {
      if (!entry || entry.side !== side) continue;
      const round = parseInt(String(entry.round ?? 0), 10) || 0;
      if (round <= 0) continue;
      byRound[round] = { ...entry };
    }

    const sortedRounds = Object.keys(byRound)
      .map(Number)
      .sort((a, b) => a - b);
    const sideResults = sortedRounds.map((r) => byRound[r]);
    return sideResults.length > 3 ? sideResults.slice(0, 3) : sideResults;
  }

  static _uniqueRoundCount(results) {
    const rounds = new Set();
    for (const e of results) {
      if (e?.round != null) rounds.add(e.round);
    }
    return rounds.size;
  }

  static _displayWonGamesCount(results, side, matchResult) {
    const winsA = BracketParticipantResolver.wonSetsCount(results, "A");
    const winsB = BracketParticipantResolver.wonSetsCount(results, "B");
    if (winsA > 0 || winsB > 0) {
      return side === "A" ? winsA : winsB;
    }
    if (matchResult === TournamentMatchResultEnum.Team_A_Won) {
      return side === "A" ? 1 : 0;
    }
    if (matchResult === TournamentMatchResultEnum.Team_B_Won) {
      return side === "B" ? 1 : 0;
    }
    return side === "A" ? winsA : winsB;
  }

  static displayScoreLabel(match, side, { isLive = false, isCompleted = false } = {}) {
    if (!isLive && !isCompleted) return null;

    const results = BracketParticipantResolver.parseMatchResults(match);
    if (results.length) {
      const sideResults = BracketParticipantResolver.getSideResults(match, side);
      const roundCount = BracketParticipantResolver._uniqueRoundCount(results);

      if (roundCount === 1 && sideResults.length) {
        return String(sideResults[0].points ?? "");
      }

      if (roundCount > 1) {
        const wins = BracketParticipantResolver.wonSetsCount(results, side);
        const oppWins = BracketParticipantResolver.wonSetsCount(
          results,
          side === "A" ? "B" : "A",
        );
        if (wins > 0 || oppWins > 0) return String(wins);
      }

      if (sideResults.length) {
        return String(sideResults[sideResults.length - 1].points ?? "");
      }
    }

    if (!isCompleted) return null;

    const mr = BracketParticipantResolver._parseMatchResult(match.matchResult);
    if (
      mr !== TournamentMatchResultEnum.Team_A_Won &&
      mr !== TournamentMatchResultEnum.Team_B_Won
    ) {
      return null;
    }
    return String(
      BracketParticipantResolver._displayWonGamesCount(results, side, mr),
    );
  }
}
