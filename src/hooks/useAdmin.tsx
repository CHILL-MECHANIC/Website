import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Checks if we're running on localhost (development)
 */
const isLocalhost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

/**
 * Gets the base API URL - same logic as otpClient
 */
const getApiBaseUrl = (): string => {
  if (!isLocalhost()) {
    return ''; // Production: use relative URLs
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl === '' || envUrl === 'relative') {
    return '';
  }
  if (envUrl) {
    return envUrl.replace(/\/api\/(sms|auth)\/?$/, '').replace(/\/$/, '');
  }
  return 'http://localhost:3001'; // Default for local dev
};

export function useAdmin() {
  const { profile, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      // Wait for auth to finish loading first
      if (authLoading) {
        return;
      }

      if (!profile) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Use our API endpoint to check admin status
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Use correct API base URL for local vs production
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/admin/check`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        console.log('[useAdmin] Admin check response:', { userId: profile.id, isAdmin: data.isAdmin, success: data.success });
        
        if (data.success) {
          setIsAdmin(data.isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [profile, authLoading]);

  // Still loading if auth is loading
  return { isAdmin, loading: loading || authLoading };
}
