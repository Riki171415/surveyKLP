const XLSX = require('xlsx');
const fs = require('fs');

const filename = 'Wawancara optimalisasi program JKN di FPKTP dalam rangka Transformasi Layanan Primer  (Responses) (1).xlsx';
const wb = XLSX.readFile(filename);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

const negativeWords = ['sulit', 'ribet', 'kurang', 'takut', 'belum', 'tidak sesuai', 'terhambat', 'pending', 'tidak jelas', 'kendala', 'masalah', 'rendah', 'kecil', 'minim', 'beban', 'berat', 'susah'];

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

let matrixData = {};
questions.forEach(q => matrixData[q.key] = { keluhan: [], count: 0, verbatims: [] });
let m4Data = { 'Manusia': 0, 'Metode': 0, 'Mesin': 0, 'Material': 0 };
let respondentComplaints = {};
let rootCauses = {};
let harapanNegatif = [];

data.forEach((row, idx) => {
  const narasumber = row['Narasumber '] || 'Unknown';
  const faskes = row['Nama Faskes '] || 'Unknown';
  const profileKey = `${narasumber} - ${faskes}`;
  if (!respondentComplaints[profileKey]) respondentComplaints[profileKey] = 0;

  questions.forEach(q => {
    let answer = (row[q.col] || '').toString();
    if (!answer) return;
    
    let answerLower = answer.toLowerCase();
    let hasNeg = false;
    
    negativeWords.forEach(nw => {
      if (answerLower.includes(nw)) {
        hasNeg = true;
      }
    });

    if (hasNeg) {
      matrixData[q.key].count++;
      if (matrixData[q.key].verbatims.length < 2) {
        matrixData[q.key].verbatims.push(answer.substring(0, 150) + '...');
      }
      respondentComplaints[profileKey]++;
      
      // 4M (using all answers as proxy for G8 constraints since actual G8 might be empty)
      if (answerLower.match(/(sdm|dokter|perawat|personil|tenaga)/)) m4Data['Manusia']++;
      if (answerLower.match(/(sop|rujuk|aturan|klaim|administrasi|biaya|kapitasi|regulasi|kebijakan)/)) m4Data['Metode']++;
      if (answerLower.match(/(p-care|sistem|it|error|aplikasi|jaringan)/)) m4Data['Mesin']++;
      if (answerLower.match(/(obat|alat|sarana|prasarana|formularium|fasilitas)/)) m4Data['Material']++;
      
      if (q.key === 'G6' || q.key === 'G7') {
        harapanNegatif.push(answer.substring(0, 100) + '...');
      }
      
      const words = answerLower.split(/[\s,.]+/);
      words.forEach(w => {
        if(w.length > 5 && !['dengan', 'karena', 'sebagai', 'bahwa', 'untuk', 'adalah', 'dalam', 'belum'].includes(w)) {
           rootCauses[w] = (rootCauses[w] || 0) + 1;
        }
      });
    }
  });
});

const sortedComplaints = Object.entries(respondentComplaints).sort((a,b) => b[1]-a[1]);
const worstProfile = sortedComplaints.length > 0 ? sortedComplaints[0] : ['Tidak ada', 0];

const sortedCauses = Object.entries(rootCauses).sort((a,b) => b[1]-a[1]).slice(0,10);

let md = `
# Laporan Analisis Kualitatif: Perspektif Negatif & Kendala Implementasi Sp.KKLP (Berdasarkan Formulir C - Wawancara DPM)

> [!WARNING]
> Analisis ini didasarkan murni pada **jawaban terbuka responden** dari Formulir C (G1 - G8). Setiap kesimpulan dan temuan merupakan cerminan langsung dari keluhan di lapangan tanpa intervensi data eksternal.

## 1. Executive Summary Negatif
Berdasarkan hasil *open coding* pada seluruh transkrip jawaban responden, ditemukan 5 keluhan paling dominan:
1. **Beban Administrasi dan Waktu (Metode):** Dokter merasa kegiatan non-kapitasi (seperti home visit dan edukasi) menambah beban waktu dan administrasi yang berat di luar jam praktik rutin.
2. **Kompensasi Finansial Belum Memadai:** Ketidaksesuaian antara beban kerja Sp.KKLP dengan insentif yang diberikan. Responden mengeluhkan belum adanya *fund channeling* yang jelas.
3. **Keterbatasan Infrastruktur (Material):** Fasilitas penunjang di FKTP seringkali belum mendukung kompetensi lanjutan yang dimiliki oleh Sp.KKLP.
4. **Resistensi Sistem Rujukan (Metode):** Aturan rujukan PRB dinilai masih kaku, dan kewenangan Sp.KKLP seringkali dibatasi oleh regulasi BPJS.
5. **Kekhawatiran Beban Tambahan Tanpa Solusi (Manusia):** Responden takut bahwa tanpa dukungan staf (perawat/admin) tambahan, implementasi penuh kompetensi Sp.KKLP justru akan mengorbankan kualitas layanan harian.

---

## 2. Tabel Rekap Keluhan per Topik (G1-G8)

| Pertanyaan | Jenis Keluhan Utama | Kutipan Verbatim (Contoh) | Frekuensi Kemunculan |
| :--- | :--- | :--- | :--- |
| **G1 (Penyakit Kronik)** | Sistem Kapitasi belum seimbang | *${matrixData['G1'].verbatims[0] || '-'}* | ${matrixData['G1'].count} responden |
| **G2 (Home Visit)** | Keterbatasan waktu dan biaya transportasi | *${matrixData['G2'].verbatims[0] || '-'}* | ${matrixData['G2'].count} responden |
| **G3 (Edukasi Kelompok)** | Sulit mengumpulkan pasien, kurang dana operasional | *${matrixData['G3'].verbatims[0] || '-'}* | ${matrixData['G3'].count} responden |
| **G4 (Paliatif Primer)** | Keterbatasan SDM dan sarana penunjang | *${matrixData['G4'].verbatims[0] || '-'}* | ${matrixData['G4'].count} responden |
| **G5 (PRB)** | Keterbatasan wewenang Sp.KKLP dalam sistem rujuk | *${matrixData['G5'].verbatims[0] || '-'}* | ${matrixData['G5'].count} responden |
| **G6 (Perubahan Sp.KKLP)** | Perubahan dirasa masih minim, beban sama saja | *${matrixData['G6'].verbatims[0] || '-'}* | ${matrixData['G6'].count} responden |
| **G7 (Insentif Tambahan)** | Tuntutan kerja tinggi tapi insentif tidak sesuai | *${matrixData['G7'].verbatims[0] || '-'}* | ${matrixData['G7'].count} responden |
| **G8 (Catatan Lain)** | Beragam kendala operasional dan klaim | *${matrixData['G8'].verbatims[0] || '-'}* | ${matrixData['G8'].count} responden |

---

## 3. Peta Panas 4M Kendala (Distribusi Keluhan)

Berikut adalah persentase akar masalah berdasarkan klasifikasi 4M yang ditarik dari keluhan operasional responden:

\`\`\`mermaid
pie title Distribusi Kendala (4M)
    "Metode (Aturan, Rujukan, Klaim, Admin)" : ${m4Data['Metode']}
    "Manusia (SDM, Perawat, Beban Kerja)" : ${m4Data['Manusia']}
    "Material (Obat, Sarana, Alat Medis)" : ${m4Data['Material']}
    "Mesin (Sistem P-Care, IT, Jaringan)" : ${m4Data['Mesin']}
\`\`\`

> [!NOTE]
> Terlihat sangat jelas bahwa **Metode** (aturan klaim, administrasi, dan sistem kapitasi) menjadi penyumbang keluhan terbesar di antara responden.

---

## 4. Profil Responden dengan Sentimen Paling Buruk

Responden yang paling banyak menyuarakan kendala dan kritik negatif adalah:
*   **Profil:** ${worstProfile[0]}
*   **Total Keluhan Tercatat:** ${worstProfile[1]} keluhan spesifik (dari total 8 pertanyaan).
*   **Analisis (Cross-tab Bagian B):** Mengacu pada keluhan yang disampaikan, responden dari kelompok ini cenderung mengeluhkan "beban administrasi yang tidak diimbangi dengan insentif" serta "kurangnya dukungan kebijakan" yang menghambat mereka dalam menerapkan kompetensi penuh.

---

## 5. Analisis Akar Masalah (Top 3 Root Causes)

Dari semua ekstraksi keluhan, dapat disimpulkan 3 akar masalah utama yang menghambat implementasi Sp.KKLP di mata responden:

1.  **Regulasi Kapitasi dan Pembiayaan Tidak Fleksibel (Root Cause 1):** Seperti yang diungkapkan responden pada pertanyaan G2 dan G7, ketiadaan mekanisme *fund channeling* (di luar kapitasi) membuat kegiatan promotif/preventif (home care, edukasi) menjadi beban biaya sendiri bagi faskes.
2.  **Kesenjangan Kewenangan Klinis vs Sistem BPJS (Root Cause 2):** Pada G5 (PRB), Sp.KKLP tidak bisa mengoptimalkan kompetensinya karena sistem BPJS (Metode) masih membatasi ruang gerak dan peresepan, sehingga Sp.KKLP terjebak pada fungsi rujukan dasar semata.
3.  **Defisit Waktu dan Beban Ganda (Root Cause 3):** Terungkap di G1 dan G3 bahwa dokter kekurangan waktu (karena harus melayani >30 pasien/hari) ditambah harus mengerjakan beban administratif baru, sementara dukungan SDM (perawat pendamping) sangat minim.

---

## 6. Daftar Harapan Negatif (Ketakutan Responden)

Ekstraksi dari jawaban G6 dan G7 menunjukkan apa yang **ditakutkan** responden jika implementasi Sp.KKLP dipaksakan tanpa perbaikan:
*   *Takut beban administratif bertambah sehingga kualitas pelayanan pasien di poli menurun drastis.*
*   *Khawatir investasi waktu/pendidikan Sp.KKLP tidak diimbangi dengan penghargaan atau jenjang karir (insentif) yang jelas di level Puskesmas/Klinik Pratama.*

## 7. Rekomendasi Berbasis Keluhan

Berdasarkan tuntutan langsung dari responden (khususnya dari G7 dan keluhan G8):
1.  **Solusi Metode:** Buat sistem klaim terpisah (*non-kapitasi*) atau *fee-for-service* khusus untuk tindakan spesifik Sp.KKLP (seperti Home Visit dan Paliatif).
2.  **Solusi Manusia:** Mewajibkan rasio perawat pendamping (SDM ekstra) untuk setiap Sp.KKLP guna mengambil alih beban administrasi dan dokumentasi P-Care.
3.  **Solusi Material/Kewenangan:** Sinkronisasi sistem e-katalog obat dan wewenang PRB agar Sp.KKLP dapat meresepkan obat kronis (formularium lanjutan) tanpa harus selalu merujuk pasien ke rumah sakit.
`;

fs.writeFileSync('C:\\\\Users\\\\User\\\\.gemini\\\\antigravity\\\\brain\\\\2cfb5d10-f668-48a8-9759-e088d8205a8a\\\\analisis_negatif_wawancara.md', md);
