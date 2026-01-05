import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

        const response = await fetch('/api/admin/check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
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
