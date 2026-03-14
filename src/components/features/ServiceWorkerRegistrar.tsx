"use client";

import { useEffect } from "react";

/**
 * MVP: Unregister any existing service workers to prevent stale JS chunk caching.
 * The previous SW cached all GET responses including _next/static chunks,
 * causing old code to persist even after new Vercel deployments.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Unregister all existing service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
      // Clear all caches left by the old SW
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
    }
  }, []);

  return null;
}
