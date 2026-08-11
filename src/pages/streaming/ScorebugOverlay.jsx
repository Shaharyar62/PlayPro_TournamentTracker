import React from "react";
import { getScoreDisplayString } from "../../umpireScoring/utils/scoringRules.js";
import {
  ScorebugWrap,
  ScorebugBar,
  ScorebugPanel,
  ScorebugFooter,
  AnimatedScoreValue,
  AnimatedServeIndicator,
  AnimatedTeamRow,
  AnimatedHeaderLabel,
  AnimatedWarning,
  useScoreChangeFlash,
} from "./ScorebugAnimations.jsx";

function getNumberOfSets(liveMatchData) {
  if (liveMatchData?.matchSettings?.matchFormat === 2) return 3;
  if (liveMatchData?.matchSettings?.numberOfSets) {
    return liveMatchData.matchSettings.numberOfSets;
  }
  return 3;
}

function getSetScore(teamIndex, setIndex, liveMatchData, matchData) {
  if (liveMatchData?.sets?.[setIndex.toString()]) {
    const teamKey = teamIndex === 1 ? "team1Games" : "team2Games";
    return liveMatchData.sets[setIndex.toString()][teamKey] || 0;
  }
  if (matchData?.results?.sets?.[setIndex]) {
    return matchData.results.sets[setIndex][`team${teamIndex}`] || "0";
  }
  return setIndex === 0 ? "0" : "-";
}

function getCurrentGameScore(teamIndex, liveMatchData, matchData) {
  if (liveMatchData) {
    const teamKey = teamIndex === 1 ? "team1" : "team2";
    const opponentKey = teamIndex === 1 ? "team2" : "team1";
    const teamScore = liveMatchData[teamKey]?.score || 0;
    const opponentScore = liveMatchData[opponentKey]?.score || 0;
    const isInTiebreak =
      liveMatchData.isInTiebreak || liveMatchData.isInSuperTiebreak;

    if (isInTiebreak) {
      return liveMatchData[teamKey]?.tiebreakScore || 0;
    }

    const totalAdvantageExchanges =
      (liveMatchData.team1?.advantageCount || 0) +
      (liveMatchData.team2?.advantageCount || 0);

    return getScoreDisplayString(teamScore, opponentScore, {
      isInTiebreak: false,
      matchSettings: liveMatchData.matchSettings,
      teamAdvantageCount: liveMatchData[teamKey]?.advantageCount || 0,
      totalAdvantageExchanges,
    });
  }

  if (matchData?.results?.currentGame) {
    return matchData.results.currentGame[`team${teamIndex}`] || "0";
  }
  return "0";
}

function getTeamName(team) {
  return team?.teamName || team?.name || "Team";
}

function isServingTeam(teamIndex, liveMatchData) {
  if (!liveMatchData?.currentServe) return false;
  const isServingTeam1 = liveMatchData.currentServe.isServingTeam1;
  return teamIndex === 1 ? isServingTeam1 : !isServingTeam1;
}

function getTeamWarnings(teamIndex, liveMatchData) {
  if (liveMatchData) {
    const teamKey = teamIndex === 1 ? "team1" : "team2";
    return liveMatchData[teamKey]?.warnings || [];
  }
  return [];
}

function getHeaderText(liveMatchData) {
  if (liveMatchData?.isInSuperTiebreak) return "SUPER TIE BREAK";
  if (liveMatchData?.isInTiebreak) return "TIE BREAK";
  return "SCORE";
}

const ScorebugOverlay = ({ matchData, liveMatchData }) => {
  const setCount = getNumberOfSets(liveMatchData);
  const pointScore1 = getCurrentGameScore(1, liveMatchData, matchData);
  const pointScore2 = getCurrentGameScore(2, liveMatchData, matchData);

  const setScores = {};
  for (let i = 0; i < setCount; i++) {
    setScores[`s${i}_t1`] = getSetScore(1, i, liveMatchData, matchData);
    setScores[`s${i}_t2`] = getSetScore(2, i, liveMatchData, matchData);
  }

  const flashKeys = useScoreChangeFlash({
    p1: pointScore1,
    p2: pointScore2,
    ...setScores,
  });

  const pointsFlash = flashKeys.has("p1") || flashKeys.has("p2");
  const setFlash = (setIndex, teamIndex) =>
    flashKeys.has(`s${setIndex}_t${teamIndex}`);

  const renderTeamRow = (teamIndex, team) => (
    <AnimatedTeamRow key={teamIndex} serving={isServingTeam(teamIndex, liveMatchData)}>
      <div className="scorebug-name-wrap">
        <AnimatedServeIndicator show={isServingTeam(teamIndex, liveMatchData)} />
        <span className="scorebug-name">{getTeamName(team)}</span>
      </div>
      <div className="scorebug-warnings">
        {getTeamWarnings(teamIndex, liveMatchData).map((warning, index) => (
          <AnimatedWarning key={`${warning}-${index}`} code={warning} />
        ))}
      </div>
    </AnimatedTeamRow>
  );

  return (
    <ScorebugWrap visible={Boolean(matchData)}>
      <ScorebugBar>
        <ScorebugPanel className="scorebug-panel--names">
          <div className="scorebug-panel-inner">
            {renderTeamRow(1, matchData.teamA)}
            {renderTeamRow(2, matchData.teamB)}
          </div>
        </ScorebugPanel>

        {Array.from({ length: setCount }, (_, setIndex) => (
          <ScorebugPanel
            key={setIndex}
            className="scorebug-panel--set"
            flash={setFlash(setIndex, 1) || setFlash(setIndex, 2)}
          >
            <div className="scorebug-panel-inner scorebug-set-inner">
              <span className="scorebug-set-label">
                {setIndex === 2 && liveMatchData?.matchSettings?.matchFormat === 2
                  ? "STB"
                  : `S${setIndex + 1}`}
              </span>
              <AnimatedScoreValue
                value={getSetScore(1, setIndex, liveMatchData, matchData)}
                className="scorebug-set-score"
              />
              <AnimatedScoreValue
                value={getSetScore(2, setIndex, liveMatchData, matchData)}
                className="scorebug-set-score"
              />
            </div>
          </ScorebugPanel>
        ))}

        <ScorebugPanel className="scorebug-panel--points" flash={pointsFlash}>
          <div className="scorebug-panel-inner scorebug-points-inner">
            <AnimatedHeaderLabel text={getHeaderText(liveMatchData)} />
            <AnimatedScoreValue
              value={pointScore1}
              className="scorebug-points-score"
            />
            <AnimatedScoreValue
              value={pointScore2}
              className="scorebug-points-score"
            />
          </div>
        </ScorebugPanel>
      </ScorebugBar>

      <ScorebugFooter>Live Scoring by PlayPro</ScorebugFooter>
    </ScorebugWrap>
  );
};

export default ScorebugOverlay;
