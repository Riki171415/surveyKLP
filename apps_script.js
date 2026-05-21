// Google Apps Script untuk menerima data dari Web App (Vite React)

const SHEET_NAME = 'Sheet1'; // Sesuaikan dengan nama sheet di Google Sheets Anda

// Daftar Pertanyaan untuk Header Kolom
const kompetensiLayanan = [
  "Manajemen pasien dengan multimorbiditas kompleks",
  "Pemeriksaan USG Dasar untuk penegakan diagnosis",
  "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)",
  "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
  "Home Care Klinis dengan intervensi medis komprehensif",
  "Pelayanan Paliatif Primer (manajemen nyeri/akhir hayat) di rumah",
  "Pemeriksaan Xray untuk penegakan diagnosis"
];

const jknBenefits = [
  "Pengelolaan Diabetes Melitus tanpa komplikasi",
  "Penyusunan care plan jangka panjang pasien kronik",
  "Manajemen pasien dengan multimorbiditas (DM + hipertensi + dislipidemia)",
  "Pemantauan kepatuhan terapi pasien kronik (penyakit tidak menular)",
  "Pemantauan kepatuhan terapi pasien AIDS, TB, Malaria",
  "Pelaksanaan Program Rujuk Balik (PRB)",
  "Pengelolaan Hipertensi tanpa komplikasi",
  "Deprescribing/pengurangan obat pada pasien polifarmasi",
  "Homecare pasien kronik stabil",
  "Home care pasien dengan keterbatasan mobilitas",
  "Discharge planning pasca rawat inap",
  "Koordinasi rujuk balik FKRTL-FKTP",
  "Pelayanan paliatif primer di rumah",
  "Intervensi keluarga pada pasien kronik",
  "Pembinaan Posbindu PTM",
  "Edukasi kelompok pasien DM dan hipertensi",
  "Monitoring komunitas risiko tinggi",
  "Koordinasi lintas profesi dan kader kesehatan"
];

const nonOptimalServices = [
  "Home care penyakit kronik terintegrasi",
  "Konsultasi keluarga dan family conference",
  "Pelayanan lifestyle medicine",
  "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine",
  "Pelayanan paliatif komunitas",
  "Manajemen pasien geriatri frailty",
  "Precision medicine/konseling genetik dasar",
  "Monitoring pasien kronik berbasis komunitas",
  "Program edukasi kelompok kronik terstruktur",
  "Telemonitoring pasien kronik",
  "Pelayanan transisi FKRTL-FKTP",
  "Konseling kepatuhan pengobatan jangka panjang",
  "Deprescribing dan medication review",
  "Layanan promotif berbasis keluarga"
];

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);
    
    // 1. BUAT HEADER (SUSUNAN KOLOM) JIKA SHEET MASIH KOSONG
    if (sheet.getLastRow() === 0) {
      let headers = [
        'Timestamp', 'Nama FKTP', 'Kabupaten/Kota', 'Jabatan', 
        'Dokter Umum', 'Dokter Gigi', 'Dokter Sp.KKLP',
        'Waktu Poli (mnt)', 'Waktu Home Visit (mnt)', 'Proporsi Dalam (%)', 'Proporsi Luar (%)'
      ];
      
      // Header untuk Bagian B (Kompetensi) - Status & Kendala
      kompetensiLayanan.forEach((item, idx) => {
        headers.push(`[Komp ${idx+1}] ${item} - Status`);
        headers.push(`[Komp ${idx+1}] ${item} - Kendala`);
      });
      
      // Header untuk Bagian C (JKN) - Skala & Catatan
      jknBenefits.forEach((item, idx) => {
        headers.push(`[JKN ${idx+1}] ${item} - Skala (1-4)`);
        headers.push(`[JKN ${idx+1}] ${item} - Catatan`);
      });
      
      // Header untuk Bagian D (Belum Optimal) - Masuk JKN, Skala & Catatan
      nonOptimalServices.forEach((item, idx) => {
        headers.push(`[NonOpt ${idx+1}] ${item} - Masuk JKN?`);
        headers.push(`[NonOpt ${idx+1}] ${item} - Skala (1-4)`);
        headers.push(`[NonOpt ${idx+1}] ${item} - Catatan`);
      });
      
      sheet.appendRow(headers);
      
      // Format header agar rapi (Bold, Wrap text, Freeze row)
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setWrap(true);
      headerRange.setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
    }
    
    // 2. SIAPKAN DATA ROW UNTUK DISIMPAN
    let rowData = [
      new Date(),
      data.fktpName || '',
      data.city || '',
      data.role || '',
      data.docUmum ? 'Ada' : 'Tidak Ada',
      data.docGigi ? 'Ada' : 'Tidak Ada',
      data.docKklp ? 'Ada' : 'Tidak Ada',
      data.timeInPoli || '',
      data.timeHomeVisit || '',
      data.propInFktp || '',
      data.propOutFktp || ''
    ];
    
    // Data Bagian B
    kompetensiLayanan.forEach((_, idx) => {
      const ans = data.kompetensi && data.kompetensi[idx] ? data.kompetensi[idx] : {};
      rowData.push(ans.status || '');
      rowData.push(ans.kendala || '');
    });
    
    // Data Bagian C
    jknBenefits.forEach((_, idx) => {
      const ans = data.jkn && data.jkn[idx] ? data.jkn[idx] : {};
      rowData.push(ans.skala || '');
      rowData.push(ans.catatan || '');
    });
    
    // Data Bagian D
    nonOptimalServices.forEach((_, idx) => {
      const ans = data.nonOptimal && data.nonOptimal[idx] ? data.nonOptimal[idx] : {};
      rowData.push(ans.masukJkn || '');
      rowData.push(ans.skala || '');
      rowData.push(ans.catatan || '');
    });
    
    // Simpan ke spreadsheet
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi doGet untuk mengembalikan data (JSON) agar bisa dibaca oleh Dashboard
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        // Konversi tipe Date menjadi ISO string agar valid di JSON
        if (row[i] instanceof Date) {
          obj[header] = row[i].toISOString();
        } else {
          obj[header] = row[i];
        }
      });
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
