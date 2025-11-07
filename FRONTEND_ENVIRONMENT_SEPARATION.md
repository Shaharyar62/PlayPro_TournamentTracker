# Frontend Environment Separation Guide

## Overview

Prefix match IDs with `dev_` in development to separate dev and production matches. No backend changes required.

- **Development**: Match IDs prefixed with `dev_` (e.g., `dev_match123`)
- **Production**: No prefix (e.g., `match123`) - backward compatible

## Step 1: Create MatchIdHelper Utility

**File: `src/utils/matchIdHelper.js`**

```javascript
class MatchIdHelper {
  static getEnvPrefix() {
    const env =
      process.env.NODE_ENV || process.env.REACT_APP_ENV || "development";
    return env === "production" ? "" : "dev_";
  }

  static prefixMatchId(matchId) {
    if (!matchId) return matchId;
    const prefix = this.getEnvPrefix();
    if (matchId.startsWith("dev_") || matchId.startsWith("prod_")) {
      return matchId; // Already prefixed
    }
    return prefix ? `${prefix}${matchId}` : matchId;
  }

  static prefixTournamentId(tournamentId) {
    return this.prefixMatchId(tournamentId);
  }

  static isMatchForCurrentEnv(matchId) {
    if (!matchId) return false;
    const prefix = this.getEnvPrefix();
    if (prefix) {
      return matchId.startsWith(prefix); // Dev: only dev_ prefixed
    } else {
      return !matchId.startsWith("dev_"); // Prod: no dev_ prefix
    }
  }

  static filterMatchesByEnv(matches) {
    if (!Array.isArray(matches)) return [];
    return matches.filter((match) => {
      const matchId = match.id || match.matchId || match.tournamentId;
      return this.isMatchForCurrentEnv(matchId);
    });
  }
}

export default MatchIdHelper;
```

## Step 2: Update Socket.IO Emits

**Change all socket emit calls to prefix match/tournament IDs:**

```javascript
import MatchIdHelper from './utils/matchIdHelper';

// Before
socket.emit('create_match', { matchId, tournamentId, ... });

// After
socket.emit('create_match', {
  matchId: MatchIdHelper.prefixMatchId(matchId),
  tournamentId: MatchIdHelper.prefixTournamentId(tournamentId),
  ...
});
```

**Apply to all socket events:**

- `create_match`
- `get_match_state`
- `update_match_state`
- `add_warning`
- `update_serve`
- `complete_match`
- `delete_match`
- `reset_match`
- `join_tournament`
- `leave_tournament`

## Step 3: Filter Socket.IO Events

**Filter incoming socket events by environment:**

```javascript
// Before
socket.on(`match_update_${matchId}`, (data) => {
  // handle update
});

// After
socket.on(`match_update_${MatchIdHelper.prefixMatchId(matchId)}`, (data) => {
  if (!MatchIdHelper.isMatchForCurrentEnv(data.matchId)) {
    return; // Ignore matches from other environment
  }
  // handle update
});
```

**Apply to all socket listeners:**

- `match_update_*`
- `match_reset_*`
- `tournament_update_*`

## Step 4: Filter API Responses

**Filter API responses by environment:**

```javascript
import MatchIdHelper from "./utils/matchIdHelper";

// Before
const matches = await fetch("/api/matches").then((r) => r.json());

// After
const allMatches = await fetch("/api/matches").then((r) => r.json());
const matches = MatchIdHelper.filterMatchesByEnv(allMatches);
```

**Apply to:**

- `GET /api/matches`
- `GET /api/tournaments`

## Quick Reference: What to Change

1. **Import MatchIdHelper** in files that handle matches
2. **Prefix IDs** in all `socket.emit()` calls
3. **Filter events** in all `socket.on()` handlers
4. **Filter responses** from all API calls that return matches

## Environment Configuration

Set environment variable:

- **Development**: `NODE_ENV=development` or `REACT_APP_ENV=development`
- **Production**: `NODE_ENV=production` or `REACT_APP_ENV=production`

That's it. No other changes needed.
