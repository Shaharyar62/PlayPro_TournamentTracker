import { useMemo } from "react";
import { BracketConnectorPathBuilder } from "../utils/bracketConnectorPaths";
import { BracketCardMetrics } from "../utils/bracketCardMetrics";

function isWinnerPath(graph, sourceMatchId) {
  if (!sourceMatchId) return false;
  const match = graph.matchById(sourceMatchId);
  if (!match || !match.isCompleted) return false;
  return (
    match.participantA?.isWinner === true ||
    match.participantB?.isWinner === true
  );
}

export default function BracketConnectorLayer({
  graph,
  layout,
  extraSegments = [],
}) {
  const segments = useMemo(() => {
    const builder = new BracketConnectorPathBuilder({
      graph,
      positions: layout.positions,
      cardWidth: layout.cardWidth,
      cardHeight: layout.cardHeight,
      cardHeights: layout.cardHeights,
      roundColumnX: layout.roundColumnX,
      connectorGutter: BracketCardMetrics.connectorGutter,
    });
    return [...builder.buildSegments(), ...extraSegments];
  }, [graph, layout, extraSegments]);

  return (
    <svg
      className="bracket-connector-layer"
      width={layout.contentSize.width}
      height={layout.contentSize.height}
      aria-hidden="true"
    >
      {segments.map((segment, index) => {
        const winner = isWinnerPath(graph, segment.sourceMatchId);
        return (
          <line
            key={index}
            x1={segment.from.x}
            y1={segment.from.y}
            x2={segment.to.x}
            y2={segment.to.y}
            className={
              winner
                ? "bracket-connector-layer__line bracket-connector-layer__line--winner"
                : "bracket-connector-layer__line"
            }
          />
        );
      })}
    </svg>
  );
}
