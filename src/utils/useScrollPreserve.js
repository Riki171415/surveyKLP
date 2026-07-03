/**
 * useScrollPreserve — hook untuk menjaga posisi scroll saat state
 * update dari Gemini AI menyebabkan perubahan tinggi konten.
 *
 * Cara kerja:
 * - Simpan scroll position sebelum render (useLayoutEffect)
 * - Restore setelah render selesai
 *
 * Gunakan di komponen yang punya AI state updates (setAiInsight, setAiReports, dll)
 */
import { useLayoutEffect, useRef } from 'react';

export function useScrollPreserve(deps = []) {
  const scrollContainerRef = useRef(null);

  useLayoutEffect(() => {
    // Cari scroll container — bisa #main-scroll atau window
    const container = document.getElementById('main-scroll');
    if (!container) return;

    const prevScrollTop = container.scrollTop;

    // Setelah commit DOM, restore posisi scroll
    // (ini dijalankan sebelum browser paint, jadi tidak ada flicker)
    return () => {
      // cleanup tidak perlu restore, justru kita restore di effect berikutnya
    };
  }, deps);

  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll');
    if (!container) return;
    // Simpan posisi sebelum re-render
    const savedScroll = container.scrollTop;
    return () => {
      // Setelah re-render, restore langsung
      if (savedScroll > 0) {
        container.scrollTop = savedScroll;
      }
    };
  }, deps);
}
