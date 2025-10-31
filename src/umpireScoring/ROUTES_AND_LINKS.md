# 🚀 Umpire Scoring - Routes and Navigation Links

## 📍 **Main Application Routes**

### **Umpire Scoring Portal**

- **Base Route**: `/umpire-scoring/*`
- **Login**: `/umpire-scoring/login`
- **Match List**: `/umpire-scoring/matches`
- **Live Scoring**: `/umpire-scoring/score-upload`

### **Admin Navigation**

- **Admin Portal**: `/admin`
- **Direct Access Links**: Available from admin portal

---

## 🔗 **Navigation Links Added**

### **1. Home Page (`/`)**

- Added **"⚙️ Admin Portal"** button
- **Color**: Purple (`#7c3aed`)
- **Links to**: `/admin`

### **2. Admin Navigation Page (`/admin`)**

- **Umpire Scoring Portal** - Full featured scoring system
- **Score Table** - Tournament standings
- **Today's Matches** - Daily schedule
- **Tournament Schedule** - Complete timetable
- **Umpire Management** - Umpire assignments
- **Viewer Portal** - Public interface

### **3. Quick Access Section**

- **Direct Umpire Login**: `/umpire-scoring/login`
- **Live Standings**: `/score-table`
- **Today's Schedule**: `/today-match`

---

## 🎯 **Access Flow**

### **For Umpires:**

```
Home (/)
  → Admin Portal (/admin)
    → Umpire Scoring Portal (/umpire-scoring)
      → Login (/umpire-scoring/login)
        → Match List (/umpire-scoring/matches)
          → Live Scoring (/umpire-scoring/score-upload)
```

### **Quick Access:**

```
Home (/)
  → Admin Portal (/admin)
    → Direct Umpire Login (/umpire-scoring/login)
```

---

## 🔧 **Technical Implementation**

### **App.jsx Routes Structure:**

```jsx
<Routes>
  {/* Main Layout Routes */}
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="admin" element={<AdminNavigation />} />
    {/* Other existing routes... */}
  </Route>

  {/* Standalone Routes (No Layout) */}
  <Route path="/" element={<NullLayout />}>
    <Route path="umpire-scoring/*" element={<UmpireApp />} />
    {/* Other standalone routes... */}
  </Route>
</Routes>
```

### **UmpireApp.jsx Nested Routes:**

```jsx
<Routes>
  <Route path="login" element={<LoginPage />} />
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
  <Route path="" element={<Navigate to="login" replace />} />
  <Route path="*" element={<Navigate to="login" replace />} />
</Routes>
```

---

## 🎨 **UI Components**

### **Home Page Button:**

- **Text**: "⚙️ Admin Portal"
- **Color**: Purple gradient
- **Animation**: Hover scale and rotation effects

### **Admin Navigation:**

- **Design**: Modern card-based layout
- **Theme**: Dark gradient background
- **Features**:
  - Animated cards with hover effects
  - Icon-based navigation
  - Quick access section
  - Responsive grid layout

### **Umpire Scoring Portal:**

- **Login**: Court ID authentication with quick select
- **Match List**: Filterable match cards with status indicators
- **Live Scoring**: Real-time tennis scoring interface

---

## 📱 **Responsive Design**

### **Breakpoints:**

- **Mobile**: Single column layout
- **Tablet**: 2-column grid
- **Desktop**: 3-column grid

### **Touch Optimized:**

- Large touch targets for tablet use
- Smooth animations and transitions
- Clear visual hierarchy

---

## 🔐 **Security & Access Control**

### **Protected Routes:**

- Match List and Score Upload require authentication
- Court-based access control
- Session management with Context API

### **Navigation Guards:**

- Automatic redirects for unauthenticated users
- Route protection with `ProtectedRoute` component

---

## 🚀 **Quick Start Guide**

### **For Development:**

1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:3000`
3. Click **"⚙️ Admin Portal"**
4. Select **"Umpire Scoring Portal"**
5. Use quick select: **COURT001**, **COURT002**, or **COURT003**

### **For Production:**

1. Build the application: `npm run build`
2. Deploy to your hosting platform
3. Access via: `https://yourdomain.com/admin`

---

## 📋 **Available URLs**

| Purpose          | URL                            | Description               |
| ---------------- | ------------------------------ | ------------------------- |
| **Home**         | `/`                            | Main landing page         |
| **Admin Portal** | `/admin`                       | Administrative navigation |
| **Umpire Login** | `/umpire-scoring/login`        | Court ID authentication   |
| **Match List**   | `/umpire-scoring/matches`      | Court match management    |
| **Live Scoring** | `/umpire-scoring/score-upload` | Real-time scoring         |
| **Direct Login** | `/umpire-scoring/login`        | Quick access link         |

---

## 🎯 **User Journeys**

### **Tournament Administrator:**

1. Access `/admin` from home page
2. Overview of all management tools
3. Quick access to any system component

### **Umpire:**

1. Access `/admin` → **"Umpire Scoring Portal"**
2. Login with Court ID (e.g., COURT001)
3. Select match and start scoring
4. Real-time score updates

### **Quick Access:**

1. Access `/admin` → **"Direct Umpire Login"**
2. Immediate access to scoring portal

---

**🏆 The umpire scoring feature is now fully integrated with proper routes and navigation!**

**Access the system at**: `http://localhost:3000/admin` → **"Umpire Scoring Portal"**
