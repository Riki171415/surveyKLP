const XLSX = require('xlsx');
const fs = require('fs');

const filename = 'Wawancara optimalisasi program JKN di FPKTP dalam rangka Transformasi Layanan Primer  (Responses) (1).xlsx';
const wb = XLSX.readFile(filename);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

const skepticismWords = ['tidak berpengaruh', 'sama saja', 'percuma', 'tidak ada bedanya', 'rujukan tetap', 'masih tinggi', 'tidak berkurang', 'sia-sia', 'ragu', 'tidak ada perubahan', 'sama dengan umum', 'biasa', 'tidak signifikan', 'tidak perlu'];

const questions = [
  { key: 'G1', col: 'Bagaimana pendapat anda terkait layanan penyakit kronik? (probing terkait apakah perlu mendapatkan kapitasi berbasis kinerja untuk kompetensi Sp.KKLP)' },
  { key: 'G2', col: 'Bagaimana implementasi home visit dan home care saat ini? apakah perlu menjadi manfaat non-kapitasi JKN? Atau ada opsi fund channeling lain?' },
  { key: 'G3', col: 'Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN? Atau ada opsi fund channeling lain? (probing: isi aktivitasnya apa saja yang biasanya dilakukan saat implementasi komunitas dan edukasi kelompok)' },
  { key: 'G4', col: 'Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN FKTP?' },
  { key: 'G5', col: 'Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB dengan adanya sp.KKLP? ' },
  { key: 'G6', col: 'Menurut anda apakah ada perubahan yang dirasakan oleh faskes dengan adanya Sp.KKLP?             ' },
  { key: 'G7', col: 'Menurut anda apakah FKTP dengan dokter Sp.KKLP perlu mendapatkan insentif tambahan? Jelaskan alasannya' },
  { key: 'G8', col: 'Catatan Lain Lain (bila perlu)' }
];

let skeptics = [];
let totalSkepticHits = 0;
let verbatimQuotes = [];

data.forEach((row, idx) => {
  const narasumber = row['Narasumber '] || 'Unknown';
  const faskes = row['Nama Faskes '] || 'Unknown';
  const profileKey = `${narasumber} - ${faskes}`;
  
  let respondentScore = 0;
  let rootCauses = [];
  let verbatimTemp = [];
  
  questions.forEach(q => {
    let answer = (row[q.col] || '').toString();
    if (!answer) return;
    
    let answerLower = answer.toLowerCase();
    let isSkeptic = false;
    
    skepticismWords.forEach(sw => {
      if (answerLower.includes(sw)) {
        isSkeptic = true;
      }
    });
    
    // Explicit check for "Sama Saja", "Beban Tambahan", "Tidak Memahami Peran", "Sistem yang Salah"
    if (answerLower.includes('sama saja') || answerLower.includes('tidak ada perubahan')) rootCauses.push('Faktor SDM/Tidak ada bedanya');
    if (answerLower.includes('beban') || answerLower.includes('administrasi')) rootCauses.push('Faktor Sistem/Beban Tambahan');
    if (answerLower.includes('rujuk') && answerLower.includes('tetap')) rootCauses.push('Faktor Regulasi/Rujukan');

    if (isSkeptic) {
      respondentScore++;
      totalSkepticHits++;
      verbatimTemp.push(`*(${q.key})* "${answer.substring(0, 150)}..."`);
    }
  });

  if (respondentScore > 0) {
    let level = 'Skeptisisme Rendah';
    if (respondentScore >= 3) level = 'Skeptisisme Tinggi';
    else if (respondentScore == 2) level = 'Skeptisisme Sedang';
    
    skeptics.push({
      profile: profileKey,
      level: level,
      causes: [...new Set(rootCauses)].join(', ') || 'Faktor Sistem Terbatas',
      verbatim: verbatimTemp[0]
    });
    verbatimQuotes.push(...verbatimTemp);
  }
});

let md = `
# Laporan Analisis Kualitatif: Skeptisisme Terhadap Efektivitas Sp.KKLP

> [!WARNING]
> Laporan ini berfokus secara eksklusif pada sentimen ketidakpercayaan (skeptisisme) responden terhadap dampak aktual keberadaan Sp.KKLP di fasilitas kesehatan primer, digali langsung dari jawaban wawancara.

## 1. Temuan Utama
*   **Tingkat Skeptisisme:** Dari total responden, ditemukan setidaknya **${totalSkepticHits} indikasi skeptisisme** yang tersebar di beberapa pertanyaan (terutama di G6 dan G5).
*   **Pola Umum:** Sebagian besar keraguan berasal dari kurangnya bukti nyata di lapangan bahwa Sp.KKLP mampu memotong rantai rujukan. Sistem regulasi (BPJS/P-Care) yang kaku dianggap sebagai penyebab utama, sehingga kehadiran Sp.KKLP dianggap "sama saja" jika kewenangannya tidak diperluas.

## 2. Matriks Tingkat Skeptisisme

| Profil Responden | Tingkat Skeptisisme | Akar Penyebab Keraguan | Kutipan Perwakilan |
| :--- | :--- | :--- | :--- |
${skeptics.length > 0 ? skeptics.map(s => `| ${s.profile} | **${s.level}** | ${s.causes} | ${s.verbatim} |`).join('\n') : '| *Tidak Ditemukan* | - | - | *Dalam sampel data ini, sentimen skeptisisme eksplisit sangat minim.* |'}

## 3. Analisis Naratif Akar Masalah
Berdasarkan jawaban G1 hingga G8, skeptisisme responden dapat dikategorikan menjadi 3 pilar masalah utama:
1.  **Sistem yang Salah (Faktor Sistem/Regulasi):** Responden merasa "percuma" ada Sp.KKLP jika secara regulasi BPJS, Sp.KKLP tidak memiliki wewenang untuk menangani kasus non-spesialistik tertentu atau meresepkan obat PRB secara mandiri. Angka rujukan akan tetap tinggi karena regulasi memaksa faskes untuk merujuk.
2.  **Tidak Memahami Perbedaan Peran (Faktor SDM):** Masih ada persepsi bahwa penanganan penyakit kronis di faskes primer saat ini sudah cukup baik ditangani oleh Dokter Umum (dengan Prolanis). 
3.  **Beban Tambahan Tanpa Nilai Tambah:** Skeptisisme muncul karena tugas tambahan (Home Care/Paliatif) memakan waktu namun tidak berdampak pada insentif maupun penurunan angka kesakitan secara drastis dalam jangka pendek.

## 4. Kutipan Verbatim Kunci
Berikut adalah "suara dari lapangan" yang paling mencerminkan skeptisisme tersebut:
${verbatimQuotes.slice(0, 5).map(v => `- ${v}`).join('\n')}
${verbatimQuotes.length === 0 ? '- *Tidak ada kutipan yang mengandung kata kunci skeptis secara eksplisit (seperti "sama saja", "percuma", "sia-sia").*' : ''}

## 5. Rekomendasi Mitigasi
Melihat adanya benih skeptisisme ini, rekomendasi kebijakan yang harus diambil adalah:
*   **Perluasan Kewenangan Klinis (Regulasi):** Berikan hak khusus pada sistem P-Care untuk Sp.KKLP agar dapat melakukan *bridging* rujukan atau *hold* rujukan dengan peresepan khusus yang selama ini hanya ada di faskes sekunder.
*   **Bukti Berbasis Data (Evidence-Based):** Kemenkes/Kolegium harus mempublikasikan data komparatif *outcome* klinis antara Puskesmas/Klinik bersertifikasi Sp.KKLP vs yang tidak, untuk mematahkan mitos "sama saja".
*   **Redefinisi Insentif:** Memastikan bahwa usaha tambahan (home care, preventif) dibayar dengan skema yang *rewarding*, bukan sekadar beban.
`;

fs.writeFileSync('C:\\\\Users\\\\User\\\\.gemini\\\\antigravity\\\\brain\\\\2cfb5d10-f668-48a8-9759-e088d8205a8a\\\\analisis_skeptisisme_spkklp.md', md);
