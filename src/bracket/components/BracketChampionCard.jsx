import { BracketCardMetrics } from "../utils/bracketCardMetrics";

export default function BracketChampionCard({ winner, width }) {
  const hasWinner = winner != null && winner.isWinner === true;

  return (
    <div
      className={`bracket-champion-card ${
        hasWinner ? "bracket-champion-card--has-winner" : ""
      }`}
      style={{
        width,
        minHeight: BracketCardMetrics.championCardHeight,
      }}
    >
      <span className="bracket-champion-card__icon" aria-hidden="true">
        🏆
      </span>
      <span className="bracket-champion-card__badge">Winner</span>
      <span className="bracket-champion-card__name">
        {hasWinner ? winner.displayName : "TBD"}
      </span>
    </div>
  );
}
