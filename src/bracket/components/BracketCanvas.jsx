import BracketConnectorLayer from "./BracketConnectorLayer";
import BracketMatchCard from "./BracketMatchCard";
import BracketRoundHeader from "./BracketRoundHeader";
import BracketChampionCard from "./BracketChampionCard";
import { BracketRoundTitle } from "../utils/bracketRoundTitle";

export default function BracketCanvas({
  graph,
  layout,
  contentSize,
  cardWidth,
  championLayout = null,
}) {
  const championSegments = championLayout?.connectorSegments ?? [];

  return (
    <div
      className="bracket-canvas"
      style={{
        width: contentSize.width,
        height: contentSize.height,
      }}
    >
      <BracketConnectorLayer
        graph={graph}
        layout={layout}
        extraSegments={championSegments}
      />

      {graph.rounds.map((round) => {
        const x = layout.roundColumnX[round.id] ?? 0;
        return (
          <div
            key={round.id}
            className="bracket-canvas__round-header"
            style={{ left: x, top: 0 }}
          >
            <BracketRoundHeader
              title={BracketRoundTitle.resolve(round)}
              width={layout.cardWidth}
            />
          </div>
        );
      })}

      {championLayout && (
        <>
          <div
            className="bracket-canvas__round-header"
            style={{ left: championLayout.headerX, top: 0 }}
          >
            <BracketRoundHeader
              title="Winner"
              width={championLayout.cardWidth}
            />
          </div>
          <div
            className="bracket-canvas__champion"
            style={{
              left: championLayout.cardX,
              top: championLayout.cardY,
            }}
          >
            <BracketChampionCard
              winner={championLayout.winner}
              width={championLayout.cardWidth}
            />
          </div>
        </>
      )}

      {graph.rounds.flatMap((round) =>
        round.matches.map((match) => {
          const pos = layout.positions[match.id];
          if (!pos) return null;
          return (
            <div
              key={match.id}
              className="bracket-canvas__match"
              style={{ left: pos.x, top: pos.y }}
            >
              <BracketMatchCard match={match} width={cardWidth} />
            </div>
          );
        }),
      )}
    </div>
  );
}
