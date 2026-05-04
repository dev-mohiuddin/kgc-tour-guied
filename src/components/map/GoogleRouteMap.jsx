'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Loader2, AlertTriangle } from 'lucide-react';

function RouteMapContent({ places }) {
  const map = useMap();
  const markerLib = useMapsLibrary('marker');
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  useEffect(() => {
    const gmaps = window.google?.maps;
    if (!map || !markerLib || !gmaps || places.length === 0) return;

    clearMarkers();
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }

    const coords = [];
    const lats = [];
    const lngs = [];

    places.forEach((place, i) => {
      const lat = place.coordinates?.lat;
      const lng = place.coordinates?.lng;
      if (lat == null || lng == null) return;

      lats.push(lat);
      lngs.push(lng);
      coords.push({ lat, lng });

      const pinView = new markerLib.PinElement({
        glyph: String(i + 1),
        glyphColor: 'white',
        background: '#059669',
        borderColor: '#047857',
        scale: 1.2,
      });

      const marker = new markerLib.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: place.name?.en || place.name || '',
        content: pinView.element,
      });

      const name = place.name?.en || place.name || '';
      const dist = place.district?.en || '';
      const infoWindow = new gmaps.InfoWindow({
        content: `<div style="min-width:180px;font-family:system-ui;"><b style="font-size:14px;">${name}</b>${dist ? `<br/><span style="font-size:11px;color:#666;">${dist}</span>` : ''}</div>`,
      });
      marker.addListener('click', () => infoWindow.open(map, marker));
      markersRef.current.push(marker);
    });

    // Draw route line
    if (coords.length >= 2) {
      polylineRef.current = new gmaps.Polyline({
        map,
        path: coords,
        geodesic: true,
        strokeColor: '#059669',
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
    }

    // Fit bounds using LatLngBoundsLiteral
    if (lats.length > 0) {
      const bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs),
      };
      if (lats.length > 1) {
        map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60, maxZoom: 12 });
      } else {
        map.setZoom(13);
        map.setCenter(coords[0]);
      }
    }

    return () => {
      clearMarkers();
      if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    };
  }, [map, markerLib, places]);

  return null;
}

const GoogleRouteMap = memo(function GoogleRouteMap({ places = [] }) {
  const [loading, setLoading] = useState(true);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const defaultCenter = places.length > 0 && places[0].coordinates
    ? { lat: places[0].coordinates.lat, lng: places[0].coordinates.lng }
    : { lat: 23.8103, lng: 90.4125 };

  if (!apiKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
        <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
        <p className="text-amber-800 text-sm font-semibold">API Key Missing</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden relative bg-muted">
      {loading && (
        <div className="absolute inset-0 bg-muted z-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <APIProvider apiKey={apiKey} onLoad={() => setLoading(false)}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={places.length > 1 ? 7 : 12}
          mapId="kgc-route-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          fullscreenControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <RouteMapContent places={places} />
        </Map>
      </APIProvider>
    </div>
  );
});

export default GoogleRouteMap;
