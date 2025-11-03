import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, RotateCcw } from "lucide-react";
import { MatchFormat } from "../types/match.types.js";

/**
 * SettingsPanel Component
 * Allows editing all match settings
 * Following REACT_IMPLEMENTATION_GUIDE.md specification
 */
const SettingsPanel = ({ settings, onClose, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings || {});

  const handleChange = (field, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave?.(localSettings);
    onClose?.();
  };

  const handleReset = () => {
    setLocalSettings(settings || {});
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Match Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Timer Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Timer Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Point Timer (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    (localSettings.pointTimerMinutes || 0) * 60 +
                    (localSettings.pointTimerSeconds || 0)
                  }
                  onChange={(e) => {
                    const totalSeconds = parseInt(e.target.value) || 0;
                    handleChange("pointTimerMinutes", Math.floor(totalSeconds / 60));
                    handleChange("pointTimerSeconds", totalSeconds % 60);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Timer (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    (localSettings.setTimerMinutes || 0) * 60 +
                    (localSettings.setTimerSeconds || 0)
                  }
                  onChange={(e) => {
                    const totalSeconds = parseInt(e.target.value) || 0;
                    handleChange("setTimerMinutes", Math.floor(totalSeconds / 60));
                    handleChange("setTimerSeconds", totalSeconds % 60);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Side Change (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    (localSettings.changeSide1_Minutes || 0) * 60 +
                    (localSettings.changeSide1_Seconds || 0)
                  }
                  onChange={(e) => {
                    const totalSeconds = parseInt(e.target.value) || 0;
                    handleChange("changeSide1_Minutes", Math.floor(totalSeconds / 60));
                    handleChange("changeSide1_Seconds", totalSeconds % 60);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Side Change (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    (localSettings.changeSideMinutes || 0) * 60 +
                    (localSettings.changeSideSeconds || 0)
                  }
                  onChange={(e) => {
                    const totalSeconds = parseInt(e.target.value) || 0;
                    handleChange("changeSideMinutes", Math.floor(totalSeconds / 60));
                    handleChange("changeSideSeconds", totalSeconds % 60);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.autoStartTime || false}
                    onChange={(e) => handleChange("autoStartTime", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Auto Start Timer
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Match Format Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Match Format
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Format
                </label>
                <select
                  value={localSettings.matchFormat || MatchFormat.THREE_SETS}
                  onChange={(e) =>
                    handleChange("matchFormat", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={MatchFormat.RACE_TO_SIX}>Race to 6</option>
                  <option value={MatchFormat.TWO_SETS_SUPER_TIEBREAK}>
                    2 Sets + Super Tiebreak
                  </option>
                  <option value={MatchFormat.THREE_SETS}>3 Sets</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Sets
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={localSettings.numberOfSets || 3}
                  onChange={(e) =>
                    handleChange("numberOfSets", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Games to Win Set
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={localSettings.numberOfGames || 6}
                  onChange={(e) =>
                    handleChange("numberOfGames", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Games to Start Tiebreak
                </label>
                <input
                  type="text"
                  placeholder="6 - 6"
                  value={localSettings.gamesToStartTiebreak || "6 - 6"}
                  onChange={(e) => handleChange("gamesToStartTiebreak", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.autoChangeSide || false}
                    onChange={(e) =>
                      handleChange("autoChangeSide", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Auto Change Side
                  </span>
                </label>
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.tiebreakOnLastSet || false}
                    onChange={(e) =>
                      handleChange("tiebreakOnLastSet", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Tiebreak on Last Set
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Golden Point Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Golden Point Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.goldenPoint || false}
                    onChange={(e) => handleChange("goldenPoint", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Golden Point
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advantages with Golden Point
                </label>
                <input
                  type="number"
                  min="0"
                  value={localSettings.advantagesWithGoldenPoint || 0}
                  onChange={(e) =>
                    handleChange(
                      "advantagesWithGoldenPoint",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.goldenPointInTiebreak || false}
                    onChange={(e) =>
                      handleChange("goldenPointInTiebreak", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Golden Point in Tiebreak
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Tiebreak Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Tiebreak Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points in Tiebreak
                </label>
                <input
                  type="number"
                  min="5"
                  max="15"
                  value={localSettings.pointsInTiebreak || 7}
                  onChange={(e) =>
                    handleChange("pointsInTiebreak", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Super Tiebreak Points
                </label>
                <input
                  type="number"
                  min="7"
                  max="20"
                  value={localSettings.superTieBreakPoints || 10}
                  onChange={(e) =>
                    handleChange("superTieBreakPoints", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPanel;

