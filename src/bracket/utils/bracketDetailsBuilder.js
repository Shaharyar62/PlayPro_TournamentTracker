import { BracketGraphBuilder } from "./bracketGraphBuilder";
import { EMPTY_GRAPH } from "../models/tournamentBracketGraph";
import { hasContent, getImageUrl } from "./bracketHelpers";

export function buildBracketFromDetails(details) {
  if (!details) {
    return {
      graph: EMPTY_GRAPH,
      scheduleImage: null,
      scheduleUrl: null,
      tournamentName: null,
      fingerprint: "",
    };
  }

  const matches = Array.isArray(details.matches) ? details.matches : [];
  const teams = Array.isArray(details.teams) ? details.teams : [];
  const isTeamOnly = Boolean(details.isTeamOnly);
  const fingerprint = BracketGraphBuilder.structureFingerprint(matches);

  const graph = BracketGraphBuilder.build({
    matches,
    teams,
    isTeamOnly,
  });

  return {
    graph,
    scheduleImage: hasContent(details.scheduleImage)
      ? getImageUrl(details.scheduleImage)
      : null,
    scheduleUrl: hasContent(details.scheduleUrl)
      ? String(details.scheduleUrl).trim()
      : null,
    tournamentName: details.name?.toString() ?? null,
    fingerprint,
    isTeamOnly,
    matches,
    teams,
  };
}

export function hasFixtureContent({ graph, scheduleImage, scheduleUrl }) {
  return !graph.isEmpty || scheduleImage != null || scheduleUrl != null;
}
