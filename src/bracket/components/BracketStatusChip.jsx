import { BracketParticipantResolver } from "../utils/bracketParticipantResolver";

export const BracketMatchStatusKind = Object.freeze({
  live: "live",
  finished: "finished",
  upcoming: "upcoming",
  walkover: "walkover",
  retired: "retired",
  tbd: "tbd",
});

function isRetired(match) {
  const raw = match.isRetired ?? match.is_retired;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw === 1;
  if (raw == null) return false;
  const normalized = String(raw).trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

export function resolveStatusKind(match) {
  if (match.isLive) return BracketMatchStatusKind.live;

  const raw = match.rawMatch;
  if (match.isCompleted) {
    if (BracketParticipantResolver.isWalkOver(raw)) {
      return BracketMatchStatusKind.walkover;
    }
    if (isRetired(raw)) return BracketMatchStatusKind.retired;
    return BracketMatchStatusKind.finished;
  }

  if (match.isPending) {
    const a = match.participantA;
    const b = match.participantB;
    const hasKnownSides =
      a &&
      b &&
      !a.isPlaceholder &&
      !b.isPlaceholder &&
      !a.isBye &&
      !b.isBye;
    if (hasKnownSides) return BracketMatchStatusKind.upcoming;
    return BracketMatchStatusKind.tbd;
  }

  return BracketMatchStatusKind.tbd;
}

export function statusLabelFor(match) {
  switch (resolveStatusKind(match)) {
    case BracketMatchStatusKind.live:
      return "LIVE";
    case BracketMatchStatusKind.finished:
      return null;
    case BracketMatchStatusKind.upcoming:
      return "Upcoming";
    case BracketMatchStatusKind.walkover:
      return "Walkover";
    case BracketMatchStatusKind.retired:
      return "Retired";
    default:
      return null;
  }
}

export default function BracketStatusChip({ match }) {
  const label = statusLabelFor(match);
  if (!label) return null;

  const kind = resolveStatusKind(match);
  const isLive = kind === BracketMatchStatusKind.live;

  return (
    <span
      className={`bracket-status-chip bracket-status-chip--${kind}`}
      data-live={isLive ? "true" : undefined}
    >
      {isLive && <span className="bracket-status-chip__dot" />}
      {label}
    </span>
  );
}
