import { useEffect, useRef } from 'react';

/**
 * Custom hook for natural horizontal scroll behavior
 * - Drag-to-scroll on empty space
 * - Shift + wheel to scroll horizontally
 * - Touch/swipe support for mobile
 */
export function useHorizontalScroll() {
  const scrollRef = useRef(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Drag to scroll variables
    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse down - start dragging
    const handleMouseDown = (e) => {
      // Only trigger on empty space, not on cards
      if (e.target.closest('[data-draggable]')) return;

      isDown = true;
      startX = e.pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
      element.style.cursor = 'grabbing';
      element.style.scrollBehavior = 'auto'; // Disable smooth scroll during drag
    };

    // Mouse leave - stop dragging
    const handleMouseLeave = () => {
      isDown = false;
      element.style.cursor = 'grab';
      element.style.scrollBehavior = 'smooth';
    };

    // Mouse up - stop dragging
    const handleMouseUp = () => {
      isDown = false;
      element.style.cursor = 'grab';
      element.style.scrollBehavior = 'smooth';
    };

    // Mouse move - drag scroll
    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      element.scrollLeft = scrollLeft - walk;
    };

    // Wheel - convert vertical to horizontal with Shift key
    const handleWheel = (e) => {
      // If shift key is pressed, or if we're already at top/bottom of vertical scroll
      if (e.shiftKey || element.scrollTop === 0 || element.scrollTop === element.scrollHeight - element.clientHeight) {
        e.preventDefault();
        element.scrollLeft += e.deltaY;
      }
    };

    // Touch events for mobile swipe
    let touchStartX = 0;
    let touchScrollLeft = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].pageX - element.offsetLeft;
      touchScrollLeft = element.scrollLeft;
    };

    const handleTouchMove = (e) => {
      const x = e.touches[0].pageX - element.offsetLeft;
      const walk = (x - touchStartX) * 1.5;
      element.scrollLeft = touchScrollLeft - walk;
    };

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('wheel', handleWheel, { passive: false });
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);

    // Set initial cursor
    element.style.cursor = 'grab';
    element.style.overflowX = 'auto';
    element.style.overflowY = 'hidden';
    element.style.scrollBehavior = 'smooth';
    element.style.scrollbarWidth = 'thin'; // Firefox

    // Cleanup
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return scrollRef;
}

/**
 * Hook for keyboard shortcuts in pipeline
 * - Arrow keys to navigate cards
 * - Arrow left/right to move between stages
 */
export function usePipelineKeyboard(shortcuts = {}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger when not in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const { onMoveLeft, onMoveRight, onEscape } = shortcuts;

      switch (e.key) {
        case 'ArrowLeft':
          if (e.shiftKey && onMoveLeft) {
            e.preventDefault();
            onMoveLeft();
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey && onMoveRight) {
            e.preventDefault();
            onMoveRight();
          }
          break;
        case 'Escape':
          if (onEscape) {
            onEscape();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
