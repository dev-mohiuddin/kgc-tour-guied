'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { MapPin, Star, Navigation, Loader2, Map, AlertTriangle, Info } from 'lucide-react';
import { fetchNearbyPlaces, fetchPlacesByText, geocodePlace } from '@/lib/map-providers';

let L = null;
if (typeof window !== 'undefined') L = require('leaflet');

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const LeafletDiscoverMap = memo(function LeafletDiscoverMap({
  center = [23.8103, 90.4125],
  radius = 10000,
  mode = 'nearby',
  textQuery = '',
  locationName = 'Bangladesh',
  locale = 'en',
  onPlaceSelect,
  onShowMore,
  userLocation,
}) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersLayer = useRef(null);
  const searchTimer = useRef(null);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);

  // ─── Init map ───
  useEffect(() => {
    if (!mapRef.current || mapInst.current || !L) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const [lat, lng] = Array.isArray(center) ? center : [center.lat, center.lng];
    const map = L.map(mapRef.current, { center: [lat, lng], zoom: 13, zoomControl: true });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    markersLayer.current = L.layerGroup().addTo(map);
    mapInst.current = map;
    setLoading(false);
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; markersLayer.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render markers ───
  const renderMarkers = useCallback((results) => {
    const map = mapInst.current;
    const layer = markersLayer.current;
    if (!map || !layer || !L) return;

    layer.clearLayers();
    const bounds = L.latLngBounds([]);
    let markerCount = 0;

    results.forEach((place, idx) => {
      const lat = place.lat;
      const lng = place.lng;
      if (lat == null || lng == null) return;

      markerCount++;
      bounds.extend([lat, lng]);

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#2563eb;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;cursor:pointer;">${idx + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -14],
      });

      const stars = place.rating ? '★'.repeat(Math.min(Math.round(place.rating), 5)) : '';
      const popupHtml = `
        <div style="min-width:220px;font-family:system-ui;font-size:13px;">
          ${place.photo_url ? `<img src="${place.photo_url}" alt="${place.name}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />` : ''}
          <b style="font-size:14px;">${place.name}</b>
          ${place.rating ? `<div style="color:#f59e0b;margin:4px 0;">${stars} ${place.rating} (${place.user_ratings_total || 0})</div>` : ''}
          <div style="color:#666;font-size:11px;margin-bottom:6px;">${place.vicinity || ''}</div>
          ${place.phone ? `<div style="font-size:11px;color:#666;">📞 ${place.phone}</div>` : ''}
          <button onclick="(window.__kgc_onSelect||(()=>{}))(${idx})" style="background:#059669;color:white;border:none;padding:5px 14px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;margin-top:4px;">
            ${locale === 'bn' ? 'রুটে যোগ করুন' : 'Add to Route'}
          </button>
        </div>
      `;

      L.marker([lat, lng], { icon })
        .addTo(layer)
        .bindPopup(popupHtml, { maxWidth: 260 });
    });

    if (markerCount > 1 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (markerCount === 1) {
      map.setView(bounds.getCenter(), 14);
    }

    // Store for popup callback
    window.__kgc_onSelect = (idx) => {
      const p = results[idx];
      if (p && onPlaceSelect) {
        onPlaceSelect({ ...p, coordinates: { lat: p.lat, lng: p.lng } });
      }
    };
  }, [locale, onPlaceSelect]);

  // ─── Search ───
  const doSearch = useCallback(async () => {
    if (!mapInst.current) return;
    setSearching(true);
    setError(null);
    try {
      let results;
      const [lat, lng] = Array.isArray(center) ? center : [center.lat, center.lng];
      if (mode === 'text' && textQuery) {
        results = await fetchPlacesByText(textQuery);
      } else {
        results = await fetchNearbyPlaces(lat, lng, radius);
      }
      setPlaces(results);
      renderMarkersRef.current?.(results);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || String(err) || 'Unknown error');
    } finally {
      setSearching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], radius, mode, textQuery]);

  // Keep renderMarkers in a ref to avoid re-creating doSearch
  const renderMarkersRef = useRef(renderMarkers);
  renderMarkersRef.current = renderMarkers;

  useEffect(() => {
    if (loading || !mapInst.current) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(doSearch, 600);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [loading, doSearch]);

  // ─── Pan ───
  useEffect(() => {
    if (mapInst.current && !loading) {
      const [lat, lng] = Array.isArray(center) ? center : [center.lat, center.lng];
      mapInst.current.setView([lat, lng], mapInst.current.getZoom());
    }
  }, [center[0], center[1], loading]);

  useEffect(() => {
    const h = () => mapInst.current?.invalidateSize();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => () => { window.__kgc_onSelect = undefined; }, []);

  // ─── User location marker ───
  const userMarkerRef = useRef(null);
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !userLocation?.lat || !L) return;
    if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); }

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#3b82f6;border:3px solid white;border-radius:50%;width:16px;height:16px;box-shadow:0 0 0 3px rgba(59,130,246,0.4);animation:pulse 2s infinite;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon })
      .addTo(map)
      .bindPopup('<b>Your Location</b>');
  }, [userLocation]);

  // ─── Render ───
  return (
    <div className="space-y-4">
      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.4)}50%{box-shadow:0 0 0 12px rgba(59,130,246,0)}}`}</style>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5">
          <Map className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground font-medium">{locationName}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
          <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs">{mode === 'text' ? 'Search' : `${Math.round(radius / 1000)}km`}</span>
        </div>
        {!searching && places.length > 0 && (
          <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">{places.length} places</span>
        )}
      </div>

      <div className="w-full h-[500px] rounded-lg overflow-hidden relative bg-muted border">
        <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />

        {(loading || searching) && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-10">
            <div className="bg-white rounded-xl px-5 py-3 shadow-lg flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">{loading ? 'Loading map...' : 'Searching...'}</span>
            </div>
          </div>
        )}

        {error && !searching && (
          <div className="absolute top-3 left-3 right-3 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg z-10">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">API Error</p>
                <p className="text-xs text-amber-700 leading-relaxed break-all">{error}</p>
                <button onClick={doSearch} className="mt-2 text-xs font-medium text-amber-700 underline">Retry</button>
              </div>
            </div>
          </div>
        )}

        {!searching && !loading && !error && places.length === 0 && mapInst.current && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/90 rounded-xl px-5 py-4 shadow-lg text-center max-w-[260px]">
              <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-medium">{locale === 'bn' ? 'কোনো স্থান পাওয়া যায়নি' : 'No places found'}</p>
            </div>
          </div>
        )}
      </div>

      {!searching && !loading && places.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.slice(0, 20).map((place, idx) => (
            <div key={place.place_id || idx} className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex">
              <div className="w-24 min-h-[96px] flex-shrink-0 bg-muted">
                {place.photo_url ? (
                  <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <MapPin className="h-5 w-5 text-muted-foreground/30" />
                    <span className="text-xs font-bold text-muted-foreground/40 mt-1">{idx + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-sm truncate" title={place.name}>{place.name}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    {place.rating ? (
                      <><Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" /><span className="text-xs">{place.rating} ({place.user_ratings_total})</span></>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{place.vicinity || ''}</p>
                  {userLocation && place.lat != null && (
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      {(() => { const R=6371; const dLat=(place.lat-userLocation.lat)*Math.PI/180; const dLng=(place.lng-userLocation.lng)*Math.PI/180; const a=Math.sin(dLat/2)**2+Math.cos(userLocation.lat*Math.PI/180)*Math.cos(place.lat*Math.PI/180)*Math.sin(dLng/2)**2; return (R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1); })()} km away
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => onPlaceSelect?.({ ...place, coordinates: { lat: place.lat, lng: place.lng } })} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    {locale === 'bn' ? '+ যোগ করুন' : '+ Add'}
                  </button>
                  <button onClick={() => onShowMore?.(place)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5">
                    <Info className="h-3 w-3" />
                    {locale === 'bn' ? 'বিস্তারিত' : 'Details'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default LeafletDiscoverMap;
