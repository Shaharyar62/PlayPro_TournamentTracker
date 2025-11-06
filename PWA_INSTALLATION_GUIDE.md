# PlayPro Umpire - Mobile App Installation Guide

Your web application now works as a Progressive Web App (PWA) and can be installed on mobile devices for a native app-like experience!

## 🎯 Features

When installed as a PWA, your app provides:

- **No browser chrome** - Full-screen experience without address bar or navigation buttons
- **App icon on home screen** - Launch directly from your device's home screen
- **Offline support** - Continue working even without internet connection
- **Fast loading** - Cached assets for instant startup
- **Native feel** - Behaves like a native mobile application
- **Background sync** - Automatic score synchronization when connection is restored
- **Safe area support** - Works perfectly on devices with notches (iPhone X and later)

## 📱 Installation Instructions

### iOS (iPhone/iPad)

1. Open the app in **Safari** browser
2. Tap the **Share** button (box with arrow pointing up) at the bottom of the screen
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired (default: "PlayPro Umpire")
5. Tap **"Add"** in the top-right corner
6. The app icon will appear on your home screen
7. Tap the icon to launch the app in full-screen mode

**Important:** Must use Safari on iOS. Chrome and other browsers don't support PWA installation on iOS.

### Android (Chrome)

1. Open the app in **Chrome** browser
2. Wait for the **"Install"** prompt to appear (after 3 seconds)
3. Tap **"Install"** or **"Add to Home Screen"**
4. Confirm installation
5. The app icon will appear on your home screen
6. Tap the icon to launch the app

**Alternative method:**
1. Tap the **three-dot menu** (⋮) in Chrome
2. Tap **"Install app"** or **"Add to home screen"**
3. Follow the prompts

### Desktop (Chrome, Edge, Firefox)

1. Visit the app in your browser
2. Look for the **install icon** in the address bar (➕ or 💻)
3. Click **"Install"**
4. The app will open in its own window
5. Access it from your Start Menu (Windows) or Applications (Mac)

## 🔧 Technical Implementation

### Files Added/Modified

1. **`index.html`** - Added PWA meta tags and manifest link
   - iOS web app capable meta tags
   - Theme color definitions
   - Viewport settings for mobile
   - Apple touch icon links

2. **`public/manifest.json`** - PWA configuration
   - App name and description
   - Icons and theme colors
   - Display mode (standalone)
   - Shortcuts for quick actions

3. **`public/service-worker.js`** - Offline functionality
   - Caching strategy
   - Background sync
   - Push notifications support

4. **`src/main.jsx`** - Service worker registration
   - Auto-update functionality
   - Install prompt handling
   - Standalone mode detection

5. **`src/index.css`** - Mobile app enhancements
   - Safe area insets for notched devices
   - Prevent text selection and zoom
   - Touch-friendly interactions
   - Smooth scrolling

6. **`src/umpireScoring/components/InstallPrompt.jsx`** - Install prompt UI
   - Platform-specific instructions
   - Dismissible prompt
   - localStorage persistence

7. **`vite.config.js`** - Build configuration
   - Public folder assets copying

## 🚀 Testing

### Test in Development

```bash
npm run dev
# or
yarn dev
```

Then access from your mobile device using your computer's IP address:
```
http://YOUR_IP_ADDRESS:5173
```

### Test Production Build Locally

```bash
npm run build
npm run preview
# or
yarn build
yarn preview
```

### Test on Real Device

1. Deploy to your hosting service
2. Access the URL on your mobile device
3. Follow installation instructions above
4. Test offline functionality:
   - Turn on airplane mode
   - App should still load
   - Cached data should be available

## 📋 Checklist for Production

- [ ] Ensure `playpro.png` exists in the `public/` folder (app icon)
- [ ] Update `manifest.json` with correct app name and URLs
- [ ] Test installation on iOS Safari
- [ ] Test installation on Android Chrome
- [ ] Test offline functionality
- [ ] Test on devices with notches (iPhone X+)
- [ ] Verify safe area insets work correctly
- [ ] Test score upload in standalone mode
- [ ] Verify service worker updates properly

## 🎨 Customization

### Change App Colors

Edit `manifest.json` and `index.html`:

```json
{
  "theme_color": "#1e40af",  // Change to your brand color
  "background_color": "#ffffff"
}
```

```html
<meta name="theme-color" content="#1e40af" />
```

### Update App Icons

Replace icons in `public/` folder with your own:
- Minimum size: 192x192px
- Recommended: 512x512px
- Format: PNG with transparency
- Name: Update references in `manifest.json`

### Modify Caching Strategy

Edit `public/service-worker.js`:
- Change `CACHE_NAME` when you want to force update
- Modify `urlsToCache` array for different caching
- Adjust network/cache priority in fetch handler

## 🐛 Troubleshooting

### Install Prompt Not Showing

- Clear browser cache and cookies
- Make sure you're on HTTPS (or localhost)
- Check that `manifest.json` is accessible
- Verify service worker is registered (check Console)

### App Not Working Offline

- Check service worker registration in DevTools
- Verify cached resources in Application > Cache Storage
- Ensure URLs match exactly (no trailing slashes issues)

### iOS Not Installing

- Must use Safari (not Chrome or other browsers)
- Check that all meta tags are present
- Verify icons are accessible

### Safe Areas Not Working

- Check that viewport meta tag includes `viewport-fit=cover`
- Verify CSS uses `env(safe-area-inset-*)` variables
- Test on actual device with notch

## 📊 Monitoring

Check PWA health in browser DevTools:

### Chrome DevTools
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check:
   - Manifest
   - Service Workers
   - Cache Storage
   - Background Sync

### Lighthouse Audit
1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **Progressive Web App** category
4. Click **Generate Report**
5. Aim for score > 90

## 🔄 Updates

When you deploy a new version:

1. Update `CACHE_NAME` in `service-worker.js` to force cache refresh
2. Service worker will auto-update on next app launch
3. Users will get the new version automatically

## 📚 Additional Resources

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [iOS Web App Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

**Note:** This PWA implementation provides a full mobile app experience without requiring App Store or Play Store deployment!

