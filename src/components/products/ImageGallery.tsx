import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, Play, RotateCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [is360Mode, setIs360Mode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0 });

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (is360Mode && dragRef.current.isDragging) {
      const delta = e.clientX - dragRef.current.startX;
      if (Math.abs(delta) > 30) {
        if (delta > 0) handleNext(); else handlePrevious();
        dragRef.current.startX = e.clientX;
      }
      return;
    }
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (is360Mode) {
      dragRef.current = { isDragging: true, startX: e.clientX };
    }
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!is360Mode) return;
    const touch = e.touches[0];
    const delta = touch.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 30) {
      if (delta > 0) handleNext(); else handlePrevious();
      dragRef.current.startX = touch.clientX;
    }
  }, [is360Mode, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (is360Mode) {
      dragRef.current = { isDragging: true, startX: e.touches[0].clientX };
    }
  };

  const mainImage = (
    <div className="relative group">
      <div
        className={cn(
          "relative aspect-square bg-secondary rounded-xl overflow-hidden",
          is360Mode ? "cursor-grab active:cursor-grabbing" : isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
        )}
        onClick={() => !is360Mode && setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsZoomed(false); dragRef.current.isDragging = false; }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <img
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className={cn(
            "w-full h-full object-cover transition-transform duration-200 select-none",
            isZoomed && "scale-[4]"
          )}
          style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
          draggable={false}
        />

        {/* 360 Mode Overlay */}
        {is360Mode && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse">
              <RotateCw className="h-3 w-3" />
              360° View — Drag to rotate
            </div>
            {/* Progress dots */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === currentIndex ? "bg-accent scale-125" : "bg-foreground/30")} />
              ))}
            </div>
          </div>
        )}

        {/* Top-right controls */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIs360Mode(!is360Mode); setIsZoomed(false); }}
              className={cn(
                "p-2 backdrop-blur-sm rounded-lg transition-colors",
                is360Mode ? "bg-accent text-accent-foreground" : "bg-card/80 text-foreground hover:bg-card"
              )}
              title="360° View"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          )}
          {!is360Mode && (
            <button
              onClick={(e) => { e.stopPropagation(); setFullscreen(true); }}
              className="p-2 bg-card/80 backdrop-blur-sm rounded-lg hover:bg-card"
              title="Fullscreen Zoom"
            >
              <ZoomIn className="h-5 w-5 text-foreground" />
            </button>
          )}
        </div>

        {/* Navigation Arrows (hidden in 360 mode) */}
        {images.length > 1 && !is360Mode && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {!is360Mode && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-card/80 backdrop-blur-sm rounded-full text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {mainImage}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all",
                index === currentIndex ? "border-accent" : "border-transparent hover:border-border"
              )}
            >
              <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              {image.includes('video') && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                  <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center" onClick={() => setFullscreen(false)}>
          <button className="absolute top-4 right-4 p-2 bg-card rounded-full z-10 hover:bg-secondary" onClick={() => setFullscreen(false)}>
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handlePrevious(); }} className="absolute left-4 p-3 bg-card rounded-full hover:bg-secondary">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-4 p-3 bg-card rounded-full hover:bg-secondary">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={images[currentIndex]}
            alt={`${productName} - Fullscreen`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-card rounded-full text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};
