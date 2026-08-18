export const BracketEdgeConfidence = Object.freeze({
  explicit: "explicit",
  winnerTrace: "winnerTrace",
  placeholderParse: "placeholderParse",
  inferred: "inferred",
});

export function createBracketParticipant({
  displayName,
  logoUrl = null,
  teamId = null,
  isPlaceholder = false,
  isBye = false,
  isWinner = null,
  side = null,
}) {
  return {
    displayName,
    logoUrl,
    teamId,
    isPlaceholder,
    isBye,
    isWinner,
    side,
  };
}

export function createBracketMatchNode({
  id,
  roundId,
  participants,
  rawMatch,
  playStatus = null,
  matchResult = null,
  startDateTime = null,
  courtName = null,
  displayOrder = 0,
  stageType = null,
  stageTypeName = null,
}) {
  return {
    id,
    roundId,
    participants,
    rawMatch,
    playStatus,
    matchResult,
    startDateTime,
    courtName,
    displayOrder,
    stageType,
    stageTypeName,
    get participantA() {
      return participants.length > 0 ? participants[0] : null;
    },
    get participantB() {
      return participants.length > 1 ? participants[1] : null;
    },
    get isLive() {
      return playStatus === 1;
    },
    get isCompleted() {
      return playStatus === 2;
    },
    get isPending() {
      return playStatus === 0 || playStatus == null;
    },
  };
}

export function createBracketRound({ id, name, sortOrder, matches }) {
  return { id, name, sortOrder, matches };
}

export function createBracketEdge({ sourceMatchId, targetMatchId, confidence }) {
  return {
    sourceMatchId,
    targetMatchId,
    confidence,
    get shouldDrawConnector() {
      return (
        confidence === BracketEdgeConfidence.explicit ||
        confidence === BracketEdgeConfidence.winnerTrace ||
        confidence === BracketEdgeConfidence.placeholderParse
      );
    },
  };
}

export function createTournamentBracketGraph({
  rounds,
  edges,
  hasExplicitGraph = false,
}) {
  return {
    rounds,
    edges,
    hasExplicitGraph,
    get isEmpty() {
      return rounds.length === 0;
    },
    get matchCount() {
      return rounds.reduce((sum, round) => sum + round.matches.length, 0);
    },
    hasSameStructure(other) {
      if (rounds.length !== other.rounds.length) return false;
      for (let i = 0; i < rounds.length; i++) {
        const left = rounds[i];
        const right = other.rounds[i];
        if (
          left.id !== right.id ||
          left.matches.length !== right.matches.length
        ) {
          return false;
        }
        for (let j = 0; j < left.matches.length; j++) {
          if (left.matches[j].id !== right.matches[j].id) return false;
        }
      }
      return true;
    },
    needsLayoutRecompute(fresh) {
      if (!this.hasSameStructure(fresh)) return true;
      for (const round of rounds) {
        for (const match of round.matches) {
          const updated = fresh.matchById(match.id);
          if (!updated) return true;
          if (match.courtName !== updated.courtName) return true;
          if (match.participants.length !== updated.participants.length) {
            return true;
          }
          const oldBye = match.participantB?.isBye ?? false;
          const newBye = updated.participantB?.isBye ?? false;
          if (oldBye !== newBye) return true;
        }
      }
      return false;
    },
    matchById(id) {
      for (const round of rounds) {
        for (const match of round.matches) {
          if (match.id === id) return match;
        }
      }
      return null;
    },
    incomingEdges(targetMatchId) {
      return edges.filter((e) => e.targetMatchId === targetMatchId);
    },
    outgoingEdges(sourceMatchId) {
      return edges.filter((e) => e.sourceMatchId === sourceMatchId);
    },
  };
}

export function createBracketLayoutResult({
  positions,
  contentSize,
  roundColumnX,
  cardWidth,
  cardHeight,
  cardHeights = {},
}) {
  return {
    positions,
    contentSize,
    roundColumnX,
    cardWidth,
    cardHeight,
    cardHeights,
    heightFor(matchId) {
      return cardHeights[matchId] ?? cardHeight;
    },
  };
}

export const EMPTY_GRAPH = createTournamentBracketGraph({
  rounds: [],
  edges: [],
});
