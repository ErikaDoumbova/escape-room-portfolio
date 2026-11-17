import { useEffect, useState, type RefObject } from 'react';

/**
 * Desktop panning for a horizontally scrolling room (handoff §10.1):
 * click-and-drag with the mouse and the ←/→ keys. Touch and trackpads use
 * native scrolling. Returns whether the room is wider than the window.
 */
export function usePan(viewportRef: RefObject<HTMLElement | null>, reducedMotion: boolean) {
  const [pannable, setPannable] = useState(false);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => setPannable(el.scrollWidth > el.clientWidth + 1);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    measure();

    let startX = 0;
    let startScroll = 0;
    let pointerId: number | null = null;
    let dragged = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (el.scrollWidth <= el.clientWidth) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      dragged = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 4) {
        dragged = true;
        el.setPointerCapture(e.pointerId);
        el.dataset.dragging = 'true';
      }
      if (dragged) el.scrollLeft = startScroll - dx;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      delete el.dataset.dragging;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    // A drag that ends on a pin must not also click it.
    const onClickCapture = (e: MouseEvent) => {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
        dragged = false;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable], dialog')) return;
      if (document.querySelector('dialog[open]')) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollBy({
        left: (e.key === 'ArrowLeft' ? -1 : 1) * el.clientWidth * 0.35,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('click', onClickCapture, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      ro.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [viewportRef, reducedMotion]);

  return pannable;
}
