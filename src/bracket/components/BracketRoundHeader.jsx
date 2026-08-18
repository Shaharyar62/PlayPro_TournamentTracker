import { BracketCardMetrics } from "../utils/bracketCardMetrics";

export default function BracketRoundHeader({ title, width }) {
  return (
    <div
      className="bracket-round-header"
      style={{ width, height: BracketCardMetrics.headerHeight }}
    >
      <div className="bracket-round-header__pill">
        <span className="bracket-round-header__icon" aria-hidden="true">
          ⎇
        </span>
        <span className="bracket-round-header__title">{title}</span>
      </div>
    </div>
  );
}
