import { createBracketLayoutResult } from "../models/tournamentBracketGraph";
import { hasContent } from "./bracketHelpers";

export class BracketLayoutEngine {
  constructor({
    cardWidth = 280,
    cardHeight = 96,
    verticalGap = 16,
    columnGap = 48,
    connectorGutter = 24,
    headerHeight = 44,
    horizontalPadding = 16,
    componentGap = 32,
  } = {}) {
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.verticalGap = verticalGap;
    this.columnGap = columnGap;
    this.connectorGutter = connectorGutter;
    this.headerHeight = headerHeight;
    this.horizontalPadding = horizontalPadding;
    this.componentGap = componentGap;
  }

  static estimateCardHeight(match) {
    let height = 96;
    if (hasContent(match.courtName)) height += 14;
    if (match.participantB == null || match.participantB.isBye) {
      height -= 12;
    }
    return height;
  }

  compute(graph) {
    if (graph.isEmpty) {
      return createBracketLayoutResult({
        positions: {},
        contentSize: { width: 0, height: 0 },
        roundColumnX: {},
        cardWidth: this.cardWidth,
        cardHeight: this.cardHeight,
      });
    }

    const cardHeights = {};
    for (const round of graph.rounds) {
      for (const match of round.matches) {
        cardHeights[match.id] = BracketLayoutEngine.estimateCardHeight(match);
      }
    }

    const roundColumnX = {};
    const columnWidth = this.cardWidth + this.columnGap + this.connectorGutter;

    for (let i = 0; i < graph.rounds.length; i++) {
      roundColumnX[graph.rounds[i].id] =
        this.horizontalPadding + i * columnWidth;
    }

    const components = this._findComponents(graph);
    const positions = {};
    let bandOffsetY = this.headerHeight;

    for (const component of components) {
      const componentPositions = this._layoutComponent(
        graph,
        component,
        roundColumnX,
        cardHeights,
      );
      if (!Object.keys(componentPositions).length) continue;

      const minY = Math.min(...Object.values(componentPositions).map((o) => o.y));
      const shift = bandOffsetY - minY;
      for (const [id, pos] of Object.entries(componentPositions)) {
        positions[id] = { x: pos.x, y: pos.y + shift };
      }

      const maxY = Math.max(
        ...Object.entries(componentPositions).map(
          ([id, pos]) => pos.y + (cardHeights[id] ?? this.cardHeight),
        ),
      );
      bandOffsetY = maxY + shift + this.componentGap;
    }

    let maxX = this.horizontalPadding;
    let maxY = this.headerHeight;
    for (const [id, pos] of Object.entries(positions)) {
      const h = cardHeights[id] ?? this.cardHeight;
      maxX = Math.max(maxX, pos.x + this.cardWidth);
      maxY = Math.max(maxY, pos.y + h);
    }

    return createBracketLayoutResult({
      positions,
      contentSize: {
        width: maxX + this.horizontalPadding,
        height: maxY + this.verticalGap,
      },
      roundColumnX,
      cardWidth: this.cardWidth,
      cardHeight: this.cardHeight,
      cardHeights,
    });
  }

  _layoutComponent(graph, matchIds, globalRoundColumnX, cardHeights) {
    const roundsInComponent = graph.rounds
      .map((r) => ({
        ...r,
        matches: r.matches.filter((m) => matchIds.has(m.id)),
      }))
      .filter((r) => r.matches.length);

    if (!roundsInComponent.length) return {};

    const heightOf = (id) => cardHeights[id] ?? this.cardHeight;
    const centerY = (id, top) => top + heightOf(id) / 2;
    const topFromCenter = (id, cy) => cy - heightOf(id) / 2;

    const yById = {};
    const slotHeight = this.cardHeight + this.verticalGap;

    for (const round of roundsInComponent) {
      for (let i = 0; i < round.matches.length; i++) {
        const match = round.matches[i];
        const incoming = this._incomingInComponent(graph, match.id, matchIds);
        if (!incoming.length) {
          yById[match.id] = i * slotHeight;
        }
      }
    }

    for (let r = 1; r < roundsInComponent.length; r++) {
      const round = roundsInComponent[r];
      for (const match of round.matches) {
        const incoming = this._incomingInComponent(graph, match.id, matchIds);
        if (!incoming.length) continue;

        const sourceCenters = [];
        for (const edge of incoming) {
          const srcTop = yById[edge.sourceMatchId];
          if (srcTop == null) continue;
          sourceCenters.push(centerY(edge.sourceMatchId, srcTop));
        }
        if (!sourceCenters.length) continue;

        sourceCenters.sort((a, b) => a - b);
        const targetCenter =
          sourceCenters.reduce((a, b) => a + b, 0) / sourceCenters.length;
        yById[match.id] = topFromCenter(match.id, targetCenter);
      }
    }

    for (const round of roundsInComponent) {
      for (let i = 0; i < round.matches.length; i++) {
        const match = round.matches[i];
        if (yById[match.id] == null) yById[match.id] = i * slotHeight;
      }
    }

    this._resolveColumnCollisions(roundsInComponent, yById, heightOf);

    for (let r = roundsInComponent.length - 1; r >= 1; r--) {
      const round = roundsInComponent[r];
      for (const match of round.matches) {
        const incoming = this._incomingInComponent(graph, match.id, matchIds);
        if (incoming.length < 2) continue;

        const sourceCenters = [];
        for (const edge of incoming) {
          const srcTop = yById[edge.sourceMatchId];
          if (srcTop == null) continue;
          sourceCenters.push(centerY(edge.sourceMatchId, srcTop));
        }
        if (sourceCenters.length < 2) continue;

        sourceCenters.sort((a, b) => a - b);
        const targetCenter =
          sourceCenters.reduce((a, b) => a + b, 0) / sourceCenters.length;
        yById[match.id] = topFromCenter(match.id, targetCenter);
      }
      this._resolveColumnCollisions([round], yById, heightOf);
    }

    const positions = {};
    for (const round of roundsInComponent) {
      const x = globalRoundColumnX[round.id] ?? this.horizontalPadding;
      for (const match of round.matches) {
        positions[match.id] = { x, y: yById[match.id] ?? 0 };
      }
    }
    return positions;
  }

  _findComponents(graph) {
    const allIds = new Set();
    for (const round of graph.rounds) {
      for (const m of round.matches) allIds.add(m.id);
    }

    if (!graph.edges.length) return [allIds];

    const adj = {};
    for (const id of allIds) adj[id] = new Set();
    for (const edge of graph.edges) {
      adj[edge.sourceMatchId]?.add(edge.targetMatchId);
      adj[edge.targetMatchId]?.add(edge.sourceMatchId);
    }

    const visited = new Set();
    const components = [];

    for (const id of allIds) {
      if (visited.has(id)) continue;
      const stack = [id];
      const component = new Set();
      while (stack.length) {
        const current = stack.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        component.add(current);
        for (const neighbor of adj[current] ?? []) {
          if (!visited.has(neighbor)) stack.push(neighbor);
        }
      }
      components.push(component);
    }

    if (components.length > 1) {
      components.sort((a, b) => b.size - a.size);
    }
    return components.length ? components : [allIds];
  }

  _incomingInComponent(graph, matchId, matchIds) {
    return graph
      .incomingEdges(matchId)
      .filter((e) => matchIds.has(e.sourceMatchId));
  }

  _resolveColumnCollisions(rounds, yById, heightOf) {
    for (const round of rounds) {
      const sorted = [...round.matches].sort(
        (a, b) => (yById[a.id] ?? 0) - (yById[b.id] ?? 0),
      );
      let prevBottom = -Infinity;
      for (const match of sorted) {
        let y = yById[match.id] ?? 0;
        if (y < prevBottom + this.verticalGap) {
          y = prevBottom + this.verticalGap;
          yById[match.id] = y;
        }
        prevBottom = y + heightOf(match.id);
      }
    }
  }
}
