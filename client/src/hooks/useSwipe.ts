import { useRef } from "react";

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseSwipeOptions): SwipeHandlers {
  const startX = useRef<number | null>(null);

  return {
    onTouchStart: (e: React.TouchEvent): void => {
      startX.current = e.touches[0]!.clientX;
    },
    onTouchEnd: (e: React.TouchEvent): void => {
      if (startX.current === null) return;
      const delta = e.changedTouches[0]!.clientX - startX.current;
      if (delta < -threshold) onSwipeLeft?.();
      if (delta > threshold) onSwipeRight?.();
      startX.current = null;
    },
  };
}
