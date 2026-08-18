import { useEffect, useMemo, useRef, useState } from "react";
import BracketCanvas from "./BracketCanvas";
import { BracketCardMetrics } from "../utils/bracketCardMetrics";
import { resolveChampionLayout } from "../utils/bracketChampionLayout";

export default function TournamentBracketView({ graph, cardWidth }) {
  const scrollRef = useRef(null);
  const [didAutoScroll, setDidAutoScroll] = useState(false);
  const resolvedCardWidth = BracketCardMetrics.resolveCardWidth(cardWidth);

  const { layout, championLayout, contentSize } = useMemo(() => {
    const engine = BracketCardMetrics.createLayoutEngine({
      cardWidth: resolvedCardWidth,
    });
    const computedLayout = engine.compute(graph);
    const champion = resolveChampionLayout(graph, computedLayout);
    const size = champion?.contentSize ?? computedLayout.contentSize;
    return {
      layout: computedLayout,
      championLayout: champion,
      contentSize: size,
    };
  }, [graph, resolvedCardWidth]);

  useEffect(() => {
    if (didAutoScroll || !scrollRef.current) return;

    let focusMatch = null;
    for (let i = graph.rounds.length - 1; i >= 0; i--) {
      const round = graph.rounds[i];
      for (const match of round.matches) {
        if (match.isLive) {
          focusMatch = match;
          break;
        }
      }
      if (focusMatch) break;
    }

    if (!focusMatch) {
      const lastRound = graph.rounds[graph.rounds.length - 1];
      focusMatch = lastRound?.matches[lastRound.matches.length - 1] ?? null;
    }

    if (!focusMatch) return;

    const pos = layout.positions[focusMatch.id];
    if (!pos) return;

    const targetOffset = Math.max(
      0,
      pos.x - BracketCardMetrics.autoScrollOffset,
    );

    scrollRef.current.scrollTo({
      left: targetOffset,
      behavior: "smooth",
    });
    setDidAutoScroll(true);
  }, [graph, layout, didAutoScroll]);

  return (
    <div className="tournament-bracket-view">
      <div className="tournament-bracket-view__scroll" ref={scrollRef}>
        <BracketCanvas
          graph={graph}
          layout={layout}
          contentSize={contentSize}
          cardWidth={resolvedCardWidth}
          championLayout={championLayout}
        />
      </div>
    </div>
  );
}
