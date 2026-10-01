import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ScorebugOverlay from "../ScorebugOverlay.jsx";

const matchData = {
  teamA: { teamName: "Islamabad Pulse Active" },
  teamB: { teamName: "Team Maidan" },
};

const settings = {
  numberOfSets: 3,
  numberOfGames: 6,
  matchFormat: 3,
};

function labels(liveMatchData) {
  const html = renderToStaticMarkup(
    React.createElement(ScorebugOverlay, { matchData, liveMatchData })
  );
  return [...html.matchAll(/scorebug-set-label">([^<]+)/g)].map((m) => m[1]);
}

describe("scorebug visible set columns", () => {
  it("shows only S1 before any set is won", () => {
    expect(
      labels({
        matchSettings: settings,
        team1: { sets: 0 },
        team2: { sets: 0 },
        sets: {
          0: { team1Games: 0, team2Games: 0 },
          1: { team1Games: 0, team2Games: 0 },
          2: { team1Games: 0, team2Games: 0 },
        },
      })
    ).toEqual(["S1"]);
  });

  it("shows S2 after set 1 is won", () => {
    expect(
      labels({
        matchSettings: settings,
        team1: { sets: 1 },
        team2: { sets: 0 },
        sets: {
          0: { team1Games: 6, team2Games: 4 },
          1: { team1Games: 0, team2Games: 0 },
        },
      })
    ).toEqual(["S1", "S2"]);
  });

  it("keeps the current column during an undecided tiebreak", () => {
    expect(
      labels({
        matchSettings: settings,
        team1: { sets: 0 },
        team2: { sets: 0 },
        isInTiebreak: true,
        sets: {
          0: { team1Games: 6, team2Games: 6, isTiebreak: true },
        },
      })
    ).toEqual(["S1"]);
  });

  it("shows S3 after a 7-6 tiebreak set is won", () => {
    expect(
      labels({
        matchSettings: settings,
        team1: { sets: 1 },
        team2: { sets: 1 },
        sets: {
          0: { team1Games: 7, team2Games: 6, isTiebreak: true },
          1: { team1Games: 6, team2Games: 3 },
          2: { team1Games: 0, team2Games: 0 },
        },
      })
    ).toEqual(["S1", "S2", "S3"]);
  });

  it("falls back to set scores when sets-won counters are missing", () => {
    expect(
      labels({
        matchSettings: settings,
        sets: {
          0: { team1Games: 6, team2Games: 2 },
          1: { team1Games: 1, team2Games: 0 },
        },
      })
    ).toEqual(["S1", "S2"]);
  });

  it("labels the third column STB in a two-set super tiebreak", () => {
    expect(
      labels({
        matchSettings: {
          numberOfSets: 2,
          numberOfGames: 6,
          matchFormat: 2,
        },
        team1: { sets: 1 },
        team2: { sets: 1 },
        sets: {
          0: { team1Games: 6, team2Games: 4 },
          1: { team1Games: 6, team2Games: 4 },
        },
      })
    ).toEqual(["S1", "S2", "STB"]);
  });
});
