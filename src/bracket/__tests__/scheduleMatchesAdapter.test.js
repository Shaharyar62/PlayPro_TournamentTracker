import { describe, expect, it } from "vitest";
import { buildBracketFromDetails } from "../utils/bracketDetailsBuilder";
import {
  buildAllBracketsFromScheduleResponse,
  extractTeamsFromMatches,
  groupMatchesByTournamentId,
  scheduleResponseHasTournamentIds,
  toBracketDetails,
} from "../utils/scheduleMatchesAdapter";

function scheduleMatch({
  id,
  tournamentId,
  stage = 7,
  name = "Round of 16",
  teamAId = 1,
  teamBId = 2,
  tournamentName = "Men's Open",
  isTeamOnly = true,
  scheduleImage = null,
  scheduleUrl = null,
  result = null,
}) {
  return {
    id,
    tournamentId,
    stageType: stage,
    stageTypeName: name,
    teamAId,
    teamBId,
    teamAName: `Team ${teamAId}`,
    teamBName: `Team ${teamBId}`,
    tournamentName,
    isTeamOnly,
    scheduleImage,
    scheduleUrl,
    is_schedule_visible_on_app: true,
    playStatus: result != null ? 2 : 0,
    matchResult: result,
    teamA: {
      id: teamAId,
      teamName: `Team ${teamAId}`,
      logo: `logo-${teamAId}.png`,
    },
    teamB: {
      id: teamBId,
      teamName: `Team ${teamBId}`,
      logo: `logo-${teamBId}.png`,
    },
  };
}

describe("scheduleMatchesAdapter", () => {
  it("groups flat matches by tournamentId", () => {
    const grouped = groupMatchesByTournamentId([
      scheduleMatch({ id: 1, tournamentId: 10 }),
      scheduleMatch({ id: 2, tournamentId: 11 }),
      scheduleMatch({ id: 3, tournamentId: 10 }),
    ]);

    expect(grouped.get(10)?.length).toBe(2);
    expect(grouped.get(11)?.length).toBe(1);
  });

  it("derives teams from nested teamA and teamB", () => {
    const teams = extractTeamsFromMatches([
      scheduleMatch({ id: 1, tournamentId: 10, teamAId: 1, teamBId: 2 }),
      scheduleMatch({ id: 2, tournamentId: 10, teamAId: 1, teamBId: 3 }),
    ]);

    expect(teams.map((t) => t.id).sort()).toEqual([1, 2, 3]);
  });

  it("builds bracket details shape for one tournament", () => {
    const matches = [
      scheduleMatch({ id: 1, tournamentId: 10, stage: 7 }),
      scheduleMatch({ id: 2, tournamentId: 10, stage: 2 }),
    ];
    const details = toBracketDetails(10, matches);
    const built = buildBracketFromDetails(details);

    expect(details.name).toBe("Men's Open");
    expect(details.teams.length).toBeGreaterThan(0);
    expect(built.graph.isEmpty).toBe(false);
  });

  it("builds all tournament brackets from batch response", () => {
    const builtMap = buildAllBracketsFromScheduleResponse(
      [
        scheduleMatch({ id: 1, tournamentId: 10, stage: 7 }),
        scheduleMatch({ id: 2, tournamentId: 11, stage: 7 }),
      ],
      [10, 11],
    );

    expect(builtMap.get(10)?.graph.isEmpty).toBe(false);
    expect(builtMap.get(11)?.graph.isEmpty).toBe(false);
    expect(builtMap.get(10)?.tournamentName).toBe("Men's Open");
  });

  it("handles empty tournament with schedule fallback metadata", () => {
    const builtMap = buildAllBracketsFromScheduleResponse(
      [
        scheduleMatch({
          id: 1,
          tournamentId: 10,
          scheduleImage: "fixture.png",
        }),
      ],
      [10, 11],
    );

    expect(builtMap.get(10)?.graph.isEmpty).toBe(false);
    expect(builtMap.get(11)?.graph.isEmpty).toBe(true);
    expect(builtMap.get(11)?.hasContent).toBe(false);
  });

  it("detects missing tournamentId in schedule response", () => {
    expect(
      scheduleResponseHasTournamentIds([{ id: 1, tournamentName: "Open" }]),
    ).toBe(false);
    expect(
      scheduleResponseHasTournamentIds([
        scheduleMatch({ id: 1, tournamentId: 10 }),
      ]),
    ).toBe(true);
  });
});
