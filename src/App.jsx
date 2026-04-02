import { useEffect, useRef, useState } from "react";
import "./App.css";
import ScorePortal from "./pages/ScorePortal";
import TimeTable from "./pages/TimeTable";
import ScoreTable from "./pages/ScoreTable";
import Layout from "./components/Layout";
import LiveScore from "./pages/LiveScore";
// import MatchesTimetableScreen from "./screens/MatchesTimetableScreen";
import Home from "./pages/Home";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ScoreCard from "./pages/ScoringCard";
import TodayMatch from "./pages/TodayMatch";
import LiveCourt from "./pages/LiveCourt";
import MultiCourtLive from "./pages/MultiCourtLive";
import MultiCourtSchedule from "./pages/MultiCourtSchedule";
import Common from "./helper/common";
import Scoreboard from "./live/overlays/scorebar";
import NullLayout from "./components/NullLayout";
import UmpirePage from "./pages/UmpirePage";
import UserPage from "./pages/UserPage";
import { UmpireApp } from "./umpireScoring";
import ScorePage from "./pages/ScoreViewer/ScorePage";
import StreamingHome from "./pages/streaming/SteamingHome";
import StreamingLiveCourt from "./pages/streaming/StreamingLiveCourt";
import AdminNavigation from "./pages/AdminNavigation";
import LoginPage from "./umpireScoring/pages/LoginPage";
import MatchListPage from "./umpireScoring/pages/MatchListPage";
import ScoreUploadPage from "./umpireScoring/pages/ScoreUploadPage";
import { UmpireProvider } from "./umpireScoring/context/UmpireContext";
import TournamentThemeProvider from "./components/TournamentThemeProvider";
import { TournamentImagesProvider } from "./context/TournamentImagesContext";

import Padelverse from "./pages/Padelverse";
import TMP from "./pages/TMP";
import GK from "./pages/GK";
import Links from "./pages/live/Links";
import Appt from "./pages/Appt";

function App() {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!isLoaded.current) {
      Common.ApiService.getInstance().initialize(Common.AppConstant.serviceUrl);
      isLoaded.current = true;
    }
  }, []);
  return (
    <Router>
      <UmpireProvider>
        <TournamentThemeProvider>
          <TournamentImagesProvider>
            <Routes>
              {/* Root route - Login Page First */}
              <Route path="/" element={<NullLayout />}>
                <Route index element={<LoginPage />} />
                <Route path="matches" element={<MatchListPage />} />
                <Route path="score-upload" element={<ScoreUploadPage />} />
                <Route path="scorebar" element={<Scoreboard />} />
                <Route path="streaming-home" element={<StreamingHome />} />
                <Route
                  path="streaming-live-court"
                  element={<StreamingLiveCourt />}
                />
                {/* <Route path="multi-court-live" element={<MultiCourtLive />} /> */}
                <Route
                  path="scorebar/:tournamentId/:matchId"
                  element={<Scoreboard />}
                />
              </Route>

              <Route
                path="/streaming-live-court"
                element={<StreamingLiveCourt />}
              />

              <Route path="/live/links" element={<Links />} />

              {/* Main Application Routes with Layout */}
              <Route path="/home" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="live-court" element={<LiveCourt />} />
                <Route path="padelverse" element={<Padelverse />} />
                <Route path="tmp" element={<TMP />} />
                <Route path="gk" element={<GK />} />
                <Route path="appt" element={<Appt />} />

                <Route
                  path="live-court/:tournamentId/:matchId"
                  element={<LiveCourt />}
                />
                <Route path="multi-court-live" element={<MultiCourtLive />} />
                <Route
                  path="multi-court-schedule"
                  element={<MultiCourtSchedule />}
                />
                <Route path="live-score" element={<LiveScore />} />
                <Route path="time-table" element={<TimeTable />} />
                <Route path="score-table" element={<ScoreTable />} />
                <Route path="score-card" element={<ScoreCard />} />
                <Route path="today-match" element={<TodayMatch />} />
                <Route path="umpire" element={<UmpirePage />} />
                <Route path="viewer" element={<UserPage />} />
                <Route path="score-page" element={<ScorePage />} />
                <Route path="admin" element={<AdminNavigation />} />

                {/* <Route
            path="matches-timetable"
            element={<MatchesTimetableScreen />}
          /> */}
              </Route>

              {/* Umpire Scoring Routes - Standalone App */}
              {/* <Route path="umpire-scoring/*" element={<UmpireApp />} /> */}
            </Routes>
          </TournamentImagesProvider>
        </TournamentThemeProvider>
      </UmpireProvider>
    </Router>
  );
}

export default App;
