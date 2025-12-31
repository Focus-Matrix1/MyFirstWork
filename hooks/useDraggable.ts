
import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, QuadrantId } from '../types';

interface DragState {
  task: Task;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

interface DropTarget {
  zone: QuadrantId;
  index: number;
}

interface UseDraggableProps {
  onDrop: (task: Task, target: DropTarget) => void;
  onDragStart?: () => void;
}

// Interfaces for Cached Layout Data
interface CachedZone {
    id: QuadrantId;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface CachedItem {
    id: string;
    zoneId: QuadrantId;
    centerY: number;
}

export const useDraggable = ({ onDrop, onDragStart }: UseDraggableProps) => {
  const [dragItem, setDragItem] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Refs for Layout Caching & Throttling
  const zonesRef = useRef<CachedZone[]>([]);
  const itemsRef = useRef<CachedItem[]>([]);
  const lastThrottleRef = useRef<number>(0);
  const dropTargetRef = useRef<DropTarget | null>(null); // To avoid stale closure in throttle check

  const startDrag = useCallback((task: Task, clientX: number, clientY: number, element: HTMLElement, pointerId: number) => {
    const rect = element.getBoundingClientRect();
    
    // 0. Critical: Capture Pointer Events to prevent scroll hijacking
    if (element && typeof element.setPointerCapture === 'function') {
        element.setPointerCapture(pointerId);
    }

    // 1. Cache Layouts NOW (Force Reflow once, then never again during drag)
    const zoneEls = document.querySelectorAll('[data-zone-id]');
    zonesRef.current = Array.from(zoneEls).map(el => {
        const r = el.getBoundingClientRect();
        return {
            id: el.getAttribute('data-zone-id') as QuadrantId,
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom
        };
    });

    const itemEls = document.querySelectorAll('[data-task-id]');
    itemsRef.current = Array.from(itemEls)
        .filter(el => el.getAttribute('data-task-id') !== task.id) // Exclude self
        .map(el => {
            const r = el.getBoundingClientRect();
            // Find parent zone manually from DOM since we are here anyway
            const parentZone = el.closest('[data-zone-id]')?.getAttribute('data-zone-id') as QuadrantId;
            return {
                id: el.getAttribute('data-task-id')!,
                zoneId: parentZone,
                centerY: r.top + (r.height / 2)
            };
        });

    // 2. Lock Interaction (CSS)
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
    document.body.style.webkitUserSelect = 'none';

    setDragItem({
      task,
      x: clientX,
      y: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    });
    
    onDragStart?.();
  }, [onDragStart]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragItem) return;
      e.preventDefault(); // Critical for preventing scroll on mobile
      
      const { clientX, clientY } = e;
      
      // 1. Update Visual Position (Real-time, unthrottled)
      setDragItem(prev => prev ? { ...prev, x: clientX, y: clientY } : null);

      // 2. Throttle Drop Calculation (e.g., every 40ms ~ 25fps)
      const now = Date.now();
      if (now - lastThrottleRef.current < 40) return;
      lastThrottleRef.current = now;

      // 3. Pure Math Hit-Testing (No DOM reads)
      
      // Find active zone
      // Logic: Is point inside rect?
      const activeZone = zonesRef.current.find(z => 
          clientX >= z.left && 
          clientX <= z.right && 
          clientY >= z.top && 
          clientY <= z.bottom
      );

      let newTarget: DropTarget | null = null;

      if (activeZone) {
          // Filter items belonging to this zone
          const zoneItems = itemsRef.current.filter(i => i.zoneId === activeZone.id);
          
          // Find insertion index based on Y position
          // Find the first item where cursor is ABOVE its center
          let index = zoneItems.length;
          for (let i = 0; i < zoneItems.length; i++) {
              if (clientY < zoneItems[i].centerY) {
                  index = i;
                  break;
              }
          }
          newTarget = { zone: activeZone.id, index };
      }

      // 4. Update State Only If Changed (React Optimization)
      const prev = dropTargetRef.current;
      if (
          !prev || 
          !newTarget || 
          prev.zone !== newTarget.zone || 
          prev.index !== newTarget.index
      ) {
          // If both null, no change. If one null, change. If values diff, change.
          if (prev !== newTarget) {
               setDropTarget(newTarget);
               dropTargetRef.current = newTarget;
          }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!dragItem) return;

      // Unlock Interaction
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      document.body.style.webkitUserSelect = '';

      if (dropTargetRef.current) {
        onDrop(dragItem.task, dropTargetRef.current);
      } else {
         // Optional: Check strictly if we are just dropping it back (no zone found)
         // or if we want logic for dropping into specific void areas. 
         // For now, if no valid target calculated via math, we cancel.
      }

      setDragItem(null);
      setDropTarget(null);
      dropTargetRef.current = null;
      zonesRef.current = [];
      itemsRef.current = [];
    };

    if (dragItem) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      
      // Safety Cleanup
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [dragItem, onDrop]);

  return { dragItem, dropTarget, startDrag };
};
