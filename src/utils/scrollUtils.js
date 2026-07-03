/**
 * scrollUtils.js — Utility untuk preserve scroll position saat ada state update besar
 * (misalnya saat AI analysis selesai dan konten baru muncul)
 * 
 * Cara pakai di handler function:
 *   const restore = saveScroll();
 *   // ... state updates ...
 *   restore();
 */

/**
 * Simpan scroll position sekarang dan kembalikan fungsi untuk restore-nya.
 * Gunakan `behavior: 'instant'` agar tidak ada animasi smooth scroll saat restore.
 */
export function saveScroll() {
  const el = document.getElementById('main-scroll');
  const scrollTop = el ? el.scrollTop : 0;
  
  return function restore() {
    if (!el || scrollTop === 0) return;
    // Double rAF: tunggu React selesai render + browser layout selesai
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTo({ top: scrollTop, behavior: 'instant' });
      });
    });
  };
}
