import {
  createBracketEdge,
  createBracketMatchNode,
  createBracketRound,
  createTournamentBracketGraph,
  BracketEdgeConfidence,
} from "../models/tournamentBracketGraph";
import { BracketParticipantResolver } from "./bracketParticipantResolver";
import { BracketStageOrder } from "./bracketStageOrder";

class RoundBucket {
  constructor({ id, name, stageType }) {
    this.id = id;
    this.name = name;
    this.stageType = stageType;
    this.matches = [];
    this.stageTypeValues = [];
    this.startTimes = [];
    this.roundOrderHints = [];
    this.appearanceIndex = null;
  }

  get _earliestStartTime() {
    const times = this.startTimes
      .filter((t) => typeof t === "string" && t.length > 0)
      .sort();
    return times.length ? times[0] : null;
  }

  get _minRoundOrderHint() {
    const hints = this.roundOrderHints.filter((h) => typeof h === "number");
    if (!hints.length) return null;
    return Math.min(...hints);
  }

  compareSortKey(other) {
    const aHint = this._minRoundOrderHint;
    const bHint = other._minRoundOrderHint;
    if (aHint != null && bHint != null) return aHint - bHint;
    if (aHint != null) return -1;
    if (bHint != null) return 1;

    const stageCmp =
      BracketStageOrder.progressionIndex(this.stageType) -
      BracketStageOrder.progressionIndex(other.stageType);
    if (stageCmp !== 0) return stageCmp;

    const aTime = this._earliestStartTime;
    const bTime = other._earliestStartTime;
    if (aTime && bTime) return aTime.localeCompare(bTime);
    if (aTime) return -1;
    if (bTime) return 1;

    return (this.appearanceIndex ?? 0) - (other.appearanceIndex ?? 0);
  }
}

function _visibleBracketMatches(matches) {
  const visible = matches
    .filter((m) => m && typeof m === "object")
    .map((e) => ({ ...e }))
    .filter((m) => m.is_schedule_visible_on_app !== false);

  if (!visible.length) return [];

  const knockoutExists = visible.some(
    (m) => !BracketStageOrder.isGroupStage(_stageType(m)),
  );
  return knockoutExists
    ? visible.filter((m) => !BracketStageOrder.isGroupStage(_stageType(m)))
    : visible;
}

function _matchId(match) {
  return String(match.id ?? match.matchId ?? "");
}

function _stageType(match) {
  const v = match.stageType;
  if (typeof v === "number") return v;
  const parsed = parseInt(String(v), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function _playStatus(match) {
  const v = match.playStatus;
  if (typeof v === "number") return v;
  const parsed = parseInt(String(v), 10);
  if (!Number.isNaN(parsed)) return parsed;

  const result = match.matchResult;
  if (result === 1 || result === 2) return 2;
  if (match.isResultUploaded === true || match.isResultUploaded === 1) return 2;
  return null;
}

function _startDateTime(match) {
  return (
    match.startDateTime?.toString() ??
    match.matchStartDateTime?.toString() ??
    null
  );
}

function _displayOrderHint(match, fallback) {
  for (const key of [
    "bracketOrder",
    "displayOrder",
    "sortOrder",
    "matchNumber",
  ]) {
    const v = match[key];
    if (typeof v === "number") return v;
    const parsed = parseInt(String(v), 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function _roundOrderHint(match) {
  for (const key of ["roundOrder", "roundIndex", "bracketRound"]) {
    const v = match[key];
    if (typeof v === "number") return v;
    const parsed = parseInt(String(v), 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function _explicitSourceIds(match) {
  const ids = [];
  for (const key of [
    "sourceMatchIds",
    "parentMatchIds",
    "feederMatchIds",
    "source_match_ids",
  ]) {
    const v = match[key];
    if (Array.isArray(v)) {
      for (const item of v) ids.push(String(item));
    } else if (v != null) {
      ids.push(String(v));
    }
  }
  for (const key of ["sourceMatchId", "parentMatchId", "feederMatchId"]) {
    if (match[key] != null) ids.push(String(match[key]));
  }
  return ids;
}

function _nextMatchId(match) {
  for (const key of ["nextMatchId", "next_match_id"]) {
    if (match[key] != null) return String(match[key]);
  }
  return null;
}

function _addEdge(edges, sourceId, targetId, confidence) {
  if (sourceId === targetId) return;
  const exists = edges.some(
    (e) => e.sourceMatchId === sourceId && e.targetMatchId === targetId,
  );
  if (exists) return;
  edges.push(
    createBracketEdge({
      sourceMatchId: sourceId,
      targetMatchId: targetId,
      confidence,
    }),
  );
}

function _addPositionalEdges(edges, left, right) {
  const leftCount = left.matches.length;
  const rightCount = right.matches.length;
  if (leftCount <= rightCount || rightCount === 0) return;
  if (leftCount % rightCount !== 0) return;

  const ratio = Math.floor(leftCount / rightCount);
  for (let t = 0; t < rightCount; t++) {
    for (let s = 0; s < ratio; s++) {
      const sourceIdx = t * ratio + s;
      if (sourceIdx >= leftCount) break;
      _addEdge(
        edges,
        left.matches[sourceIdx].id,
        right.matches[t].id,
        BracketEdgeConfidence.inferred,
      );
    }
  }
}

function _roundForMatchId(matchId, rounds) {
  for (const round of rounds) {
    if (round.matches.some((m) => m.id === matchId)) return round;
  }
  return null;
}

function _hasCanonicalCoverage(edges, left, right, ratio) {
  const leftIds = new Set(left.matches.map((m) => m.id));
  const usedLeft = new Set();

  for (const target of right.matches) {
    const incoming = new Set(
      edges
        .filter(
          (e) => e.targetMatchId === target.id && leftIds.has(e.sourceMatchId),
        )
        .map((e) => e.sourceMatchId),
    );
    if (incoming.size !== ratio) return false;
    for (const src of incoming) {
      if (usedLeft.has(src)) return false;
      usedLeft.add(src);
    }
  }

  return usedLeft.size === left.matches.length;
}

function _reconcileColumnEdges(edges, rounds, nextMatchEdgeKeys) {
  for (let i = 0; i < rounds.length - 1; i++) {
    const left = rounds[i];
    const right = rounds[i + 1];
    const leftCount = left.matches.length;
    const rightCount = right.matches.length;
    if (leftCount <= rightCount || rightCount === 0) continue;
    if (leftCount % rightCount !== 0) continue;

    const ratio = Math.floor(leftCount / rightCount);

    const hasExplicitFeeders = right.matches.some(
      (m) => _explicitSourceIds(m.rawMatch).length > 0,
    );
    if (hasExplicitFeeders) continue;

    if (_hasCanonicalCoverage(edges, left, right, ratio)) continue;

    for (let j = edges.length - 1; j >= 0; j--) {
      const e = edges[j];
      const srcRound = _roundForMatchId(e.sourceMatchId, rounds);
      const tgtRound = _roundForMatchId(e.targetMatchId, rounds);
      if (srcRound?.id !== left.id || tgtRound?.id !== right.id) continue;

      if (e.confidence === BracketEdgeConfidence.placeholderParse) continue;
      if (
        e.confidence === BracketEdgeConfidence.explicit &&
        !nextMatchEdgeKeys.has(`${e.sourceMatchId}|${e.targetMatchId}`)
      ) {
        continue;
      }

      if (
        e.confidence === BracketEdgeConfidence.winnerTrace ||
        e.confidence === BracketEdgeConfidence.inferred ||
        e.confidence === BracketEdgeConfidence.explicit
      ) {
        edges.splice(j, 1);
      }
    }

    _addPositionalEdges(edges, left, right);
  }
}

function _compareMatchesInRound(a, b, stageType) {
  if (BracketStageOrder.isGroupStage(stageType)) {
    const groupCmp = BracketStageOrder.compareGroups(
      a.rawMatch.group1 ?? a.rawMatch.group,
      b.rawMatch.group1 ?? b.rawMatch.group,
    );
    if (groupCmp !== 0) return groupCmp;
  }

  const orderCmp = a.displayOrder - b.displayOrder;
  if (orderCmp !== 0) return orderCmp;

  const timeA = a.startDateTime ?? "";
  const timeB = b.startDateTime ?? "";
  return timeA.localeCompare(timeB);
}

function _roundSortOrderForMatch(match, buckets) {
  const key = BracketStageOrder.roundKey(_stageType(match));
  const idx = buckets.findIndex((b) => b.id === key);
  return idx >= 0 ? idx : 0;
}

function _buildNode(resolver, match, matchId, roundKey, displayOrder) {
  return createBracketMatchNode({
    id: matchId,
    roundId: roundKey,
    participants: resolver.resolveParticipants(match),
    rawMatch: match,
    playStatus: _playStatus(match),
    matchResult:
      typeof match.matchResult === "number"
        ? match.matchResult
        : parseInt(String(match.matchResult ?? ""), 10) || null,
    startDateTime: _startDateTime(match),
    courtName: match.courtName?.toString() ?? null,
    displayOrder,
    stageType: _stageType(match),
    stageTypeName: match.stageTypeName?.toString() ?? null,
  });
}

export const BracketGraphBuilder = {
  structureFingerprint(matches) {
    const bracketMatches = _visibleBracketMatches(matches);
    if (!bracketMatches.length) return "";

    const parts = bracketMatches.map(
      (match) => `${_matchId(match)}:${_stageType(match) ?? 0}`,
    );
    parts.sort();
    return parts.join("|");
  },

  updateMatchDataOnly({ existing, matches, teams, isTeamOnly }) {
    const bracketMatches = _visibleBracketMatches(matches);
    const matchById = Object.fromEntries(
      bracketMatches.map((match) => [_matchId(match), match]),
    );

    const resolver = new BracketParticipantResolver({ teams, isTeamOnly });

    const updatedRounds = existing.rounds.map((round) =>
      createBracketRound({
        id: round.id,
        name: round.name,
        sortOrder: round.sortOrder,
        matches: round.matches.map((node) => {
          const raw = matchById[node.id];
          if (!raw) return node;
          return _buildNode(
            resolver,
            raw,
            node.id,
            node.roundId,
            node.displayOrder,
          );
        }),
      }),
    );

    return createTournamentBracketGraph({
      rounds: updatedRounds,
      edges: existing.edges,
      hasExplicitGraph: existing.hasExplicitGraph,
    });
  },

  build({ matches, teams, isTeamOnly }) {
    const bracketMatches = _visibleBracketMatches(matches);
    if (!bracketMatches.length) {
      return createTournamentBracketGraph({ rounds: [], edges: [] });
    }

    const resolver = new BracketParticipantResolver({ teams, isTeamOnly });
    const roundBuckets = {};
    let appearanceIndex = 0;

    for (const match of bracketMatches) {
      const stageType = _stageType(match);
      const roundKey = BracketStageOrder.roundKey(stageType);
      const roundName = BracketStageOrder.displayName(stageType);

      if (!roundBuckets[roundKey]) {
        roundBuckets[roundKey] = new RoundBucket({
          id: roundKey,
          name: roundName,
          stageType,
        });
      }

      const bucket = roundBuckets[roundKey];
      if (bucket.appearanceIndex == null)
        bucket.appearanceIndex = appearanceIndex;
      bucket.stageTypeValues.push(_stageType(match));
      bucket.startTimes.push(_startDateTime(match));
      bucket.roundOrderHints.push(_roundOrderHint(match));

      const matchId = _matchId(match);
      bucket.matches.push(
        _buildNode(
          resolver,
          match,
          matchId,
          roundKey,
          _displayOrderHint(match, bucket.matches.length),
        ),
      );
      appearanceIndex++;
    }

    const sortedBuckets = Object.values(roundBuckets).sort((a, b) =>
      a.compareSortKey(b),
    );

    let sortOrder = 0;
    const rounds = [];
    const nodesById = {};

    for (const bucket of sortedBuckets) {
      const sortedMatches = [...bucket.matches].sort((a, b) =>
        _compareMatchesInRound(a, b, bucket.stageType),
      );
      for (const m of sortedMatches) {
        nodesById[m.id] = m;
      }
      rounds.push(
        createBracketRound({
          id: bucket.id,
          name: bucket.name,
          sortOrder: sortOrder++,
          matches: sortedMatches,
        }),
      );
    }

    const edges = [];
    const nextMatchEdgeKeys = new Set();
    let hasExplicit = false;

    for (const match of bracketMatches) {
      const targetId = _matchId(match);
      const explicitSources = _explicitSourceIds(match);
      if (explicitSources.length) {
        hasExplicit = true;
        for (const src of explicitSources) {
          _addEdge(edges, src, targetId, BracketEdgeConfidence.explicit);
        }
      }
      const nextId = _nextMatchId(match);
      if (nextId && nodesById[nextId]) {
        hasExplicit = true;
        _addEdge(edges, targetId, nextId, BracketEdgeConfidence.explicit);
        nextMatchEdgeKeys.add(`${targetId}|${nextId}`);
      }
    }

    if (!hasExplicit) {
      const teamToLaterMatchIds = {};
      for (const target of bracketMatches) {
        const targetId = _matchId(target);
        const targetRoundOrder = _roundSortOrderForMatch(target, sortedBuckets);
        for (const side of ["A", "B"]) {
          const teamId = BracketParticipantResolver.teamIdFromMatch(
            target,
            side,
          );
          if (teamId == null) continue;
          if (!teamToLaterMatchIds[teamId]) teamToLaterMatchIds[teamId] = [];
          teamToLaterMatchIds[teamId].push({
            order: targetRoundOrder,
            id: targetId,
          });
        }
      }

      for (const source of bracketMatches) {
        const sourceId = _matchId(source);
        const sourceRoundOrder = _roundSortOrderForMatch(source, sortedBuckets);
        const winnerId = BracketParticipantResolver.winnerTeamId(source);
        if (winnerId == null) continue;

        const laterTargets = [
          ...new Set(
            (teamToLaterMatchIds[winnerId] ?? [])
              .filter((entry) => entry.order > sourceRoundOrder)
              .map((entry) => entry.id),
          ),
        ];

        if (laterTargets.length === 1) {
          _addEdge(
            edges,
            sourceId,
            laterTargets[0],
            BracketEdgeConfidence.winnerTrace,
          );
        }
      }
    }

    for (const match of bracketMatches) {
      const targetId = _matchId(match);
      for (const side of ["A", "B"]) {
        const name = BracketParticipantResolver.nameFromMatch(match, side);
        if (!name) continue;
        const teamId = BracketParticipantResolver.teamIdFromMatch(match, side);
        if (teamId != null) continue;

        const sourceRef =
          BracketParticipantResolver.parseSourceMatchIdFromPlaceholder(name);
        if (!sourceRef) continue;

        let resolvedSourceId = null;
        if (nodesById[sourceRef]) {
          resolvedSourceId = sourceRef;
        } else {
          for (const [key] of Object.entries(nodesById)) {
            if (key === sourceRef || key.endsWith(sourceRef)) {
              resolvedSourceId = key;
              break;
            }
          }
        }
        if (resolvedSourceId) {
          _addEdge(
            edges,
            resolvedSourceId,
            targetId,
            BracketEdgeConfidence.placeholderParse,
          );
        }
      }
    }

    for (let i = 0; i < rounds.length - 1; i++) {
      const left = rounds[i];
      const right = rounds[i + 1];
      const hasEdgesBetween = edges.some((e) => {
        const srcRound = _roundForMatchId(e.sourceMatchId, rounds);
        const tgtRound = _roundForMatchId(e.targetMatchId, rounds);
        return srcRound?.id === left.id && tgtRound?.id === right.id;
      });
      if (hasEdgesBetween) continue;
      _addPositionalEdges(edges, left, right);
    }

    _reconcileColumnEdges(edges, rounds, nextMatchEdgeKeys);

    return createTournamentBracketGraph({
      rounds,
      edges,
      hasExplicitGraph: hasExplicit,
    });
  },
};
