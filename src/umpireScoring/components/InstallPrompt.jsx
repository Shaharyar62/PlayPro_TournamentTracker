import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    
    if (!standalone && !dismissed) {
      // Listen for the beforeinstallprompt event
      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Show prompt after a short delay for better UX
        setTimeout(() => setShowPrompt(true), 3000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        alert('To install this app:\n1. Tap the Share button (box with arrow)\n2. Scroll and tap "Add to Home Screen"\n3. Tap "Add" in the top-right corner');
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Show iOS-specific prompt
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const shouldShowIOSPrompt = isIOS && !isStandalone && !localStorage.getItem('pwa-install-dismissed');

  if (!showPrompt && !shouldShowIOSPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/90 to-transparent animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl p-4 max-w-md mx-auto border-2 border-blue-600">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Install PlayPro Umpire</h3>
              <p className="text-sm text-gray-600">Get the app experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-700 mb-4">
          Install this app for a better experience with no browser bars and offline support.
        </p>
        
        {isIOS ? (
          <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold mb-2">To install on iOS:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Tap the Share button <span className="inline-block">📤</span></li>
              <li>Scroll and tap "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Install Now
          </button>
        )}
        
        {!isIOS && (
          <button
            onClick={handleDismiss}
            className="w-full mt-2 text-gray-600 text-sm py-2 hover:text-gray-800"
          >
            Maybe Later
          </button>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;

