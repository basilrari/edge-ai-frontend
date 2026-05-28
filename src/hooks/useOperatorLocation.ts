"use client";

import { useEffect, useState } from "react";

export function useOperatorLocation(): {
  position: { lat: number; lng: number } | null;
  error: string | null;
} {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation not available");
      return;
    }

    const onPos = (result: GeolocationPosition) => {
      setPosition({
        lat: result.coords.latitude,
        lng: result.coords.longitude,
      });
      setError(null);
    };

    const onErr = () => {
      setError("Location permission denied or unavailable");
    };

    navigator.geolocation.getCurrentPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 12000,
    });

    const watch = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    });

    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  return { position, error };
}
