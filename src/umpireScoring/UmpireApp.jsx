import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { UmpireProvider, useUmpire } from "./context/UmpireContext";
import LoginPage from "./pages/LoginPage";
import MatchListPage from "./pages/MatchListPage";
import ScoreUploadPage from "./pages/ScoreUploadPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUmpire();

  if (!isAuthenticated) {
    return <Navigate to="/umpire/login" replace />;
  }

  return children;
};

// Main Umpire App Component
const UmpireApp = () => {
  return (
    <UmpireProvider>
      <div className="umpire-app">
        <Routes>
          {/* Login Route */}
          <Route path="login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="matches"
            element={
              <ProtectedRoute>
                <MatchListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="score-upload"
            element={
              <ProtectedRoute>
                <ScoreUploadPage />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="" element={<Navigate to="login" replace />} />
          <Route path="*" element={<Navigate to="login" replace />} />
        </Routes>
      </div>
    </UmpireProvider>
  );
};

export default UmpireApp;
