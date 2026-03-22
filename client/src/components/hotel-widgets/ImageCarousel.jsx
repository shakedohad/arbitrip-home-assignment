import { useCallback, useEffect, useState } from "react";
import "./ImageCarousel.css";

/**
 * Image carousel with prev/next controls. Uses dir="ltr" on controls so arrow
 * glyphs are not mirrored in RTL pages (arrows always point outward).
 */
export default function ImageCarousel({ images, alt = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  if (!images?.length) return null;

  return (
    <div className="image-carousel" dir="ltr">
      <img
        src={images[currentIndex]}
        alt={alt}
        className="image-carousel__image"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            className="image-carousel__button image-carousel__button--prev"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={nextImage}
            className="image-carousel__button image-carousel__button--next"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
