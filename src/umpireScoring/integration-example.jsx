// Integration Example: How to add Umpire Scoring to your main App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UmpireApp } from "./umpireScoring";

// Your existing components
import Home from "./pages/Home";
import ScoreTable from "./pages/ScoreTable";
// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/score-table" element={<ScoreTable />} />

        {/* NEW: Umpire Scoring Routes */}
        <Route path="/umpire-scoring/*" element={<UmpireApp />} />

        {/* Other existing routes */}
      </Routes>
    </Router>
  );
}

export default App;

// Alternative: Use individual components
/*
import { 
  UmpireProvider, 
  LoginPage, 
  MatchListPage, 
  ScoreUploadPage,
  useUmpire 
} from './umpireScoring';

function CustomUmpireIntegration() {
  return (
    <UmpireProvider>
      <Routes>
        <Route path="/umpire/login" element={<LoginPage />} />
        <Route path="/umpire/matches" element={<MatchListPage />} />
        <Route path="/umpire/score" element={<ScoreUploadPage />} />
      </Routes>
    </UmpireProvider>
  );
}
*/

// Navigation Menu Addition Example
/*
function NavigationMenu() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/score-table">Score Table</Link>
      <Link to="/umpire-scoring">Umpire Portal</Link>  
    </nav>
  );
}
*/
