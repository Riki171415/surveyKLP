// Google Apps Script untuk menerima data dari Web App (Vite React)
// Cara Penggunaan:
// 1. Buka Google Sheet Anda (https://docs.google.com/spreadsheets/d/1eLMsvluPTqXDqVBicIxXiZtjDyxZ5KAaIrTAMftXQBM/edit?gid=0#gid=0)
// 2. Klik Ekstensi -> Apps Script
// 3. Paste kode ini, simpan.
// 4. Klik Terapkan (Deploy) -> Deployment Baru -> Pilih Jenis: Aplikasi Web
// 5. Akses: "Siapa Saja" (Anyone)
// 6. Salin URL Web App yang dihasilkan, lalu paste ke dalam `src/components/SurveyForm.jsx` di bagian `SCRIPT_URL`.

const SHEET_NAME = 'Sheet1'; // Sesuaikan dengan nama sheet Anda

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);
    
    // Jika belum ada header, buat header (bisa disesuaikan dengan kebutuhan)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Nama FKTP', 'Kabupaten/Kota', 'Jabatan', 
        'Dokter Umum', 'Dokter Gigi', 'Dokter Sp.KKLP',
        'Waktu Poli (mnt)', 'Waktu Home Visit (mnt)', 'Proporsi Dalam (%)', 'Proporsi Luar (%)',
        'Data Kompetensi JSON', 'Data JKN JSON', 'Data Layanan Belum Optimal JSON'
      ]);
    }
    
    // Tambah baris data baru
    sheet.appendRow([
      new Date(),
      data.fktpName,
      data.city,
      data.role,
      data.docUmum ? 'Ada' : 'Tidak Ada',
      data.docGigi ? 'Ada' : 'Tidak Ada',
      data.docKklp ? 'Ada' : 'Tidak Ada',
      data.timeInPoli,
      data.timeHomeVisit,
      data.propInFktp,
      data.propOutFktp,
      JSON.stringify(data.kompetensi),
      JSON.stringify(data.jkn),
      JSON.stringify(data.nonOptimal)
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
