import { BracketEdgeConfidence } from "../models/tournamentBracketGraph";

export class BracketConnectorSegment {
  constructor(from, to, { sourceMatchId = null } = {}) {
    this.from = from;
    this.to = to;
    this.sourceMatchId = sourceMatchId;
  }
}

export class BracketConnectorPathBuilder {
  constructor({
    graph,
    positions,
    cardWidth,
    cardHeight,
    cardHeights = {},
    roundColumnX = {},
    connectorGutter = 24,
  }) {
    this.graph = graph;
    this.positions = positions;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.cardHeights = cardHeights;
    this.roundColumnX = roundColumnX;
    this.connectorGutter = connectorGutter;
  }

  _heightFor(matchId) {
    return this.cardHeights[matchId] ?? this.cardHeight;
  }

  _sourceAnchor(matchId, pos) {
    const h = this._heightFor(matchId);
    return { x: pos.x + this.cardWidth, y: pos.y + h / 2 };
  }

  _targetAnchor(matchId, pos) {
    const h = this._heightFor(matchId);
    return { x: pos.x, y: pos.y + h / 2 };
  }

  buildSegments() {
    const segments = [];
    const feederGroups = this._feederGroupsByTarget();

    for (const [targetId, sourceIds] of Object.entries(feederGroups)) {
      const targetPos = this.positions[targetId];
      if (!targetPos || !sourceIds.length) continue;

      const sourceCenters = [];
      for (const sourceId of sourceIds) {
        const src = this.positions[sourceId];
        if (!src) continue;
        sourceCenters.push(this._sourceAnchor(sourceId, src));
      }
      if (!sourceCenters.length) continue;

      const targetCenter = this._targetAnchor(targetId, targetPos);
      const junctionX = this._junctionXForTarget(targetId, sourceIds[0]);
      segments.push(
        ...this._buildForkPath(
          sourceCenters,
          sourceIds,
          junctionX,
          targetCenter,
        ),
      );
    }

    return BracketConnectorPathBuilder._dedupeSegments(segments);
  }

  static orthogonalPath(from, to, { sourceMatchId = null } = {}) {
    if (Math.abs(from.y - to.y) < 0.5) {
      return [new BracketConnectorSegment(from, to, { sourceMatchId })];
    }
    if (Math.abs(from.x - to.x) < 0.5) {
      return [new BracketConnectorSegment(from, to, { sourceMatchId })];
    }
    const mid = { x: to.x, y: from.y };
    return [
      new BracketConnectorSegment(from, mid, { sourceMatchId }),
      new BracketConnectorSegment(mid, to, { sourceMatchId }),
    ];
  }

  _feederGroupsByTarget() {
    const groups = {};
    const drawableEdges = this._drawableEdges();

    for (const edge of drawableEdges) {
      if (!groups[edge.targetMatchId]) groups[edge.targetMatchId] = [];
      groups[edge.targetMatchId].push(edge.sourceMatchId);
    }

    for (let i = 0; i < this.graph.rounds.length - 1; i++) {
      const left = this.graph.rounds[i];
      const right = this.graph.rounds[i + 1];
      const leftCount = left.matches.length;
      const rightCount = right.matches.length;
      if (leftCount <= rightCount || rightCount === 0) continue;
      if (leftCount % rightCount !== 0) continue;

      const ratio = Math.floor(leftCount / rightCount);
      for (let t = 0; t < rightCount; t++) {
        const targetId = right.matches[t].id;
        const existing = groups[targetId] ?? [];
        if (existing.length >= ratio) continue;

        const structuralSources = [];
        for (let s = 0; s < ratio; s++) {
          const sourceIdx = t * ratio + s;
          if (sourceIdx >= leftCount) break;
          structuralSources.push(left.matches[sourceIdx].id);
        }
        if (structuralSources.length >= 2) {
          groups[targetId] = structuralSources;
        }
      }
    }

    return groups;
  }

  _junctionXForTarget(targetId, sampleSourceId) {
    const targetRound = this._roundForMatchId(targetId);
    const sourceRound = this._roundForMatchId(sampleSourceId);
    if (
      targetRound &&
      sourceRound &&
      this.roundColumnX[sourceRound.id] != null &&
      this.roundColumnX[targetRound.id] != null
    ) {
      const leftX = this.roundColumnX[sourceRound.id];
      return leftX + this.cardWidth + this.connectorGutter / 2;
    }

    const targetPos = this.positions[targetId];
    if (!targetPos) return 0;
    return targetPos.x - this.connectorGutter / 2;
  }

  _buildForkPath(sourceCenters, sourceIds, junctionX, targetCenter) {
    const segments = [];

    if (sourceCenters.length === 1) {
      segments.push(
        ...BracketConnectorPathBuilder.orthogonalPath(
          sourceCenters[0],
          targetCenter,
          {
            sourceMatchId: sourceIds[0] ?? null,
          },
        ),
      );
      return segments;
    }

    const ys = sourceCenters.map((o) => o.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const junctionY = ys.reduce((a, b) => a + b, 0) / ys.length;

    for (let i = 0; i < sourceCenters.length; i++) {
      const src = sourceCenters[i];
      const sourceId = i < sourceIds.length ? sourceIds[i] : null;
      segments.push(
        new BracketConnectorSegment(
          src,
          { x: junctionX, y: src.y },
          { sourceMatchId: sourceId },
        ),
      );
    }

    if (Math.abs(maxY - minY) > 0.5) {
      segments.push(
        new BracketConnectorSegment(
          { x: junctionX, y: minY },
          { x: junctionX, y: maxY },
        ),
      );
    }

    segments.push(
      ...BracketConnectorPathBuilder.orthogonalPath(
        { x: junctionX, y: junctionY },
        targetCenter,
      ),
    );

    return segments;
  }

  _drawableEdges() {
    const out = [];
    const inferredBetweenColumns = this._safeInferredColumnPairs();

    for (const edge of this.graph.edges) {
      if (edge.shouldDrawConnector) {
        out.push(edge);
        continue;
      }
      if (edge.confidence !== BracketEdgeConfidence.inferred) continue;

      const srcRound = this._roundForMatchId(edge.sourceMatchId);
      const tgtRound = this._roundForMatchId(edge.targetMatchId);
      if (!srcRound || !tgtRound) continue;

      const key = `${srcRound.id}|${tgtRound.id}`;
      if (inferredBetweenColumns.has(key)) {
        out.push(edge);
      }
    }
    return out;
  }

  _safeInferredColumnPairs() {
    const safe = new Set();
    for (let i = 0; i < this.graph.rounds.length - 1; i++) {
      const left = this.graph.rounds[i];
      const right = this.graph.rounds[i + 1];

      const highConfidence = this.graph.edges.some((e) => {
        if (e.confidence === BracketEdgeConfidence.inferred) return false;
        const src = this._roundForMatchId(e.sourceMatchId);
        const tgt = this._roundForMatchId(e.targetMatchId);
        return src?.id === left.id && tgt?.id === right.id;
      });
      if (highConfidence) continue;

      const leftCount = left.matches.length;
      const rightCount = right.matches.length;
      if (leftCount <= rightCount || rightCount === 0) continue;
      if (leftCount % rightCount !== 0) continue;

      safe.add(`${left.id}|${right.id}`);
    }
    return safe;
  }

  _roundForMatchId(matchId) {
    for (const round of this.graph.rounds) {
      if (round.matches.some((m) => m.id === matchId)) return round;
    }
    return null;
  }

  static _dedupeSegments(segments) {
    const seen = new Set();
    const out = [];
    for (const s of segments) {
      const key = `${s.from.x.toFixed(1)},${s.from.y.toFixed(1)}-${s.to.x.toFixed(1)},${s.to.y.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }
}
