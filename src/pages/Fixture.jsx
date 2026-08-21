import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/layout/header";
import SponsorMarquee from "../components/SponsorMarquee";
import Common from "../helper/common";
import { getTokenFromUrl } from "../helper/authTokenHelper";
import { useDisplaySettings } from "../hooks/useDisplaySettings";
import useFixtureBracketBatch from "../bracket/hooks/useFixtureBracketBatch";
import TournamentBracketView from "../bracket/components/TournamentBracketView";
import "../assets/css/fixture.css";

function parseTournamentIds(params) {
  const tournamentIdsParam = params.get("tournamentIds");
  const singleTournamentId = params.get("tournamentId");

  if (tournamentIdsParam) {
    try {
      const parsed = JSON.parse(tournamentIdsParam);
      const ids = Array.isArray(parsed) ? parsed : [parsed];
      return ids
        .map((id) => parseInt(id, 10))
        .filter((id) => !Number.isNaN(id));
    } catch {
      return tournamentIdsParam
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !Number.isNaN(id));
    }
  }

  if (singleTournamentId) {
    const id = parseInt(singleTournamentId, 10);
    return Number.isNaN(id) ? [] : [id];
  }

  return [];
}

function MissingParamMessage({ name, example }) {
  return (
    <div className="fixture-page__error">
      <div>
        <div className="text-2xl font-bold mb-2">Missing Parameter</div>
        <div>{name} parameter is required.</div>
        {example && <div className="text-sm mt-2 opacity-80">{example}</div>}
      </div>
    </div>
  );
}

export default function Fixture() {
  const [params] = useSearchParams();
  const [currentTournamentIndex, setCurrentTournamentIndex] = useState(0);

  const tournamentIds = useMemo(() => parseTournamentIds(params), [params]);

  const categoryDisplayTime = parseInt(params.get("categoryDisplayTime"), 10);
  const refreshInterval = parseInt(params.get("refreshInterval"), 10);

  const displayId =
    params.get("displayId") ??
    (tournamentIds.length > 0 ? `fixture-${tournamentIds.join("-")}` : null);

  useDisplaySettings({ displayId, listenOnly: true });

  useEffect(() => {
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      Common.setToken(urlToken);
    }
  }, [params]);

  const activeTournamentId = tournamentIds[currentTournamentIndex] ?? null;

  const { getBracketState, loading, error, hasAnyContent } =
    useFixtureBracketBatch(tournamentIds, { refreshInterval });

  const {
    graph,
    scheduleImage,
    scheduleUrl,
    tournamentName,
    hasContent,
  } = getBracketState(activeTournamentId);

  useEffect(() => {
    if (tournamentIds.length <= 1 || !categoryDisplayTime) return;

    const interval = setInterval(() => {
      setCurrentTournamentIndex((prev) => (prev + 1) % tournamentIds.length);
    }, categoryDisplayTime * 1000);

    return () => clearInterval(interval);
  }, [tournamentIds.length, categoryDisplayTime]);

  useEffect(() => {
    setCurrentTournamentIndex(0);
  }, [tournamentIds.join(",")]);

  if (!tournamentIds.length) {
    return (
      <div className="fixture-page">
        <MissingParamMessage
          name="tournamentIds or tournamentId"
          example="Example: ?tournamentIds=177,176,175&categoryDisplayTime=15&refreshInterval=5"
        />
      </div>
    );
  }

  if (!categoryDisplayTime || categoryDisplayTime <= 0) {
    return (
      <div className="fixture-page">
        <MissingParamMessage
          name="categoryDisplayTime (seconds)"
          example="Example: ?categoryDisplayTime=15"
        />
      </div>
    );
  }

  if (!refreshInterval || refreshInterval <= 0) {
    return (
      <div className="fixture-page">
        <MissingParamMessage
          name="refreshInterval (minutes)"
          example="Example: ?refreshInterval=5"
        />
      </div>
    );
  }

  const renderContent = () => {
    if (loading && !hasContent && !hasAnyContent) {
      return <div className="fixture-page__loading">Loading fixture...</div>;
    }

    if (error && !hasContent) {
      return <div className="fixture-page__error">{error}</div>;
    }

    if (!graph.isEmpty) {
      return (
        <div className="fixture-page__bracket-wrap">
          <TournamentBracketView graph={graph} />
        </div>
      );
    }

    if (scheduleImage) {
      return (
        <img
          src={scheduleImage}
          alt="Tournament fixture schedule"
          className="fixture-page__fallback-image"
        />
      );
    }

    if (scheduleUrl) {
      return (
        <iframe
          src={scheduleUrl}
          title="Tournament fixture schedule"
          className="fixture-page__fallback-iframe"
        />
      );
    }

    return (
      <div className="fixture-page__empty">
        No fixture available for this tournament
      </div>
    );
  };

  return (
    <div className="fixture-page">
      <Header />
      <SponsorMarquee />

      <div className="fixture-page__content">
        <div className="fixture-page__title-bar">
          <div className="fixture-page__title-center">
            <div className="fixture-page__title">Tournament Bracket</div>
            {tournamentName && (
              <div className="fixture-page__category">{tournamentName}</div>
            )}
          </div>
          {tournamentIds.length > 1 && (
            <div className="fixture-page__rotation">
              Category {currentTournamentIndex + 1} of {tournamentIds.length}
            </div>
          )}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
