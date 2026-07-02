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

let allNegatives = [];
let matrixData = {};
let m4Data = { 'Manusia': 0, 'Metode': 0, 'Mesin': 0, 'Material': 0 };
let respondentComplaints = {};
let rootCauses = {};

data.forEach((row, idx) => {
  const narasumber = row['Narasumber '] || 'Unknown';
  const faskes = row['Nama Faskes '] || 'Unknown';
  const profileKey = `${narasumber} - ${faskes}`;
  
  if (!respondentComplaints[profileKey]) respondentComplaints[profileKey] = 0;

  questions.forEach(q => {
    const answer = (row[q.col] || '').toString().toLowerCase();
    if (!answer) return;
    
    if (!matrixData[q.key]) matrixData[q.key] = { keluhan: [], verbatims: [], count: 0 };

    let hasNeg = false;
    negativeWords.forEach(nw => {
      if (answer.includes(nw)) {
        hasNeg = true;
        // 4M categorization for all answers (as proxy for G8 if G8 is empty)
        if (answer.includes('sdm') || answer.includes('dokter') || answer.includes('perawat') || answer.includes('personil')) m4Data['Manusia']++;
        if (answer.includes('sop') || answer.includes('rujuk') || answer.includes('aturan') || answer.includes('klaim') || answer.includes('administrasi') || answer.includes('biaya') || answer.includes('kapitasi')) m4Data['Metode']++;
        if (answer.includes('p-care') || answer.includes('sistem') || answer.includes('it') || answer.includes('error') || answer.includes('aplikasi') || answer.includes('jaringan')) m4Data['Mesin']++;
        if (answer.includes('obat') || answer.includes('alat') || answer.includes('sarana') || answer.includes('formularium') || answer.includes('fasilitas')) m4Data['Material']++;
      }
    });

    if (hasNeg) {
      matrixData[q.key].count++;
      matrixData[q.key].verbatims.push(`"${row[q.col]}"`);
      respondentComplaints[profileKey]++;
      
      // root causes extraction (simple word frequency on negative sentences)
      const words = answer.split(' ');
      words.forEach(w => {
        if(w.length > 4 && !['untuk', 'tidak', 'dengan', 'yang', 'dari', 'pada', 'dalam', 'karena', 'sudah'].includes(w)) {
           rootCauses[w] = (rootCauses[w] || 0) + 1;
        }
      });
    }
  });
});

console.log(JSON.stringify({matrixData, m4Data, respondentComplaints, rootCauses}, null, 2));
