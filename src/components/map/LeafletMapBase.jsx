'use client';

import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { MapPin } from 'lucide-react';

let L = null;
if (typeof window !== 'undefined') L = require('leaflet');

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const LeafletMapBase = memo(function LeafletMapBase({ places = [] }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const [loading, setLoading] = useState(true);

  const buildMap = useCallback(() => {
    if (!mapRef.current || mapInst.current || !L) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const center = places.length > 0 && places[0].coordinates
      ? [places[0].coordinates.lat, places[0].coordinates.lng]
      : [23.8103, 90.4125];

    const map = L.map(mapRef.current, {
      center,
      zoom: places.length > 1 ? 7 : 12,
      zoomControl: true,
    });

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);

    // Add route line if 2+ places
    if (places.length >= 2) {
      const coords = places
        .filter(p => p.coordinates?.lat && p.coordinates?.lng)
        .map(p => [p.coordinates.lat, p.coordinates.lng]);

      if (coords.length >= 2) {
        L.polyline(coords, {
          color: '#059669',
          weight: 4,
          opacity: 0.8,
          smoothFactor: 1,
        }).addTo(map);
      }
    }

    mapInst.current = map;
    setLoading(false);

    setTimeout(() => map.invalidateSize(), 100);
  }, [places]);

  const placeMarkers = useCallback(() => {
    const map = mapInst.current;
    if (!map || !L) return;

    const bounds = L.latLngBounds([]);
    const placedCoords = [];

    places.forEach((place, i) => {
      const lat = place.coordinates?.lat;
      const lng = place.coordinates?.lng;
      if (lat == null || lng == null) return;

      placedCoords.push([lat, lng]);
      bounds.extend([lat, lng]);

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#059669;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;cursor:pointer;">${i + 1}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -15],
      });

      const name = place.name?.en || place.name || '';
      const dist = place.district?.en || '';
      const rating = place.rating ? `★ ${place.rating}` : '';

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px;font-family:system-ui;">
            <b style="font-size:14px;">${name}</b>
            ${dist ? `<br/><span style="font-size:11px;color:#666;">${dist}</span>` : ''}
            ${rating ? `<br/><span style="color:#f59e0b;font-size:12px;">${rating}</span>` : ''}
          </div>
        `, { maxWidth: 240 });
    });

    // Fit all markers + route
    const allCoords = [...placedCoords];
    // Also include route line points for bounds
    if (places.length >= 2) {
      places.filter(p => p.coordinates).forEach(p => {
        const exists = allCoords.find(c => c[0] === p.coordinates.lat && c[1] === p.coordinates.lng);
        if (!exists) allCoords.push([p.coordinates.lat, p.coordinates.lng]);
      });
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else if (placedCoords.length === 1) {
      map.setView(placedCoords[0], 13);
    }
  }, [places]);

  useEffect(() => {
    buildMap();
    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, []);

  useEffect(() => {
    if (mapInst.current) {
      // Clear old markers (simple approach: remove map, rebuild)
      mapInst.current.remove();
      mapInst.current = null;
      setLoading(true);
      setTimeout(() => {
        buildMap();
        placeMarkers();
        setLoading(false);
      }, 50);
    }
  }, [places]);

  useEffect(() => {
    if (mapInst.current && !loading) placeMarkers();
  }, [loading]);

  useEffect(() => {
    const h = () => mapInst.current?.invalidateSize();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden relative bg-muted">
      {loading && (
        <div className="absolute inset-0 bg-muted z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
});

export default LeafletMapBase;
