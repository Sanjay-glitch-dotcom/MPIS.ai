import React, { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

export default function ActivityWidget() {
  const { user, isAuthenticated, pingServer } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user && ['ADMIN', 'POLICE', 'SUB_ADMIN', 'SUB_POLICE'].includes(user.role)) {
      pingServer();
      const interval = setInterval(pingServer, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.role, pingServer]);

  // This component now strictly handles the background ping logic.
  // The UI has been moved to the UserMenu component.
  return null;
}
