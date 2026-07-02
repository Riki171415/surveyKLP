import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Loader, RefreshCw, CheckCircle, AlertTriangle, Save, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { callGeminiApiText, saveAiReportToDb, fetchAiReportFromDb } from '../../utils/aiUtils';

/**
 * Mengekspor konten HTML ke file .doc yang bisa dibuka di Microsoft Word.
 */
const exportHTMLToWord = (htmlContent, filename = 'Laporan') => {
  const style = `
    <style>
      body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; margin: 2.5cm; }
      h1 { font-family: 'Times New Roman', Times, serif; font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 4pt; color: #000; border-bottom: 2px solid #000; padding-bottom: 6pt; }
      h2 { font-family: 'Times New Roman', Times, serif; font-size: 13pt; font-weight: bold; color: #000; margin-top: 16pt; margin-bottom: 6pt; }
      h3 { font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; color: #000; margin-top: 12pt; margin-bottom: 4pt; }
      p  { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin-bottom: 8pt; text-align: justify; }
      ul, ol { margin-left: 20pt; margin-bottom: 8pt; font-size: 12pt; }
      li { margin-bottom: 4pt; font-size: 12pt; }
      table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 12pt; }
      th { font-weight: bold; padding: 5pt 8pt; text-align: left; border: 1px solid #000; background-color: #d0d0d0; }
      td { padding: 4pt 8pt; border: 1px solid #000; vertical-align: top; font-size: 12pt; }
      tr:nth-child(even) td { background-color: #f5f5f5; }
      .meta { font-size: 11pt; color: #333; text-align: center; margin-bottom: 12pt; font-style: italic; }
      .highlight { border-left: 4px solid #333; padding: 8pt 12pt; margin: 8pt 0; background-color: #f0f0f0; font-size: 12pt; }
      .warning  { border-left: 4px solid #666; padding: 8pt 12pt; margin: 8pt 0; background-color: #f8f8f8; font-size: 12pt; }
      .footer   { margin-top: 20pt; font-size: 10pt; color: #555; text-align: center; border-top: 1px solid #999; padding-top: 6pt; font-style: italic; }
    </style>
  `;

  const htmlFull = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'>${style}</head>
    <body>${htmlContent}</body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlFull], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Komponen ReportGenerator — tampilkan di bawah setiap dashboard.
 *
 * @param {string} dashboardId   - ID unik untuk penyimpanan di DB (ex: 'profil', 'prb', 'impact_spkklp')
 * @param {string} dashboardName - Nama human-readable untuk judul laporan
 * @param {string} promptContext - Ringkasan data statistik dari parent yang dikirim ke AI
 */
export default function ReportGenerator({ dashboardId, dashboardName, promptContext }) {
  const [reportHtml, setReportHtml] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const previewRef = useRef(null);
  const dbId = `report_${dashboardId}`;

  // Muat laporan tersimpan dari DB saat komponen mount
  useEffect(() => {
    const loadReport = async () => {
      const data = await fetchAiReportFromDb(dbId);
      if (data && typeof data === 'string') {
        setReportHtml(data);
        setIsExpanded(true);
        setSavedAt('tersimpan di database');
      }
    };
    loadReport();
  }, [dbId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus('idle');
    setStatusMsg('');
    try {
      const apiKey = localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setStatus('error');
        setStatusMsg('API Key Gemini belum diatur. Silakan masukkan API Key di salah satu menu dashboard terlebih dahulu.');
        setIsGenerating(false);
        return;
      }

      const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      const prompt = `Kamu adalah seorang analis kesehatan senior yang mahir menulis laporan formal dalam Bahasa Indonesia.
Berdasarkan data berikut dari Dashboard "${dashboardName}" sistem survei Sp.KKLP:

--- DATA ---
${promptContext}
--- AKHIR DATA ---

Tugas kamu: Buatlah sebuah laporan formal yang KOMPREHENSIF, MENDALAM, dan AKADEMIS.
Laporan harus memiliki struktur:
1. Judul Laporan (tag <h1>)
2. Metadata tanggal, sumber (tag <p class="meta">)
3. Bab I - Pendahuluan (<h2>, <p>)
4. Bab II - Temuan Utama (dengan <h3> per sub-temuan, gunakan <ul>/<li> untuk poin penting, gunakan <table> jika ada data perbandingan)
5. Bab III - Analisis dan Interpretasi (<h2>, <p>) — bagian ini harus berisi insight mendalam, termasuk penjelasan mengapa angka tersebut bisa terjadi, implikasinya terhadap kualitas layanan, dan perbandingan antar kelompok.
6. Bab IV - Kesimpulan dan Rekomendasi (<h2>, <p>, gunakan <div class="highlight"> untuk rekomendasi positif dan <div class="warning"> untuk hal yang perlu perhatian)
7. Footer (<div class="footer">) berisi: "Laporan dihasilkan oleh Sistem Survei Sp.KKLP • ${today}"

ATURAN KETAT (WAJIB DIIKUTI):
- Kembalikan HANYA tag HTML murni. JANGAN ada teks di luar tag HTML.
- JANGAN gunakan markdown (\`\`\`, ##, **, dll).
- JANGAN wrap dalam JSON atau objek apapun. Output harus dimulai langsung dengan <h1> dan diakhiri dengan </div>.
- Gunakan gaya formal bahasa Indonesia yang baik.
- Pastikan HTML valid dan bisa langsung di-render di browser.
- Jangan batasi panjang laporan; buat selengkap mungkin.

Output dimulai LANGSUNG dengan: <h1>`;

      const rawText = await callGeminiApiText(prompt, apiKey, null);
      
      // Strip semua kemungkinan wrapper: JSON, markdown code block, leading/trailing whitespace
      let htmlOutput = rawText.trim();
      
      // Coba parse sebagai JSON dulu
      try {
        const parsed = JSON.parse(htmlOutput);
        if (parsed && parsed.html) {
          htmlOutput = parsed.html;
        }
      } catch (e) {
        // Bukan JSON — coba strip markdown code block
        htmlOutput = htmlOutput
          .replace(/^```html\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '');
        
        // Jika masih ada JSON-like string di awal, strip-nya
        if (htmlOutput.startsWith('{') && htmlOutput.includes('"html"')) {
          const match = htmlOutput.match(/"html"\s*:\s*"([\s\S]*)"\s*}\s*$/);
          if (match) {
            htmlOutput = match[1]
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          }
        }
      }
      
      htmlOutput = htmlOutput.trim();

      // Inject style Times New Roman ke dalam HTML output
      const styleInject = `<style>
        * { font-family: 'Times New Roman', Times, serif !important; font-size: 12pt; }
        h1 { font-size: 14pt !important; font-weight: bold; text-align: center; border-bottom: 2px solid #000; padding-bottom: 6pt; margin-bottom: 8pt; }
        h2 { font-size: 13pt !important; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; }
        h3 { font-size: 12pt !important; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; }
        p, li, td, th { font-size: 12pt !important; line-height: 1.8; }
        p { text-align: justify; margin-bottom: 8pt; }
        table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
        th { border: 1px solid #000; padding: 5pt 8pt; background: #e0e0e0; font-weight: bold; }
        td { border: 1px solid #000; padding: 4pt 8pt; }
        .meta { font-style: italic; color: #444; text-align: center; margin-bottom: 12pt; }
        .highlight { border-left: 4px solid #555; padding: 6pt 12pt; background: #f0f0f0; margin: 8pt 0; }
        .warning  { border-left: 4px solid #888; padding: 6pt 12pt; background: #f8f8f8; margin: 8pt 0; }
        .footer   { border-top: 1px solid #999; padding-top: 6pt; margin-top: 20pt; font-size: 10pt !important; color: #666; text-align: center; font-style: italic; }
      </style>`;

      const finalHtml = styleInject + htmlOutput.trim();

      setReportHtml(finalHtml);
      setIsExpanded(true);
      setStatus('success');
      setStatusMsg('Laporan berhasil di-generate!');

      // Auto-save ke DB
      setIsSaving(true);
      await saveAiReportToDb(dbId, htmlOutput);
      setSavedAt(today);
      setIsSaving(false);

    } catch (err) {
      setStatus('error');
      setStatusMsg(`Gagal generate laporan: ${err.message}`);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportWord = () => {
    if (!reportHtml) return;
    exportHTMLToWord(reportHtml, `Laporan_${dashboardName.replace(/\s+/g, '_')}`);
  };

  const handleManualSave = async () => {
    if (!reportHtml) return;
    setIsSaving(true);
    await saveAiReportToDb(dbId, reportHtml);
    setSavedAt(new Date().toLocaleDateString('id-ID'));
    setIsSaving(false);
    setStatus('success');
    setStatusMsg('Laporan berhasil disimpan ke database!');
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 shadow-lg overflow-hidden bg-white">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Generator Laporan Formal</h3>
            <p className="text-slate-300 text-xs mt-0.5">
              Buat laporan Word berbasis AI untuk dashboard <span className="font-semibold text-white">{dashboardName}</span>
              {savedAt && <span className="ml-2 text-emerald-400">· {isSaving ? 'Menyimpan...' : `Tersimpan: ${savedAt}`}</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl shadow hover:from-indigo-400 hover:to-violet-500 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating
              ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
              : reportHtml
                ? <><RefreshCw className="w-4 h-4" /> Regenerate</>
                : <><Cpu className="w-4 h-4" /> Generate Laporan AI</>
            }
          </button>
          {reportHtml && (
            <>
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow hover:bg-emerald-500 transition active:scale-95 disabled:opacity-60"
                title="Simpan ke Database"
              >
                {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button
                onClick={handleExportWord}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold rounded-xl shadow hover:from-sky-400 hover:to-blue-500 transition active:scale-95"
              >
                <Download className="w-4 h-4" /> Export Word (.doc)
              </button>
              <button
                onClick={() => setIsExpanded(v => !v)}
                className="flex items-center gap-1 px-3 py-2 bg-white/10 text-white text-sm rounded-xl hover:bg-white/20 transition"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {status !== 'idle' && (
        <div className={`px-6 py-2 text-sm flex items-center gap-2 ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border-t border-emerald-100' : 'bg-red-50 text-red-700 border-t border-red-100'}`}>
          {status === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {statusMsg}
        </div>
      )}

      {/* Generating spinner area */}
      {isGenerating && (
        <div className="px-6 py-10 flex flex-col items-center gap-3 text-slate-500 bg-slate-50">
          <Loader className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Gemini AI sedang menyusun laporan formal...</p>
          <p className="text-xs text-slate-400">Proses ini membutuhkan 15–30 detik. Harap tunggu.</p>
        </div>
      )}

      {/* Preview Area — A4-like paper */}
      {!isGenerating && reportHtml && isExpanded && (
        <div className="bg-slate-100 p-6 overflow-auto max-h-[900px]">
          <div
            ref={previewRef}
            className="bg-white mx-auto shadow-xl rounded-sm"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '25mm 20mm',
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '12pt',
              lineHeight: '1.8',
              color: '#000',
              boxSizing: 'border-box',
            }}
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        </div>
      )}

      {/* Empty state */}
      {!isGenerating && !reportHtml && (
        <div className="px-6 py-10 flex flex-col items-center gap-3 text-slate-400 bg-slate-50 border-t border-slate-100">
          <FileText className="w-12 h-12 text-slate-200" />
          <p className="text-sm font-medium text-slate-500">Belum ada laporan yang di-generate.</p>
          <p className="text-xs text-center">Klik tombol <strong>Generate Laporan AI</strong> di atas untuk membuat laporan formal otomatis berdasarkan data dashboard ini.</p>
        </div>
      )}
    </div>
  );
}
