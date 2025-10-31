# Umpire Scoring Feature

A comprehensive umpire scoring system for tournament management with real-time score tracking and match management.

## 📁 Folder Structure

```
src/umpireScoring/
├── components/
│   ├── LoginForm.jsx          # Court ID authentication form
│   ├── MatchList.jsx          # Display matches with status filtering
│   ├── ScoreUpload.jsx        # Live scoring interface
│   └── Filters.jsx            # Match filtering tabs
├── pages/
│   ├── LoginPage.jsx          # Login page wrapper
│   ├── MatchListPage.jsx      # Match list with navigation
│   └── ScoreUploadPage.jsx    # Score upload with navigation
├── hooks/
│   └── useUmpireData.js       # Custom hook for data operations
├── services/
│   └── umpireAPI.js           # API service layer
├── context/
│   └── UmpireContext.jsx      # Global state management
├── UmpireApp.jsx              # Main app component with routing
├── index.js                   # Module exports
└── README.md                  # This file
```

## 🚀 Features

### 1. Umpire Authentication

- **Court ID Login**: Umpires log in using their assigned Court ID
- **Quick Select**: Development mode with predefined court IDs
- **Session Management**: Secure session handling with context state

### 2. Match Management

- **Match Filtering**: Filter by Upcoming, Live, Completed matches
- **Real-time Updates**: Auto-refresh match data every 30 seconds
- **Match Status**: Visual indicators for match states
- **Go Live**: Start matches with one-click activation

### 3. Live Scoring

- **Point Tracking**: Tennis-style point system (0, 15, 30, 40)
- **Game Management**: Complete games and track set progress
- **Set Tracking**: Monitor sets won by each team
- **Auto-save**: Scores automatically sync with backend
- **Match Completion**: End matches with final score recording

### 4. Responsive Design

- **Tablet Optimized**: Designed for courtside tablet use
- **Mobile Friendly**: Works on various screen sizes
- **Touch Interface**: Large buttons for easy interaction
- **Offline Support**: Graceful handling of network issues

## 🎨 Design System

### Color Theme

- **Primary Blue**: `#2563eb` (Blue 600)
- **Success Green**: `#16a34a` (Green 600)
- **Warning Yellow**: `#ca8a04` (Yellow 600)
- **Danger Red**: `#dc2626` (Red 600)
- **Neutral Gray**: `#4b5563` (Gray 600)

### Components

- **Cards**: White background with subtle shadows
- **Buttons**: Rounded corners with hover animations
- **Status Badges**: Color-coded match status indicators
- **Forms**: Clean input fields with focus states

## 🔧 Integration

### 1. Add to Main App

```jsx
import { UmpireApp } from "./umpireScoring";

// In your main App.jsx
function App() {
  return (
    <Routes>
      {/* Other routes */}
      <Route path="/umpire/*" element={<UmpireApp />} />
    </Routes>
  );
}
```

### 2. Use Individual Components

```jsx
import {
  UmpireProvider,
  LoginForm,
  MatchList,
  ScoreUpload,
} from "./umpireScoring";

function CustomUmpireInterface() {
  return (
    <UmpireProvider>
      <LoginForm onLoginSuccess={handleLogin} />
      <MatchList matches={matches} onGoLive={startMatch} />
      <ScoreUpload match={currentMatch} onSave={saveScore} />
    </UmpireProvider>
  );
}
```

### 3. Use Hooks and Services

```jsx
import { useUmpireData, umpireAPI } from "./umpireScoring";

function CustomComponent() {
  const { matches, syncScore, getMatchStats } = useUmpireData();

  // Use the data and methods
}
```

## 📱 Usage Flow

### 1. Umpire Login

1. Umpire opens the app and navigates to `/umpire/login`
2. Enters their assigned Court ID (e.g., COURT001)
3. System validates the court and logs them in
4. Redirects to match list page

### 2. Match Selection

1. View all matches for their assigned court
2. Filter matches by status (Upcoming, Live, Completed)
3. Click "Go Live" to start an upcoming match
4. Click "Continue Scoring" for live matches

### 3. Live Scoring

1. Award points to teams using the point buttons
2. Complete games when a team wins 4+ points
3. Track sets as games are completed
4. End match when complete (2 sets won)

## 🛠️ Development

### Mock Data

The system includes comprehensive mock data for development:

- **3 Courts**: COURT001, COURT002, COURT003
- **4 Sample Matches**: Various statuses and tournaments
- **Realistic Scores**: Proper tennis scoring format

### API Integration

- **Development Mode**: Uses mock responses
- **Production Mode**: Connects to real API endpoints
- **Error Handling**: Graceful fallbacks for network issues
- **Offline Support**: Local state management

### State Management

- **Context API**: Global state for umpire session
- **Local Storage**: Persist login state
- **Auto-sync**: Real-time score synchronization
- **Optimistic Updates**: Immediate UI feedback

## 🔒 Security

### Authentication

- **Court-based Access**: Umpires only see their court's matches
- **Session Tokens**: Secure JWT-based authentication
- **Auto-logout**: Session timeout handling

### Data Validation

- **Score Validation**: Prevents invalid score entries
- **Match State**: Ensures proper match progression
- **API Validation**: Server-side validation for all updates

## 📊 Analytics & Monitoring

### Performance Metrics

- **Load Times**: Component render performance
- **API Response**: Network request monitoring
- **Error Tracking**: Comprehensive error logging

### Usage Statistics

- **Match Completion**: Track successful match completions
- **Score Updates**: Monitor scoring frequency
- **Session Duration**: Umpire session analytics

## 🚀 Deployment

### Build Process

```bash
# Development build
npm run build:dev

# Production build
npm run build:prod
```

### Environment Configuration

- **Development**: Mock API responses
- **Staging**: Test API endpoints
- **Production**: Live API integration

## 📞 Support

### Troubleshooting

1. **Login Issues**: Verify Court ID format
2. **Score Sync**: Check network connectivity
3. **Match Loading**: Refresh browser cache

### Contact

- **Technical Support**: Contact development team
- **Feature Requests**: Submit via issue tracker
- **Bug Reports**: Include browser and device info

---

**Version**: 1.0.0  
**Last Updated**: October 29, 2024  
**Compatible With**: React 19+, Node.js 18+
