import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Sparkles, Copy, Key, ChevronRight, Check, Download, Save } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function GenerateReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSurveys();
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
      if (useSupabase) {
        const { data, error } = await supabase.from('ai_reports').select('content').eq('id', 'main_report').single();
        if (data && data.content) {
          setReport(data.content);
        }
      } else {
        const response = await fetch('/api/ai-reports/main_report');
        const json = await response.json();
        if (json.data && json.data.content) {
          setReport(json.data.content);
        }
      }
    } catch (err) {
      console.log('No existing report found or error loading:', err.message);
    }
  };

  const saveReport = async (content) => {
    try {
      const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
      if (useSupabase) {
        await supabase.from('ai_reports').upsert({ id: 'main_report', content });
      } else {
        await fetch('/api/ai-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'main_report', content })
        });
      }
    } catch (err) {
      console.error('Failed to save report:', err.message);
    }
  };

  const fetchSurveys = async () => {
    try {
      setFetching(true);
      const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
      let surveysData = [];
      if (useSupabase) {
        // Fetch only those with wawancara data to save token
        const { data, error } = await supabase.from('surveys').select('*').not('wawancara', 'is', null);
        if (error) throw error;
        surveysData = data || [];
      } else {
        const response = await fetch('/api/surveys');
        const json = await response.json();
        if (json.error) throw json.error;
        surveysData = (json.data || []).filter(s => s.wawancara);
      }
      setSurveys(surveysData);
    } catch (err) {
      setError('Gagal memuat data survey: ' + err.message);
    } finally {
      setFetching(false);
    }
  };


  const constructPromptAndData = () => {
    // Format the interview data to be compact
    const formattedData = surveys.map(s => {
      let dataString = `Faskes: ${s.fktp_name || '-'}\n`;
      if (s.wawancara && Array.isArray(s.wawancara)) {
        s.wawancara.forEach((ans, i) => {
          if (ans && ans.trim() !== '') {
            dataString += `Q${i+1}: ${ans}\n`;
          }
        });
      }
      return dataString;
    }).join('\n---\n');

    const prompt = `Bertindaklah sebagai Ahli Analis Kebijakan Kesehatan Masyarakat dan Peneliti Layanan Kesehatan Primer. Saya memiliki data hasil wawancara/survei terkait "Optimalisasi Program JKN di Fasilitas Kesehatan Tingkat Pertama (FKTP) dalam Rangka Transformasi Layanan Primer", yang berfokus pada peran dan dampak dokter Spesialis Kedokteran Keluarga Layanan Primer (Sp.KKLP).

Tolong analisis seluruh data kualitatif responden di bawah ini dan buatkan sebuah Laporan Analisis yang komprehensif, profesional, dan berorientasi pada kebijakan (policy-oriented). 

Gunakan struktur laporan berikut ini:
1. Ringkasan Eksekutif (Executive Summary)
2. Pendahuluan
3. Temuan Utama (Analisis tematik berdasarkan pertanyaan survei)
4. Kesimpulan & Sintesis
5. Rekomendasi Pembiayaan dan Kebijakan

Instruksi Tambahan:
- Gunakan bahasa Indonesia yang formal, objektif, dan akademis.
- Gunakan format Markdown (bold, list, dsb) dengan rapi.
- Jangan hanya merangkum jawaban "ya" atau "tidak", tetapi gali alasan "mengapa".

Data Wawancara Responden:
${formattedData}`;

    return prompt;
  };

  const handleGenerate = async () => {
    const keyToUse = import.meta.env.VITE_GEMINI_API_KEY;
    if (!keyToUse) {
      alert('VITE_GEMINI_API_KEY tidak ditemukan di file .env');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setReport('');
      
      const prompt = constructPromptAndData();
      const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-pro';

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToUse}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        setReport(generatedText);
        await saveReport(generatedText);
      } else {
        throw new Error('Tidak ada respon yang dihasilkan dari AI.');
      }
    } catch (err) {
      setError('Gagal meng-generate laporan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyPromptToClipboard = () => {
    const prompt = constructPromptAndData();
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToWord = () => {
    if (!report) return;
    
    // Basic markdown to HTML conversion for Word Document
    const htmlContent = report
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/# (.*)/g, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n- (.*)/g, '<br/>&bull; $1');

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Laporan AI</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Laporan_Analisis_AI_${new Date().toISOString().split('T')[0]}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-screen">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-600" />
            Generate Laporan AI
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gunakan kekuatan AI untuk menganalisis data wawancara secara otomatis.
          </p>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">

        {/* Data Status Section */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Status Data Survei</h3>
            {fetching ? (
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Memuat data dari database...
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Ditemukan <span className="font-bold text-primary-600">{surveys.length}</span> responden dengan data wawancara.
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={copyPromptToClipboard}
              disabled={fetching || surveys.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Copy Prompt Manual'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || fetching || surveys.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Menganalisis...' : 'Generate Laporan'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Report Display */}
        {report && (
          <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" /> Hasil Analisis AI
              </h3>
              <button
                onClick={exportToWord}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium border border-slate-300"
                title="Download sebagai file Microsoft Word (.doc)"
              >
                <Download className="w-4 h-4" />
                Export Word
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl prose prose-sm max-w-none prose-primary prose-headings:font-bold prose-a:text-primary-600 prose-li:marker:text-primary-500">
              <div dangerouslySetInnerHTML={{ 
                // Basic markdown to HTML conversion since we don't have react-markdown
                __html: report
                  .replace(/## (.*)/g, '<h3>$1</h3>')
                  .replace(/# (.*)/g, '<h2>$1</h2>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n\n/g, '<br/><br/>')
                  .replace(/\n- (.*)/g, '<br/>&bull; $1')
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
