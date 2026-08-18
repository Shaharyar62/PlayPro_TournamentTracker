import { describe, expect, it } from "vitest";
import { BracketEdgeConfidence } from "../models/tournamentBracketGraph";
import { BracketGraphBuilder } from "../utils/bracketGraphBuilder";
import { BracketLayoutEngine } from "../utils/bracketLayoutEngine";
import { BracketStageOrder } from "../utils/bracketStageOrder";
import { BracketParticipantResolver } from "../utils/bracketParticipantResolver";

const teams = () => [
  { id: 1, teamName: "Team One", logo: "logo1.png" },
  { id: 2, teamName: "Team Two", logo: "logo2.png" },
  { id: 3, teamName: "Team Three", logo: "logo3.png" },
  { id: 4, teamName: "Team Four", logo: "logo4.png" },
];

function match({
  id,
  stage,
  name,
  teamA = null,
  teamB = null,
  teamAName = null,
  result = null,
  visible = true,
  group = null,
}) {
  return {
    id,
    stageType: stage,
    stageTypeName: name,
    ...(teamA != null ? { teamAId: teamA } : {}),
    ...(teamB != null ? { teamBId: teamB } : {}),
    ...(teamAName != null ? { teamAName } : {}),
    ...(group != null ? { group1: group } : {}),
    ...(result != null ? { matchResult: result } : {}),
    playStatus: result != null ? 2 : 0,
    is_schedule_visible_on_app: visible,
    startDateTime: "2026-06-29T14:00:00",
  };
}

describe("BracketStageOrder", () => {
  it("progressionIndex follows bracket flow", () => {
    expect(BracketStageOrder.progressionIndex(1)).toBeLessThan(
      BracketStageOrder.progressionIndex(5),
    );
    expect(BracketStageOrder.progressionIndex(5)).toBeLessThan(
      BracketStageOrder.progressionIndex(7),
    );
    expect(BracketStageOrder.progressionIndex(7)).toBeLessThan(
      BracketStageOrder.progressionIndex(2),
    );
    expect(BracketStageOrder.progressionIndex(3)).toBeLessThan(
      BracketStageOrder.progressionIndex(6),
    );
    expect(BracketStageOrder.progressionIndex(6)).toBeLessThan(
      BracketStageOrder.progressionIndex(4),
    );
  });

  it("displayName returns Group Matches for group stage", () => {
    expect(BracketStageOrder.displayName(1)).toBe("Group Matches");
  });

  it("roundKey buckets by stageType only", () => {
    expect(BracketStageOrder.roundKey(1)).toBe("stage_1");
    expect(BracketStageOrder.roundKey(2)).toBe("stage_2");
  });
});

describe("BracketGraphBuilder", () => {
  it("excludes group matches when knockout stages exist", () => {
    const graph = BracketGraphBuilder.build({
      matches: [
        match({
          id: 1,
          stage: 1,
          name: "Group Match",
          teamA: 1,
          teamB: 2,
          group: "A",
        }),
        match({ id: 2, stage: 7, name: "Round of 16", teamA: 1, teamB: 2 }),
        match({ id: 3, stage: 2, name: "Quarter Final", teamA: 1, teamB: 3 }),
      ],
      teams: teams(),
      isTeamOnly: true,
    });

    expect(graph.rounds.every((r) => r.name !== "Group Matches")).toBe(true);
    expect(graph.rounds.length).toBe(2);
    expect(graph.rounds[0].name).toBe("Round of 16");
  });

  it("orders rounds by canonical stage progression", () => {
    const graph = BracketGraphBuilder.build({
      matches: [
        match({ id: 7, stage: 4, name: "Final", teamA: 1, teamB: 2 }),
        match({ id: 6, stage: 6, name: "Third Position", teamA: 3, teamB: 4 }),
        match({ id: 5, stage: 3, name: "Semi Final", teamA: 1, teamB: 3 }),
        match({ id: 4, stage: 2, name: "Quarter Final", teamA: 1, teamB: 4 }),
        match({ id: 3, stage: 7, name: "Round of 16", teamA: 1, teamB: 2 }),
        match({ id: 2, stage: 5, name: "Knockout", teamA: 1, teamB: 2 }),
        match({
          id: 1,
          stage: 1,
          name: "Group Match",
          teamA: 1,
          teamB: 2,
          group: "A",
        }),
      ],
      teams: teams(),
      isTeamOnly: true,
    });

    expect(graph.rounds.map((r) => r.name)).toEqual([
      "Knockout",
      "Round of 16",
      "Quarter Final",
      "Semi Final",
      "3rd Place",
      "Final",
    ]);
  });

  it("hidden matches are excluded", () => {
    const graph = BracketGraphBuilder.build({
      matches: [
        match({
          id: 1,
          stage: 4,
          name: "Final",
          teamA: 1,
          teamB: 2,
          visible: false,
        }),
      ],
      teams: teams(),
      isTeamOnly: true,
    });

    expect(graph.isEmpty).toBe(true);
  });

  it("placeholder name creates placeholderParse edge", () => {
    const graph = BracketGraphBuilder.build({
      matches: [
        match({ id: 5, stage: 7, name: "Round of 16", teamA: 1, teamB: 2 }),
        match({
          id: 10,
          stage: 2,
          name: "Quarter Final",
          teamAName: "Winner of Match 5",
          teamB: 4,
        }),
      ],
      teams: teams(),
      isTeamOnly: true,
    });

    expect(
      graph.edges.some(
        (e) =>
          e.sourceMatchId === "5" &&
          e.targetMatchId === "10" &&
          e.confidence === BracketEdgeConfidence.placeholderParse,
      ),
    ).toBe(true);
  });

  it("updateMatchDataOnly preserves structure fingerprint", () => {
    const matches = [
      match({ id: 1, stage: 7, name: "Round of 16", teamA: 1, teamB: 2 }),
      match({ id: 2, stage: 2, name: "Quarter Final", teamA: 1, teamB: 3 }),
    ];
    const built = BracketGraphBuilder.build({
      matches,
      teams: teams(),
      isTeamOnly: true,
    });

    const updatedMatches = matches.map((m) =>
      m.id === 1 ? { ...m, playStatus: 1, matchResult: 1 } : m,
    );

    const updated = BracketGraphBuilder.updateMatchDataOnly({
      existing: built,
      matches: updatedMatches,
      teams: teams(),
      isTeamOnly: true,
    });

    expect(built.hasSameStructure(updated)).toBe(true);
    expect(updated.matchById("1").isLive).toBe(true);
  });
});

describe("BracketLayoutEngine", () => {
  it("centers parent match between two feeders", () => {
    const graph = BracketGraphBuilder.build({
      matches: [
        match({ id: 1, stage: 7, name: "R16", teamA: 1, teamB: 2 }),
        match({ id: 2, stage: 7, name: "R16", teamA: 3, teamB: 4 }),
        match({ id: 3, stage: 2, name: "QF", teamA: 1, teamB: 3 }),
      ],
      teams: teams(),
      isTeamOnly: true,
    });

    const layout = new BracketLayoutEngine().compute(graph);
    const p1 = layout.positions["1"];
    const p2 = layout.positions["2"];
    const p3 = layout.positions["3"];
    const h1 = layout.heightFor("1");
    const h2 = layout.heightFor("2");
    const h3 = layout.heightFor("3");

    const center1 = p1.y + h1 / 2;
    const center2 = p2.y + h2 / 2;
    const center3 = p3.y + h3 / 2;
    const expectedCenter = (center1 + center2) / 2;

    expect(Math.abs(center3 - expectedCenter)).toBeLessThan(2);
  });
});

describe("BracketParticipantResolver", () => {
  it("parses winner of match placeholder", () => {
    expect(
      BracketParticipantResolver.parseSourceMatchIdFromPlaceholder(
        "Winner of Match 5",
      ),
    ).toBe("5");
  });

  it("resolves nested teamA/teamB objects from API matches", () => {
    const resolver = new BracketParticipantResolver({
      teams: [],
      isTeamOnly: true,
    });
    const participants = resolver.resolveParticipants({
      id: 1,
      stageType: 2,
      matchResult: 2,
      playStatus: 2,
      teamA: { id: 10, teamName: "Winners FC" },
      teamB: { id: 11, teamName: "Runners Up" },
    });
    expect(participants[0].displayName).toBe("Winners FC");
    expect(participants[1].displayName).toBe("Runners Up");
    expect(participants[0].isWinner).toBe(false);
    expect(participants[1].isWinner).toBe(true);
  });

  it("resolves team names from teams array", () => {
    const resolver = new BracketParticipantResolver({
      teams: teams(),
      isTeamOnly: true,
    });
    const participants = resolver.resolveParticipants(
      match({ id: 1, stage: 7, name: "R16", teamA: 1, teamB: 2 }),
    );
    expect(participants[0].displayName).toBe("Team One");
    expect(participants[1].displayName).toBe("Team Two");
  });
});
