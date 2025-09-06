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
