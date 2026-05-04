'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Map as MapIcon, Navigation, Loader2, AlertTriangle, MapPin, Star, Layers } from 'lucide-react';
import { fetchNearbyPlaces, fetchPlacesByText } from '@/lib/map-providers';
import { getPopularTier } from '@/data/popular-places';

function MapContent({
  center, radius, mode, textQuery, locale,
  onPlaceSelect, onShowMore, userLocation, heading, selectedPlaceIds,
  places, setPlaces, setLoading, setSearching, setError,
}) {
  const map = useMap();
  const markerLib = useMapsLibrary('marker');
  const searchTimer = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const userMarkerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const apiReady = useRef(false);

  // Track API readiness
  useEffect(() => {
    if (window.google?.maps && markerLib) {
      apiReady.current = true;
    }
  }, [markerLib]);

  // Traffic layer toggle
  useEffect(() => {
    const gmaps = window.google?.maps;
    if (!gmaps || !map) return;
    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new gmaps.TrafficLayer();
        trafficLayerRef.current.setMap(map);
      }
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
        trafficLayerRef.current = null;
      }
    }
  }, [showTraffic, map]);

  // Clear markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  }, []);

  // Clear circle
  const clearCircle = useCallback(() => {
    if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null; }
  }, []);

  // Draw radius circle
  const drawRadiusCircle = useCallback(() => {
    const gmaps = window.google?.maps;
    if (!gmaps || !map || mode !== 'nearby') return;
    clearCircle();
    const c = Array.isArray(center) ? { lat: center[0], lng: center[1] } : { lat: center.lat, lng: center.lng };
    circleRef.current = new gmaps.Circle({
      map,
      center: c,
      radius,
      fillColor: '#059669',
      fillOpacity: 0.06,
      strokeColor: '#059669',
      strokeOpacity: 0.4,
      strokeWeight: 2,
    });
  }, [map, center, radius, mode, clearCircle]);

  // Fit map to markers using LatLngBoundsLiteral (plain object, no constructor needed)
  const fitBoundsToPlaces = useCallback((results) => {
    const gmaps = window.google?.maps;
    if (!gmaps || !map) return;
    const coords = results.filter(p => p.lat != null && p.lng != null).map(p => ({ lat: p.lat, lng: p.lng }));
    if (coords.length === 0) return;

    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };

    if (coords.length > 1) {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60, maxZoom: 14 });
    } else {
      map.setZoom(14);
      map.setCenter(coords[0]);
    }
  }, [map]);

  // Render markers
  const renderMarkers = useCallback((results) => {
    const gmaps = window.google?.maps;
    if (!map || !markerLib || !gmaps) return;
    clearMarkers();
    clearCircle();

    results.forEach((place, idx) => {
      const lat = place.lat;
      const lng = place.lng;
      if (lat == null || lng == null) return;

      const tier = getPopularTier(place.name);
      const bgColor = tier === 'gold' ? '#D4A017' : tier === 'silver' ? '#8B8B83' : '#059669';
      const borderColor = tier === 'gold' ? '#B8860B' : tier === 'silver' ? '#6B6B63' : '#047857';

      const markerView = new markerLib.PinElement({
        glyph: tier ? '\u2605' : String(idx + 1),
        glyphColor: 'white',
        background: bgColor,
        borderColor: borderColor,
        scale: tier ? 1.4 : 1.1,
      });

      const marker = new markerLib.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: place.name,
        content: markerView.element,
      });

      const infoWindow = new gmaps.InfoWindow({
        content: [
          '<div style="min-width:220px;font-family:system-ui;font-size:13px;">',
          place.photo_url ? `<img src="${place.photo_url}" alt="${place.name}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />` : '',
          '<div style="display:flex;align-items:center;gap:6px;">',
          `<b style="font-size:14px;">${place.name}</b>`,
          tier === 'gold' ? '<span style="background:linear-gradient(135deg,#D4A017,#F5D76E);color:#7C5E00;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:700;">POPULAR</span>' : '',
          tier === 'silver' ? '<span style="background:#8B8B83;color:white;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600;">NOTABLE</span>' : '',
          '</div>',
          place.rating ? `<div style="color:#f59e0b;margin:4px 0;">${'\u2605'.repeat(Math.min(Math.round(place.rating), 5))} ${place.rating} (${place.user_ratings_total || 0})</div>` : '',
          place.vicinity ? `<div style="color:#666;font-size:11px;margin-bottom:6px;">${place.vicinity}</div>` : '',
          place.phone ? `<div style="font-size:11px;color:#666;">\uD83D\uDCDE ${place.phone}</div>` : '',
          `<button onclick="(window.__kgc_onAdd||(()=>{}))(${idx})" style="background:#059669;color:white;border:none;padding:5px 14px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;margin-right:4px;margin-top:4px;">${locale === 'bn' ? '\u09B0\u09C1\u099F\u09C7 \u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8' : 'Add to Route'}</button>`,
          `<button onclick="(window.__kgc_onDetails||(()=>{}))(${idx})" style="background:#2563eb;color:white;border:none;padding:5px 14px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;margin-top:4px;">${locale === 'bn' ? '\u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4' : 'Details'}</button>`,
          '</div>',
        ].join(''),
      });

      marker.addListener('click', () => infoWindow.open(map, marker));
      markersRef.current.push(marker);
    });

    fitBoundsToPlaces(results);

    window.__kgc_onAdd = (idx) => {
      const p = results[idx];
      if (p && onPlaceSelect) onPlaceSelect({ ...p, coordinates: { lat: p.lat, lng: p.lng } });
    };
    window.__kgc_onDetails = (idx) => {
      const p = results[idx];
      if (p && onShowMore) onShowMore(p);
    };
  }, [map, markerLib, clearMarkers, clearCircle, locale, onPlaceSelect, onShowMore, fitBoundsToPlaces]);

  // User location marker — pulsing blue dot with heading arrow
  useEffect(() => {
    if (!map || !markerLib || !userLocation?.lat) return;
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);

    const container = document.createElement('div');
    container.style.cssText = 'position:relative;width:24px;height:24px;';

    const dot = document.createElement('div');
    dot.style.cssText = 'position:absolute;top:4px;left:4px;width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(59,130,246,0.6);';
    container.appendChild(dot);

    // Heading arrow
    if (heading != null && !isNaN(heading)) {
      const arrow = document.createElement('div');
      arrow.style.cssText = `position:absolute;top:-8px;left:50%;transform:translateX(-50%) rotate(${heading}deg);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid #3b82f6;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));`;
      container.appendChild(arrow);
    }

    const marker = new markerLib.AdvancedMarkerElement({
      map,
      position: { lat: userLocation.lat, lng: userLocation.lng },
      title: locale === 'bn' ? 'আপনার অবস্থান' : 'Your Location',
      content: container,
    });
    userMarkerRef.current = marker;
  }, [map, markerLib, userLocation, heading, locale]);

  // Draw dashed line between selected places on map
  const routeLineRef = useRef(null);

  useEffect(() => {
    const gmaps = window.google?.maps;
    if (!gmaps || !map) return;
    if (routeLineRef.current) { routeLineRef.current.setMap(null); routeLineRef.current = null; }

    // Collect selected places from search results
    if (!places || places.length === 0) return;
    const selectedCoords = places
      .filter(p => selectedPlaceIds?.includes(p.place_id) && p.lat != null && p.lng != null)
      .map(p => ({ lat: p.lat, lng: p.lng }));

    if (selectedCoords.length < 2) return;

    routeLineRef.current = new gmaps.Polyline({
      path: selectedCoords,
      geodesic: true,
      strokeColor: '#059669',
      strokeOpacity: 0.7,
      strokeWeight: 3,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
        offset: '0',
        repeat: '20px',
      }],
      map,
    });

    return () => {
      if (routeLineRef.current) { routeLineRef.current.setMap(null); routeLineRef.current = null; }
    };
  }, [map, places, selectedPlaceIds]);

  // Search
  const doSearch = useCallback(async () => {
    if (!map) return;
    setSearching(true);
    setError(null);
    try {
      let results;
      const c = Array.isArray(center) ? { lat: center[0], lng: center[1] } : { lat: center.lat, lng: center.lng };
      if (mode === 'text' && textQuery) {
        results = await fetchPlacesByText(textQuery);
      } else {
        results = await fetchNearbyPlaces(c.lat, c.lng, radius);
      }
      setPlaces(results);
      renderMarkersRef.current?.(results);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || String(err) || 'Unknown error');
    } finally {
      setSearching(false);
    }
  }, [center, radius, mode, textQuery, map, setSearching, setError, setPlaces]);

  const renderMarkersRef = useRef(null);
  renderMarkersRef.current = renderMarkers; // eslint-disable-line

  useEffect(() => {
    if (!map) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(doSearch, 600);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [doSearch, map]);

  useEffect(() => {
    if (!map) return;
    const c = Array.isArray(center) ? { lat: center[0], lng: center[1] } : { lat: center.lat, lng: center.lng };
    map.panTo(c);
    drawRadiusCircle();
  }, [center, map, drawRadiusCircle]);

  useEffect(() => { drawRadiusCircle(); }, [drawRadiusCircle]);

  // Map type
  useEffect(() => { if (map) map.setMapTypeId(mapType); }, [mapType, map]);

  useEffect(() => {
    const h = () => { if (map) map.invalidateSize?.(); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [map]);

  useEffect(() => () => { window.__kgc_onAdd = undefined; window.__kgc_onDetails = undefined; }, []);

  return null;
}

const GoogleDiscoverMap = memo(function GoogleDiscoverMap({
  center = [23.8103, 90.4125],
  radius = 10000,
  mode = 'nearby',
  textQuery = '',
  locationName = 'Bangladesh',
  locale = 'en',
  onPlaceSelect,
  onShowMore,
  userLocation,
  heading,
  selectedPlaceIds = [],
}) {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);
  const [mapType, setMapType] = useState('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const initialCenter = Array.isArray(center) ? { lat: center[0], lng: center[1] } : { lat: center.lat, lng: center.lng };

  if (!apiKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
        <p className="text-amber-800 font-semibold">Google Maps API Key Missing</p>
        <p className="text-amber-700 text-sm mt-1">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5">
          <MapIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground font-medium">{locationName}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
          <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs">{mode === 'text' ? 'Search' : `${Math.round(radius / 1000)}km`}</span>
        </div>
        {!searching && places.length > 0 && (
          <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">{places.length} places</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setShowTraffic(!showTraffic)} className={`text-xs px-2 py-1 rounded-full transition-colors ${showTraffic ? 'bg-blue-100 text-blue-700' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}><Layers className="h-3 w-3 inline mr-1" />Traffic</button>
          <select value={mapType} onChange={e => setMapType(e.target.value)} className="text-xs px-2 py-1 rounded-full bg-muted border-0 focus:ring-1 focus:ring-primary text-muted-foreground cursor-pointer">
            <option value="roadmap">Map</option>
            <option value="satellite">Satellite</option>
            <option value="terrain">Terrain</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="w-full h-[500px] rounded-lg overflow-hidden relative bg-muted border">
        <APIProvider apiKey={apiKey} onLoad={() => setLoading(false)}>
          <Map
            defaultCenter={initialCenter}
            defaultZoom={13}
            mapId="kgc-discover-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            fullscreenControl={true}
            streetViewControl={true}
            mapTypeControl={false}
            style={{ width: '100%', height: '100%' }}
          >
            <MapContent
              center={center}
              radius={radius}
              mode={mode}
              textQuery={textQuery}
              locale={locale}
              onPlaceSelect={onPlaceSelect}
              onShowMore={onShowMore}
              userLocation={userLocation}
              heading={heading}
              selectedPlaceIds={selectedPlaceIds}
              places={places}
              setPlaces={setPlaces}
              setLoading={setLoading}
              setSearching={setSearching}
              setError={setError}
            />
          </Map>
        </APIProvider>

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
              </div>
            </div>
          </div>
        )}

        {!searching && !loading && !error && places.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/90 rounded-xl px-5 py-4 shadow-lg text-center max-w-[260px]">
              <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-medium">{locale === 'bn' ? '\u0995\u09CB\u09A8\u09CB \u09B8\u09CD\u09A5\u09BE\u09A8 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF' : 'No places found'}</p>
            </div>
          </div>
        )}
      </div>

      {!searching && !loading && places.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.slice(0, 20).map((place, idx) => {
            const tier = getPopularTier(place.name);
            return (
            <div key={place.place_id || idx} className={`bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex ${tier === 'gold' ? 'ring-2 ring-yellow-400' : tier === 'silver' ? 'ring-1 ring-gray-300' : ''}`}>
              <div className="w-24 min-h-[96px] flex-shrink-0 bg-muted">
                {place.photo_url ? (
                  <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <MapPin className={`h-5 w-5 ${tier === 'gold' ? 'text-yellow-500' : 'text-muted-foreground/30'}`} />
                    <span className="text-xs font-bold text-muted-foreground/40 mt-1">{idx + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-sm truncate" title={place.name}>{place.name}</h4>
                    {tier === 'gold' && <span className="text-[9px] bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold px-1.5 py-0.5 rounded">POPULAR</span>}
                    {tier === 'silver' && <span className="text-[9px] bg-gray-300 text-gray-700 font-semibold px-1.5 py-0.5 rounded">NOTABLE</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {place.rating ? (
                      <><Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" /><span className="text-xs">{place.rating} ({place.user_ratings_total})</span></>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">{'\u2014'}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{place.vicinity || ''}</p>
                  {userLocation && place.lat != null && (
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      {(() => {
                        const R = 6371;
                        const dLat = (place.lat - userLocation.lat) * Math.PI / 180;
                        const dLng = (place.lng - userLocation.lng) * Math.PI / 180;
                        const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(place.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
                        return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
                      })()} km away
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {selectedPlaceIds?.includes(place.place_id) ? (
                    <button onClick={() => onPlaceSelect?.({ ...place, coordinates: { lat: place.lat, lng: place.lng } })} className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors">
                      {locale === 'bn' ? '\u2212 \u09B8\u09B0\u09BE\u09A8' : '\u2212 Remove'}
                    </button>
                  ) : (
                    <button onClick={() => onPlaceSelect?.({ ...place, coordinates: { lat: place.lat, lng: place.lng } })} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                      {locale === 'bn' ? '+ \u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8' : '+ Add'}
                    </button>
                  )}
                  <button onClick={() => onShowMore?.(place)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {locale === 'bn' ? '\u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4' : 'Details'}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default GoogleDiscoverMap;
