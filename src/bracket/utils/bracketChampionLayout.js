import { BracketCardMetrics } from "./bracketCardMetrics";
import { BracketConnectorPathBuilder } from "./bracketConnectorPaths";

export function resolveChampionLayout(graph, layout) {
  let finalMatch = null;
  for (const round of graph.rounds) {
    for (const match of round.matches) {
      if (match.stageType === 4) {
        finalMatch = match;
        break;
      }
    }
    if (finalMatch) break;
  }

  if (!finalMatch) return null;

  const finalPos = layout.positions[finalMatch.id];
  if (!finalPos) return null;

  const columnWidth = BracketCardMetrics.columnWidth(layout.cardWidth);
  const championWidth = BracketCardMetrics.championCardWidth;
  const cardX = finalPos.x + columnWidth;
  const finalHeight = layout.heightFor(finalMatch.id);
  const cardY =
    finalPos.y + (finalHeight - BracketCardMetrics.championCardHeight) / 2;

  let winner = null;
  if (finalMatch.isCompleted) {
    if (finalMatch.participantA?.isWinner === true) {
      winner = finalMatch.participantA;
    } else if (finalMatch.participantB?.isWinner === true) {
      winner = finalMatch.participantB;
    }
  }

  const from = {
    x: finalPos.x + layout.cardWidth,
    y: finalPos.y + finalHeight / 2,
  };
  const to = {
    x: cardX,
    y: cardY + BracketCardMetrics.championCardHeight / 2,
  };

  const contentWidth =
    cardX + championWidth + BracketCardMetrics.horizontalPadding;
  const contentHeight =
    layout.contentSize.height > cardY + BracketCardMetrics.championCardHeight
      ? layout.contentSize.height
      : cardY +
        BracketCardMetrics.championCardHeight +
        BracketCardMetrics.verticalGap;

  return {
    headerX: cardX,
    cardX,
    cardY,
    cardWidth: championWidth,
    winner,
    contentSize: { width: contentWidth, height: contentHeight },
    connectorSegments: BracketConnectorPathBuilder.orthogonalPath(from, to, {
      sourceMatchId: finalMatch.isCompleted ? finalMatch.id : null,
    }),
  };
}
