import {
  buildBracketFromDetails,
  hasFixtureContent,
} from "./bracketDetailsBuilder";

function parseTeamId(raw) {
  const id = parseInt(String(raw ?? ""), 10);
  return Number.isNaN(id) || id <= 0 ? null : id;
}

export function groupMatchesByTournamentId(matches) {
  const grouped = new Map();

  for (const match of matches) {
    if (!match || typeof match !== "object") continue;

    const tournamentId = parseTeamId(match.tournamentId);
    if (tournamentId == null) continue;

    if (!grouped.has(tournamentId)) {
      grouped.set(tournamentId, []);
    }
    grouped.get(tournamentId).push(match);
  }

  return grouped;
}

export function extractTeamsFromMatches(matches) {
  const byId = new Map();

  for (const match of matches) {
    if (!match || typeof match !== "object") continue;

    const teamAId = parseTeamId(match.teamAId);
    if (teamAId != null && match.teamA) {
      byId.set(teamAId, { ...match.teamA, id: teamAId });
    }

    const teamBId = parseTeamId(match.teamBId);
    if (teamBId != null && match.teamB) {
      byId.set(teamBId, { ...match.teamB, id: teamBId });
    }
  }

  return Array.from(byId.values());
}

export function toBracketDetails(tournamentId, matches) {
  const first = matches[0] ?? null;

  return {
    id: tournamentId,
    name: first?.tournamentName?.toString() ?? null,
    isTeamOnly: Boolean(first?.isTeamOnly),
    scheduleImage: first?.scheduleImage ?? null,
    scheduleUrl: first?.scheduleUrl ?? null,
    matches,
    teams: extractTeamsFromMatches(matches),
  };
}

export function buildAllBracketsFromScheduleResponse(matches, tournamentIds) {
  const grouped = groupMatchesByTournamentId(
    Array.isArray(matches) ? matches : [],
  );
  const result = new Map();

  for (const tournamentId of tournamentIds) {
    const tournamentMatches = grouped.get(tournamentId) ?? [];
    const built = buildBracketFromDetails(
      toBracketDetails(tournamentId, tournamentMatches),
    );

    result.set(tournamentId, {
      ...built,
      hasContent: hasFixtureContent(built),
    });
  }

  return result;
}

export function scheduleResponseHasTournamentIds(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return false;
  return matches.some((match) => parseTeamId(match?.tournamentId) != null);
}
