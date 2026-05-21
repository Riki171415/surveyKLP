// Google Apps Script untuk Aplikasi Survey KKLP (Dengan RBAC)
// PASTI KAN NAMA SHEET DI SPREADSHEET ANDA SESUAI DENGAN VARIABEL DI BAWAH:
const SHEET_SURVEY = 'Sheet1'; 
const SHEET_USERS = 'Users';   // Pastikan nama tab sheet "Users"
const SHEET_FASKES = 'Faskes'; // Pastikan nama tab sheet "Faskes"

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
  "Pengelolaan Diabetes Melitus tanpa komplikasi", "Penyusunan care plan jangka panjang pasien kronik",
  "Manajemen pasien dengan multimorbiditas (DM + hipertensi + dislipidemia)", "Pemantauan kepatuhan terapi pasien kronik (penyakit tidak menular)",
  "Pemantauan kepatuhan terapi pasien AIDS, TB, Malaria", "Pelaksanaan Program Rujuk Balik (PRB)",
  "Pengelolaan Hipertensi tanpa komplikasi", "Deprescribing/pengurangan obat pada pasien polifarmasi",
  "Homecare pasien kronik stabil", "Home care pasien dengan keterbatasan mobilitas",
  "Discharge planning pasca rawat inap", "Koordinasi rujuk balik FKRTL-FKTP",
  "Pelayanan paliatif primer di rumah", "Intervensi keluarga pada pasien kronik",
  "Pembinaan Posbindu PTM", "Edukasi kelompok pasien DM dan hipertensi",
  "Monitoring komunitas risiko tinggi", "Koordinasi lintas profesi dan kader kesehatan"
];

const nonOptimalServices = [
  "Home care penyakit kronik terintegrasi", "Konsultasi keluarga dan family conference",
  "Pelayanan lifestyle medicine", "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine", "Pelayanan paliatif komunitas",
  "Manajemen pasien geriatri frailty", "Precision medicine/konseling genetik dasar",
  "Monitoring pasien kronik berbasis komunitas", "Program edukasi kelompok kronik terstruktur",
  "Telemonitoring pasien kronik", "Pelayanan transisi FKRTL-FKTP",
  "Konseling kepatuhan pengobatan jangka panjang", "Deprescribing dan medication review",
  "Layanan promotif berbasis keluarga"
];

const interviewQuestions = [
  "[W1] Pendapat terkait layanan penyakit kronik (kapitasi)",
  "[W2] Implementasi home visit/care (manfaat non-kapitasi)",
  "[W3] Implementasi komunitas/edukasi kelompok",
  "[W4] Paliatif primer masuk manfaat JKN?",
  "[W5] Keterlibatan Sp.KKLP dalam PRB",
  "[W6] Perubahan faskes dengan adanya Sp.KKLP",
  "[W7] Apakah Sp.KKLP perlu insentif tambahan?"
];

function setupSurveyHeaders(sheet) {
  let headers = [
    'Timestamp', 'Nama FKTP', 'Kabupaten/Kota', 'Jabatan', 
    'Dokter Umum', 'Dokter Gigi', 'Dokter Sp.KKLP',
    'Waktu Poli (mnt)', 'Waktu Home Visit (mnt)', 'Proporsi Dalam (%)', 'Proporsi Luar (%)'
  ];
  kompetensiLayanan.forEach((item, idx) => {
    headers.push(`[Komp ${idx+1}] ${item} - Status`);
    headers.push(`[Komp ${idx+1}] ${item} - Kendala`);
  });
  jknBenefits.forEach((item, idx) => {
    headers.push(`[JKN ${idx+1}] ${item} - Skala (1-4)`);
    headers.push(`[JKN ${idx+1}] ${item} - Catatan`);
  });
  nonOptimalServices.forEach((item, idx) => {
    headers.push(`[NonOpt ${idx+1}] ${item} - Masuk JKN?`);
    headers.push(`[NonOpt ${idx+1}] ${item} - Skala (1-4)`);
    headers.push(`[NonOpt ${idx+1}] ${item} - Catatan`);
  });
  // Tambah header untuk Wawancara
  interviewQuestions.forEach(q => headers.push(q));
  
  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold").setWrap(true).setBackground("#f3f4f6");
  sheet.setFrozenRows(1);
}

// ----------------- HANDLE GET (READ) -----------------
function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'login') {
      const user = e.parameter.username;
      const pass = e.parameter.password;
      const sheet = ss.getSheetByName(SHEET_USERS);
      if (!sheet) return JSONResponse({ error: "Sheet Users tidak ditemukan" });
      
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        // [0] No, [1] Username, [2] Password, [3] Role
        if (data[i][1] == user && data[i][2] == pass) {
          return JSONResponse({ success: true, role: data[i][3], username: user });
        }
      }
      return JSONResponse({ success: false, error: "Username atau Password salah" });
    }

    if (action === 'getSurveys') {
      const sheet = ss.getSheetByName(SHEET_SURVEY);
      if (!sheet || sheet.getLastRow() <= 1) return JSONResponse([]);
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const result = data.slice(1).map((row, index) => {
        let obj = { _rowIndex: index + 2 }; // Simpan nomor baris asli untuk operasi Update
        headers.forEach((h, i) => {
          obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i];
        });
        return obj;
      });
      return JSONResponse(result);
    }
    
    if (action === 'getFaskes') {
      const sheet = ss.getSheetByName(SHEET_FASKES);
      if (!sheet || sheet.getLastRow() <= 1) return JSONResponse([]);
      const data = sheet.getDataRange().getValues();
      // Asumsi kolom: [0] No, [1] Nama Puskesmas, [2] Kode
      const result = data.slice(1).map(r => ({ nama: r[1], kode: r[2] }));
      return JSONResponse(result);
    }
    
    // Default fallback (seperti sebelumnya untuk Dashboard)
    const sheet = ss.getSheetByName(SHEET_SURVEY);
    if (!sheet || sheet.getLastRow() <= 1) return JSONResponse([]);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const result = data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i]);
      return obj;
    });
    return JSONResponse(result);

  } catch (error) {
    return JSONResponse({ error: error.toString() });
  }
}

// ----------------- HANDLE POST (WRITE) -----------------
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'submitSurvey'; // backward compatibility
    const data = payload.data || payload;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'submitSurvey') {
      const sheet = ss.getSheetByName(SHEET_SURVEY);
      if (sheet.getLastRow() === 0) setupSurveyHeaders(sheet);
      
      let rowData = buildSurveyRow(data);
      // Tambah kolom kosong untuk 7 pertanyaan wawancara (karena baru disubmit puskesmas)
      interviewQuestions.forEach(() => rowData.push(''));
      
      sheet.appendRow(rowData);
      return JSONResponse({ status: 'success' });
    }

    if (action === 'updateSurveyWawancara') {
      const sheet = ss.getSheetByName(SHEET_SURVEY);
      const rowIndex = data._rowIndex; // Harus ada!
      
      let rowData = buildSurveyRow(data);
      // Tambah kolom wawancara dari payload
      interviewQuestions.forEach((q, idx) => {
        rowData.push(data.wawancara && data.wawancara[idx] ? data.wawancara[idx] : '');
      });

      // Update baris tersebut
      const range = sheet.getRange(rowIndex, 1, 1, rowData.length);
      range.setValues([rowData]);
      
      return JSONResponse({ status: 'success' });
    }

    return JSONResponse({ error: "Action tidak dikenal" });
  } catch (error) {
    return JSONResponse({ status: 'error', message: error.toString() });
  }
}

// Helper untuk format response
function JSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// Helper untuk menyusun array kolom dari object JSON Frontend
function buildSurveyRow(data) {
  let rowData = [
    data.Timestamp ? new Date(data.Timestamp) : new Date(),
    data.fktpName || '', data.city || '', data.role || '',
    data.docUmum ? 'Ada' : 'Tidak Ada', data.docGigi ? 'Ada' : 'Tidak Ada', data.docKklp ? 'Ada' : 'Tidak Ada',
    data.timeInPoli || '', data.timeHomeVisit || '', data.propInFktp || '', data.propOutFktp || ''
  ];
  
  kompetensiLayanan.forEach((_, idx) => {
    const ans = data.kompetensi?.[idx] || {};
    rowData.push(ans.status || ''); rowData.push(ans.kendala || '');
  });
  jknBenefits.forEach((_, idx) => {
    const ans = data.jkn?.[idx] || {};
    rowData.push(ans.skala || ''); rowData.push(ans.catatan || '');
  });
  nonOptimalServices.forEach((_, idx) => {
    const ans = data.nonOptimal?.[idx] || {};
    rowData.push(ans.masukJkn || ''); rowData.push(ans.skala || ''); rowData.push(ans.catatan || '');
  });
  return rowData;
}
