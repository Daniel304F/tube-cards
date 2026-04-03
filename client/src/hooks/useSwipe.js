import { useRef } from "react";

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }) {
  const startX = useRef(null);

  return {
    onTouchStart: (e) => {
      startX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e) => {
      if (startX.current === null) return;
      const delta = e.changedTouches[0].clientX - startX.current;
      if (delta < -threshold) onSwipeLeft?.();
      if (delta > threshold) onSwipeRight?.();
      startX.current = null;
    },
  };
}
