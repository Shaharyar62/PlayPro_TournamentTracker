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
import Common from "./helper/common";
import Scoreboard from "./live/overlays/scorebar";
import NullLayout from "./components/NullLayout";
import UmpirePage from "./pages/UmpirePage";
import UserPage from "./pages/UserPage";

import ScorePage from "./pages/ScoreViewer/ScorePage";
import StreamingHome from "./pages/streaming/SteamingHome";
import StreamingLiveCourt from "./pages/streaming/StreamingLiveCourt";

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
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="streaming-home" element={<StreamingHome />} />
          <Route path="streaming-live-court" element={<StreamingLiveCourt />} />
          <Route path="live-court" element={<LiveCourt />} />
          <Route
            path="live-court/:tournamentId/:matchId"
            element={<LiveCourt />}
          />
          <Route path="live-score" element={<LiveScore />} />
          <Route path="time-table" element={<TimeTable />} />
          <Route path="score-table" element={<ScoreTable />} />
          <Route path="score-card" element={<ScoreCard />} />
          <Route path="today-match" element={<TodayMatch />} />
          <Route path="umpire" element={<UmpirePage />} />
          <Route path="viewer" element={<UserPage />} />
          <Route path="score-page" element={<ScorePage />} />

          {/* <Route
            path="matches-timetable"
            element={<MatchesTimetableScreen />}
          /> */}
        </Route>
        <Route path="/" element={<NullLayout />}>
          <Route path="scorebar" element={<Scoreboard />} />
          <Route
            path="scorebar/:tournamentId/:matchId"
            element={<Scoreboard />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
