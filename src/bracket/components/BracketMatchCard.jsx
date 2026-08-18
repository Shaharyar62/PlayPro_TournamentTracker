import { BracketParticipantResolver } from "../utils/bracketParticipantResolver";
import BracketStatusChip from "./BracketStatusChip";
import { BracketCardMetrics } from "../utils/bracketCardMetrics";
import { hasContent } from "../utils/bracketHelpers";
import moment from "moment-timezone";

function formatDate(raw) {
  if (!hasContent(raw)) return "";
  try {
    const dt = moment(raw).tz("Asia/Karachi");
    const now = moment().tz("Asia/Karachi");
    const timeLabel = dt.format("hh:mm A");
    if (dt.isSame(now, "day")) return timeLabel;
    if (dt.isSame(now.clone().subtract(1, "day"), "day")) {
      return `Yesterday, ${timeLabel}`;
    }
    return dt.format("ddd, D MMM");
  } catch {
    return String(raw ?? "");
  }
}

function hasMatchWinner(match) {
  const a = match.participantA?.isWinner;
  const b = match.participantB?.isWinner;
  return a === true || b === true;
}

function winnerSide(match) {
  if (!match.isCompleted || !hasMatchWinner(match)) return null;
  if (match.participantA?.isWinner === true) return "A";
  if (match.participantB?.isWinner === true) return "B";
  return null;
}

export default function BracketMatchCard({ match, width }) {
  const isLive = match.isLive;
  const isFinalMatch = match.stageType === 4;
  const winner = winnerSide(match);
  const rawMatch = match.rawMatch;
  const parsedResults = BracketParticipantResolver.parseMatchResults(rawMatch);
  const shouldShowScores =
    !BracketParticipantResolver.isWalkOver(rawMatch) &&
    (match.isLive || match.isCompleted);

  const metaParts = [];
  const date = formatDate(match.startDateTime);
  if (date) metaParts.push(date);
  if (hasContent(match.courtName)) metaParts.push(match.courtName.trim());

  const getSideResults = (side) => {
    if (!shouldShowScores) return [];
    return BracketParticipantResolver.getSideResults(rawMatch, side);
  };

  const renderParticipantRow = (participant, side) => {
    if (!participant) return null;

    const isWinner = participant.isWinner === true;
    const showWinnerStyle = match.isCompleted && isWinner && hasMatchWinner(match);
    const sideResults = getSideResults(side);
    const scoreLabel =
      sideResults.length === 0 && shouldShowScores
        ? BracketParticipantResolver.displayScoreLabel(rawMatch, side, {
            isLive: match.isLive,
            isCompleted: match.isCompleted,
          })
        : null;

    const rowClass = [
      "bracket-match-card__participant",
      showWinnerStyle ? "bracket-match-card__participant--winner" : "",
      participant.isPlaceholder ? "bracket-match-card__participant--placeholder" : "",
      match.isCompleted && !isWinner && hasMatchWinner(match)
        ? "bracket-match-card__participant--loser"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div key={side} className={rowClass}>
        <div className="bracket-match-card__participant-name">
          <span>{participant.displayName}</span>
          {showWinnerStyle && (
            <span className="bracket-match-card__trophy" aria-hidden="true">
              🏆
            </span>
          )}
        </div>
        <div className="bracket-match-card__scores">
          {sideResults.length > 0
            ? sideResults.map((result, idx) => {
                const score =
                  parseInt(String(result.points ?? "0"), 10) || 0;
                const round = result.round;
                const opponent = parsedResults.find(
                  (e) => e?.side !== side && e?.round === round,
                ) ?? { points: 0 };
                const oppScore =
                  parseInt(String(opponent.points ?? "0"), 10) || 0;
                const wonSet = score > oppScore;
                return (
                  <span
                    key={`${side}-${round}-${idx}`}
                    className={`bracket-match-card__score ${
                      wonSet ? "bracket-match-card__score--won" : ""
                    }`}
                  >
                    {score}
                  </span>
                );
              })
            : scoreLabel != null && (
                <span
                  className={`bracket-match-card__score ${
                    isWinner && hasMatchWinner(match)
                      ? "bracket-match-card__score--won"
                      : ""
                  }`}
                >
                  {scoreLabel}
                </span>
              )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={[
        "bracket-match-card",
        isLive ? "bracket-match-card--live" : "",
        isFinalMatch ? "bracket-match-card--final" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width }}
    >
      {isLive && <div className="bracket-match-card__live-accent" />}
      {winner && (
        <div
          className="bracket-match-card__progression-cap"
          style={{
            top: BracketCardMetrics.participantRowTopY(match, winner),
          }}
        />
      )}

      <div className="bracket-match-card__meta">
        <span className="bracket-match-card__meta-text">
          {metaParts.join(" · ")}
        </span>
        <BracketStatusChip match={match} />
      </div>

      {renderParticipantRow(match.participantA, "A")}
      {match.participantB && !match.participantB.isBye &&
        renderParticipantRow(match.participantB, "B")}
    </div>
  );
}
