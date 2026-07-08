import { useLayoutEffect, useRef } from 'react';

export function useScrollPreserve(deps = []) {
  // Dinonaktifkan karena logika lama menyimpan nilai scroll saat render awal
  // sehingga ketika user men-scroll ke bawah dan men-klik tombol,
  // posisi scroll dipaksa kembali ke posisi awal (seringkali ke atas).
  // Browser modern sudah menangani preserve scroll dengan baik secara default.
}
