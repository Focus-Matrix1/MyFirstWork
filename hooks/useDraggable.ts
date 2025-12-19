import { useState, useEffect, useCallback } from 'react';
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

export const useDraggable = ({ onDrop, onDragStart }: UseDraggableProps) => {
  const [dragItem, setDragItem] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const getDropZone = (x: number, y: number): QuadrantId | null => {
    const elements = document.elementsFromPoint(x, y);
    const zone = elements.find(el => el.hasAttribute('data-zone-id'));
    return zone ? (zone.getAttribute('data-zone-id') as QuadrantId) : null;
  };

  const startDrag = useCallback((task: Task, clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
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
      e.preventDefault();
      
      const { clientX, clientY } = e;
      setDragItem(prev => prev ? { ...prev, x: clientX, y: clientY } : null);

      const zone = getDropZone(clientX, clientY);
      if (zone) {
        const zoneContent = document.querySelector(`[data-zone-id="${zone}"] .task-list-container`);
        if (zoneContent) {
          const items = Array.from(zoneContent.children).filter(el => el.hasAttribute('data-task-id'));
          let index = items.length;

          for (let i = 0; i < items.length; i++) {
            const rect = items[i].getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            if (clientY < centerY) {
              index = i;
              break;
            }
          }
          setDropTarget({ zone, index });
        } else {
          setDropTarget({ zone, index: 0 });
        }
      } else {
        setDropTarget(null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!dragItem) return;
      
      if (dropTarget) {
        onDrop(dragItem.task, dropTarget);
      } else {
        // Fallback or secondary action (like opening inbox if dropped outside)
        const zone = getDropZone(e.clientX, e.clientY);
        if (dragItem.task.category === 'inbox' && !zone) {
            // This case might need specific handling in the component
        }
      }

      setDragItem(null);
      setDropTarget(null);
    };

    if (dragItem) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragItem, dropTarget, onDrop]);

  return { dragItem, dropTarget, startDrag };
};