
import React, { useState, useRef, useCallback } from 'react';

interface SwipeOptions {
  actionWidth: number;
  disabled?: boolean;
}

export const useSwipeable = ({ actionWidth, disabled }: SwipeOptions) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const directionLock = useRef<'horizontal' | 'vertical' | null>(null);

  // Fix: Explicitly import React to resolve missing namespace for PointerEvent
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    isDragging.current = true;
    directionLock.current = null;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offset;
  }, [disabled, offset]);

  // Fix: Explicitly import React to resolve missing namespace for PointerEvent
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!directionLock.current) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        directionLock.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
    }

    if (directionLock.current === 'horizontal') {
      let newOffset = startOffset.current + dx;
      // Resistance
      if (newOffset > actionWidth) {
        newOffset = actionWidth + (newOffset - actionWidth) * 0.2;
      } else if (newOffset < -actionWidth) {
        newOffset = -actionWidth + (newOffset + actionWidth) * 0.2;
      }
      setOffset(newOffset);
    }
  }, [actionWidth]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    // Snap logic
    if (offset > actionWidth / 2) {
      setOffset(actionWidth);
    } else if (offset < -actionWidth / 2) {
      setOffset(-actionWidth);
    } else {
      setOffset(0);
    }
  }, [actionWidth, offset]);

  const reset = useCallback(() => setOffset(0), []);

  return { 
    offset, 
    handlePointerDown, 
    handlePointerMove, 
    handlePointerUp, 
    reset 
  };
};
