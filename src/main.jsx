import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Prompt to install PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // You can show your own install promotion UI here
  console.log('PWA install prompt ready');
});

// Handle successful installation
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed successfully');
  deferredPrompt = null;
});

// Handle iOS standalone mode
if (window.navigator.standalone === true) {
  console.log('Running in iOS standalone mode');
}

// Handle Android standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Running in standalone mode');
}

// Prevent zooming (for better app-like feel)
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
});

createRoot(document.getElementById("root")).render(<App />);
