import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, LogIn, AlertCircle } from "lucide-react";
import { useUmpire } from "../context/UmpireContext";

const LoginForm = ({ onLoginSuccess }) => {
  const [courtId, setCourtId] = useState("");
  const [showError, setShowError] = useState(false);
  const { login, loading, error, mockCourts } = useUmpire();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowError(false);

    if (!courtId.trim()) {
      setShowError(true);
      return;
    }

    const result = await login(courtId.trim().toUpperCase());

    if (result.success) {
      onLoginSuccess?.();
    } else {
      setShowError(true);
    }
  };

  const handleCourtSelect = (selectedCourtId) => {
    setCourtId(selectedCourtId);
    setShowError(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="w-10 h-10 text-blue-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Umpire Login
          </h1>
          <p className="text-gray-600">
            Enter your assigned Court ID to access scoring
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="courtId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Court ID
            </label>
            <input
              type="text"
              id="courtId"
              value={courtId}
              onChange={(e) => setCourtId(e.target.value.toUpperCase())}
              placeholder="Enter Court ID (e.g., COURT001)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center font-mono text-lg"
              disabled={loading}
            />
          </div>

          {/* Quick Select Buttons for Development */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">
              Quick Select (Development)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {mockCourts.map((court) => (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => handleCourtSelect(court.id)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-left"
                >
                  <span className="font-mono font-semibold">{court.id}</span>
                  <span className="text-gray-600 ml-2">- {court.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {(showError || error) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">
                {error || "Please enter a valid Court ID"}
              </span>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            PlayPro Tournament Tracker - Umpire Portal
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
