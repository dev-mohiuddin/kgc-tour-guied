'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';

const VIDEO_EXTS = /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i;

function isVideoUrl(url) {
  return VIDEO_EXTS.test(url || '');
}

export default function PhotoSlider({ photos = [], photoUrl, photoCount = 0, placeName = '', videos = [] }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const videoRef = useRef(null);

  // Build media array: photos first, then videos
  const imageItems = photos?.length > 0
    ? photos.map(p => typeof p === 'string' ? { url: p, type: 'image' } : { url: p.photo_url || p.url || '', type: 'image' }).filter(m => m.url)
    : photoUrl ? [{ url: photoUrl, type: isVideoUrl(photoUrl) ? 'video' : 'image' }] : [];

  const videoItems = videos?.length > 0
    ? videos.map(v => typeof v === 'string' ? { url: v, type: 'video' } : { url: v.url || v.video_url || '', type: 'video' }).filter(m => m.url)
    : [];

  const allMedia = [...imageItems, ...videoItems];
  const total = allMedia.length;

  const goTo = useCallback((index) => {
    setCurrent((index + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || total <= 1) return;
    timerRef.current = setInterval(next, 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplay, next, total]);

  const pauseAutoplay = useCallback(() => {
    setAutoplay(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resumeAutoplay = useCallback(() => {
    setAutoplay(true);
  }, []);

  // Touch swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (total === 0) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-muted/50 rounded-xl h-56 flex flex-col items-center justify-center gap-2">
        <svg className="h-10 w-10 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>
        <p className="text-xs text-muted-foreground/60">
          {photoCount > 0 ? `${photoCount} photos available` : 'No photos'}
        </p>
        {photoCount > 0 && (
          <span className="text-[10px] text-muted-foreground/40">View on Google Maps for photos</span>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className="relative group rounded-xl overflow-hidden bg-muted"
        onMouseEnter={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main media with fade transition */}
        <div className="relative w-full h-56">
          {allMedia.map((media, i) => (
            media.type === 'video' ? (
              <video
                key={i}
                src={media.url}
                className={`absolute inset-0 w-full h-56 object-cover transition-opacity duration-500 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                controls={i === current}
                muted
                loop
                playsInline
                ref={i === current ? videoRef : null}
              >
                <source src={media.url} />
              </video>
            ) : (
              <img
                key={i}
                src={media.url}
                alt={`${placeName} photo ${i + 1}`}
                className={`absolute inset-0 w-full h-56 object-cover transition-opacity duration-500 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (total > 1) e.target.style.display = 'none';
                }}
              />
            )
          ))}
        </div>

        {/* Fullscreen button */}
        <button
          onClick={() => setLightbox(true)}
          className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>

        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dots + thumbnail strip */}
        {total > 1 && (
          <>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {allMedia.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
            <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full z-20">
              {current + 1}/{total}
            </span>
          </>
        )}

        {/* Thumbnail row (desktop only) */}
        {total > 3 && (
          <div className="hidden md:flex gap-1 p-1 bg-black/30 absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg z-20">
            {allMedia.slice(0, 5).map((media, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-8 h-8 rounded overflow-hidden border-2 transition-all ${i === current ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                {media.type === 'video' ? (
                  <div className="w-full h-full bg-black/60 flex items-center justify-center"><Play className="h-3 w-3 text-white" /></div>
                ) : (
                  <img src={media.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10">
            <X className="h-6 w-6" />
          </button>
          {allMedia[current]?.type === 'video' ? (
            <video
              src={allMedia[current].url}
              className="max-w-full max-h-[90vh] object-contain select-none"
              onClick={(e) => e.stopPropagation()}
              controls
              autoPlay
              playsInline
            >
              <source src={allMedia[current].url} />
            </video>
          ) : (
            <img
              src={allMedia[current]?.url}
              alt={`${placeName} photo ${current + 1}`}
              className="max-w-full max-h-[90vh] object-contain select-none"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}
          {total > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3">
                <ChevronRight className="h-6 w-6" />
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {current + 1} / {total}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
