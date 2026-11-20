import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Expired/invalid session (JWT lives 7d, no refresh): any 401 on a request that sent our
// Bearer token clears the login and sends the user to /auth. The silent on-load
// /api/profile check only clears, so public pages don't bounce visitors.
const origFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const res = await origFetch(input, init);
  try {
    const sent = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
      .get('Authorization')?.replace('Bearer ', '');
    if (res.status === 401 && sent && sent === localStorage.getItem('auth_token')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      const url = input instanceof Request ? input.url : String(input);
      if (!url.includes('/api/profile') && location.pathname !== '/auth') {
        location.assign('/auth');
      }
    }
  } catch { /* never break the original request */ }
  return res;
};

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
