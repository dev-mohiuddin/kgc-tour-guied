/**
 * Unified Place Interface (both providers output this shape)
 *
 * @typedef {Object} UnifiedPlace
 * @property {string} id          - Unique place identifier
 * @property {string} name        - Place name
 * @property {number|null} rating - Rating (1-5)
 * @property {string} address     - Human-readable address
 * @property {number} lat         - Latitude
 * @property {number} lng         - Longitude
 * @property {string|null} image_url - First photo URL (or null)
 * @property {number} reviews_count - Total user reviews
 */

/**
 * Map a RapidAPI result to UnifiedPlace while keeping original fields.
 */
export function fromRapidAPI(item) {
  const photo =
    item.photos_sample?.[0]?.photo_url ||
    item.photo ||
    item.photos?.[0] ||
    item.thumbnail ||
    null;

  const unified = {
    id: item.place_id || item.business_id || item.google_id || `rp-${Math.random().toString(36).slice(2, 8)}`,
    name: item.name || item.title || 'Unknown',
    rating: item.rating ?? null,
    address: item.full_address || item.address || item.vicinity || '',
    lat: item.latitude ?? item.lat,
    lng: item.longitude ?? item.lng,
    image_url: photo,
    reviews_count: item.review_count || item.user_ratings_total || 0,
  };

  // Keep original fields for backward compat
  return {
    ...item,
    ...unified,
    // Explicit aliases so existing Leaflet components work unchanged
    photo_url: photo,
    user_ratings_total: unified.reviews_count,
    vicinity: unified.address,
    place_id: unified.id,
    photos: item.photos_sample || item.photos || [],
    photo_count: item.photo_count || (photo ? 1 : 0),
    place_link: item.place_link || null,
    subtypes: item.subtypes || [],
  };
}

/**
 * Map a Google Places API result to UnifiedPlace while keeping original fields.
 */
export function fromGoogle(item) {
  const photoRef = item.photos?.[0]?.photo_reference || null;
  const imageUrl = photoRef
    ? `/api/place-photo?maxwidth=400&photo_reference=${photoRef}`
    : null;

  // Generate photo URLs for ALL photos (not just first)
  const allPhotos = (item.photos || []).map(p => {
    if (p.photo_url) return { photo_url: p.photo_url, photo_reference: p.photo_reference };
    const ref = p.photo_reference;
    return {
      photo_url: ref ? `/api/place-photo?maxwidth=800&photo_reference=${ref}` : null,
      photo_reference: ref,
    };
  }).filter(p => p.photo_url);

  const lat = item.geometry?.location?.lat ?? null;
  const lng = item.geometry?.location?.lng ?? null;

  const unified = {
    id: item.place_id || `gp-${Math.random().toString(36).slice(2, 8)}`,
    name: item.name || 'Unknown',
    rating: item.rating ?? null,
    address: item.formatted_address || item.vicinity || '',
    lat,
    lng,
    image_url: imageUrl,
    reviews_count: item.user_ratings_total || 0,
  };

  return {
    ...item,
    ...unified,
    // Backward-compat aliases
    photo_url: imageUrl,
    user_ratings_total: unified.reviews_count,
    vicinity: unified.address,
    place_id: unified.id,
    photos: allPhotos.length > 0 ? allPhotos : (item.photos || (photoRef ? [{ photo_reference: photoRef }] : [])),
    photo_count: allPhotos.length || item.photos?.length || (photoRef ? 1 : 0),
    subtypes: item.types || [],
  };
}
