'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useUserLocation({ enableHighAccuracy = true, watchInterval = 5000 } = {}) {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const [error, setError] = useState(() => {
    if (typeof navigator !== 'undefined' && !navigator.geolocation) {
      return 'Geolocation not supported';
    }
    return null;
  });
  const [permission, setPermission] = useState('prompt');
  const watchId = useRef(null);
  const notSupported = useRef(typeof navigator !== 'undefined' && !navigator.geolocation);

  // Watch position
  useEffect(() => {
    if (!navigator.geolocation || notSupported.current) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          speed: pos.coords.speed,
        });
        if (pos.coords.heading != null && !isNaN(pos.coords.heading)) {
          setHeading(pos.coords.heading);
        }
        setError(null);
      },
      (err) => {
        setError(err.message);
        setPermission('denied');
      },
      {
        enableHighAccuracy,
        timeout: 15000,
        maximumAge: 30000,
      }
    );

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enableHighAccuracy]);

  // Initial permission check
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      setPermission(result.state);
      result.addEventListener('change', () => setPermission(result.state));
    }).catch(() => {});
  }, []);

  // Device orientation fallback for heading (mobile compass)
  useEffect(() => {
    if (!window.DeviceOrientationEvent) return;

    // iOS 13+ requires permission
    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientationabsolute', handleOrientation);
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch { /* user denied */ }
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    const handleOrientation = (event) => {
      let compassHeading;
      if (event.webkitCompassHeading != null) {
        compassHeading = event.webkitCompassHeading; // iOS
      } else if (event.alpha != null) {
        compassHeading = 360 - event.alpha; // Android
      }
      if (compassHeading != null) {
        setHeading(compassHeading);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          speed: pos.coords.speed,
        });
        if (pos.coords.heading != null && !isNaN(pos.coords.heading)) {
          setHeading(pos.coords.heading);
        }
        setError(null);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, heading, error, permission, requestLocation };
}
