import { useEffect, useRef } from "react";
import socketMatchService from "../services/socketMatchService.js";

/**
 * Custom hook for managing WebSocket connection lifecycle
 * @returns {{socketService: SocketMatchService, isConnected: boolean}}
 */
export function useSocket() {
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Connect on mount
    socketMatchService
      .connect()
      .then(() => {
        isConnectedRef.current = true;
      })
      .catch((error) => {
        console.error("Failed to connect socket:", error);
        isConnectedRef.current = false;
      });

    // Cleanup on unmount
    return () => {
      socketMatchService.disconnect();
      isConnectedRef.current = false;
    };
  }, []);

  return {
    socketService: socketMatchService,
    isConnected: isConnectedRef.current,
  };
}

