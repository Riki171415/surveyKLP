import React, { useMemo, useState } from 'react';
import ExportButton from '../ExportButton';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Stethoscope, Award, FileSearch, CheckCircle, Activity, HeartPulse, Building, ArrowDownCircle, AlertCircle } from 'lucide-react';

const relevansiItems = [
  "Pengelolaan Multimorbiditas",
  "Home Care Pasien Kronis",
  "Paliatif Primer",
  "Edukasi Kelompok Kronis",
  "Pendampingan Keluarga",
  "Pemantauan Komunitas",
  "Monitoring Risiko Tinggi",
  "Penguatan PRB",
  "Koordinasi Lintas Profesi",
  "Pembinaan Posbindu",
  "Pengelolaan Geriatri"
];

const peranSpkklpItems = [
  "Skrining komprehensif penyakit kronis",
  "Kolaborasi dengan dokter spesialis lain",
  "Optimalisasi rujukan",
  "Pemantauan pengobatan jangka panjang"
];

const layananDirujukItems = [
  "Kasus PTM tanpa komplikasi (DM, Hipertensi)", "Penanganan luka diabetes berat", 
  "Tindakan bedah minor", "Pelayanan paliatif akhir hayat", 
  "Gangguan jiwa ringan-sedang", "Penanganan fraktur tertutup sederhana"
];

const layananBelumBerjalanItems = [
  "Manajemen pasien dengan multimorbiditas kompleks",
  "Home care dengan intervensi medis komprehensif",
  "Pelayanan paliatif primer/komunitas",
  "Family conference atau konsultasi keluarga",
  "Monitoring pasien kronis secara terintegrasi",
  "Deprescribing atau evaluasi penggunaan obat pada pasien polifarmasi",
  "Konseling dan tata laksana pasien geriatri frailty",
  "Edukasi kelompok pasien penyakit kronis (DM, hipertensi, dll.)",
  "Monitoring komunitas risiko tinggi penyakit kronis",
  "Koordinasi lintas profesi dan kader kesehatan",
  "Discharge planning dan tindak lanjut pasien pasca rawat inap",
  "Koordinasi rujuk balik FKRTL–Puskesmas / Klinik"
];

export default function DashboardSpKKLP({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [isExporting, setIsExporting] = useState(false);

  const { 
    docStats, statusData, obatKhususData, relevansiData, dirujukData, 
    topRelevansi, diagData, tindData, analysisText,
    poliData, pembiayaanData, peranData, layananBelumData, rujukanData
  } = useMemo(() => {
    let spkklpYa = 0;
    let spkklpTidak = 0;
    let totalDocUmum = 0;
    let totalDocGigi = 0;

    const statusCounts = {};
    const diagnosisCounts = {};
    const tindakanCounts = {};
    const obatKhususCounts = {};
    const hasPoliCounts = { 'Ya': 0, 'Tidak': 0 };
    const pembiayaanCounts = {};

    const extractTags = (text) => {
      if (!text) return [];
      return text.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 2);
    };

    uniqueFktpData.forEach(row => {
      if (row.doc_kklp === 'Ya') spkklpYa++; else spkklpTidak++;
      
      if (row.spkklp_status) {
        statusCounts[row.spkklp_status] = (statusCounts[row.spkklp_status] || 0) + 1;
      }

      totalDocUmum += Number(row.doc_umum) || 0;
      totalDocGigi += Number(row.doc_gigi) || 0;

      const p = row.spkklp_poli || {};
      if (p.hasPoli) hasPoliCounts[p.hasPoli] = (hasPoliCounts[p.hasPoli] || 0) + 1;
      if (p.hasPoli === 'Ya') {
        if (p.diagnosis) extractTags(p.diagnosis).forEach(t => diagnosisCounts[t] = (diagnosisCounts[t] || 0) + 1);
        if (p.tindakan) extractTags(p.tindakan).forEach(t => tindakanCounts[t] = (tindakanCounts[t] || 0) + 1);
        
        if (p.pembiayaan) {
          const txt = p.pembiayaan.toLowerCase();
          let cat = "Lainnya";
          if (txt.includes('bpjs') || txt.includes('jkn') || txt.includes('kapitasi') || txt.includes('asuransi')) {
            cat = (txt.includes('umum') || txt.includes('mandiri')) ? 'BPJS & Umum' : 'BPJS / JKN';
          } else if (txt.includes('umum') || txt.includes('mandiri') || txt.includes('pribadi')) {
            cat = 'Umum / Mandiri';
          } else if (txt.includes('gratis') || txt.includes('bantuan')) {
            cat = 'Gratis';
          } else {
            cat = p.pembiayaan.length <= 3 ? 'Lainnya' : p.pembiayaan;
          }
          pembiayaanCounts[cat] = (pembiayaanCounts[cat] || 0) + 1;
        }
      }
      if (row.spkklp_obat_khusus) {
        extractTags(row.spkklp_obat_khusus).forEach(t => obatKhususCounts[t] = (obatKhususCounts[t] || 0) + 1);
      }
    });

    const relScores = relevansiItems.map(r => ({ name: r, totalScore: 0, count: 0 }));
    const peranScores = peranSpkklpItems.map(r => ({ name: r, totalScore: 0, count: 0 }));
    const dirujukCounts = {};
    const layananBelumCounts = {};
    const rujukanCounts = {};

    filteredData.forEach(row => {
      const rel = row.relevansi_spkklp || {};
      relevansiItems.forEach((_, idx) => {
        if (rel[idx]) {
          relScores[idx].totalScore += Number(rel[idx]);
          relScores[idx].count++;
        }
      });

      const prn = row.peran_spkklp || {};
      peranSpkklpItems.forEach((_, idx) => {
        if (prn[idx]) {
          peranScores[idx].totalScore += Number(prn[idx]);
          peranScores[idx].count++;
        }
      });

      const rjk = row.layanan_dirujuk || {};
      Object.keys(rjk).forEach(k => {
        if (rjk[k] && k !== 'pengaruhPenurunanRujukan') {
          if (!isNaN(k) && k !== 'lainnya' && !layananDirujukItems[k]) return;
          const name = k === 'lainnya' ? rjk.lainnya : (isNaN(k) ? k : layananDirujukItems[k]);
          dirujukCounts[name] = (dirujukCounts[name] || 0) + 1;
        }
      });

      if (rjk.pengaruhPenurunanRujukan) {
        rujukanCounts[rjk.pengaruhPenurunanRujukan] = (rujukanCounts[rjk.pengaruhPenurunanRujukan] || 0) + 1;
      }

      const belum = row.layanan_belum_berjalan || {};
      Object.keys(belum).forEach(k => {
        if (belum[k]) {
          const name = k === 'lainnya' ? belum.lainnya : (isNaN(k) ? k : layananBelumBerjalanItems[k]);
          layananBelumCounts[name] = (layananBelumCounts[name] || 0) + 1;
        }
      });
    });

    const relData = relScores.map(s => ({
      name: s.name,
      avgScore: s.count > 0 ? Number((s.totalScore / s.count).toFixed(2)) : 0
    })).sort((a,b) => b.avgScore - a.avgScore);

    const peranData = peranScores.map(s => ({
      name: s.name,
      avgScore: s.count > 0 ? Number((s.totalScore / s.count).toFixed(2)) : 0
    })).sort((a,b) => b.avgScore - a.avgScore);

    const rjkData = Object.keys(dirujukCounts).map(k => ({
      name: layananDirujukItems[k] || k,
      value: dirujukCounts[k]
    })).filter(d => isNaN(d.name) && d.name !== 'undefined').sort((a,b) => b.value - a.value).slice(0, 5);

    const belumData = Object.keys(layananBelumCounts).map(k => ({ name: k, value: layananBelumCounts[k] })).sort((a,b) => b.value - a.value).slice(0, 5);

    const diagData = Object.keys(diagnosisCounts).map(k => ({ name: k, value: diagnosisCounts[k] }))
      .sort((a,b) => b.value - a.value).slice(0, 10);

    const tindData = Object.keys(tindakanCounts).map(k => ({ name: k, value: tindakanCounts[k] }))
      .sort((a,b) => b.value - a.value).slice(0, 10);

    const poliData = Object.keys(hasPoliCounts).map(k => ({ name: k, value: hasPoliCounts[k] })).filter(d => d.value > 0);
    const pembiayaanData = Object.keys(pembiayaanCounts).map(k => ({ name: k, value: pembiayaanCounts[k] })).sort((a,b) => b.value - a.value);
    
    const rujukanMap = { '1': 'Sangat Tidak Setuju', '2': 'Tidak Setuju', '3': 'Setuju', '4': 'Sangat Setuju' };
    const rujukanDataMapped = Object.keys(rujukanCounts).map(k => ({ name: rujukanMap[k] || k, value: rujukanCounts[k] })).sort((a,b) => b.value - a.value);

    let analysisText = "Belum ada data diagnosis atau tindakan yang diinput oleh responden.";
    if (diagData.length > 0 && rjkData.length > 0) {
      analysisText = `<span class="text-indigo-700 font-bold">🎯 Analisis Kesenjangan (Gap Analysis) & Rekomendasi:</span><br/><br/>
      Berdasarkan data input terbaru, layanan yang paling sering dirujuk ke FKRTL adalah <span class="font-bold">${rjkData[0]?.name || ''}</span> (${rjkData[0]?.value || 0} FKTP). 
      Namun di sisi lain, relevansi peran Sp.KKLP tertinggi tercatat pada <span class="font-bold">${relData[0]?.name || ''}</span>. <br/><br/>
      <span class="text-indigo-700 font-bold">💡 Insight Strategis:</span><br/>
      Hal ini menunjukkan adanya <span class="font-bold text-rose-600">peluang besar</span> bagi Sp.KKLP untuk memotong mata rantai rujukan pada kasus ${rjkData[0]?.name || ''}. 
      Penguatan fasilitas dan penempatan Sp.KKLP di ${spkklpTidak} FKTP yang saat ini belum memilikinya dapat secara signifikan menurunkan beban rujukan FKRTL dan mengoptimalkan penanganan di tingkat primer.`;
    }

    const statusData = Object.keys(statusCounts).map(k => ({
      name: k,
      value: statusCounts[k]
    })).sort((a,b) => b.value - a.value);

    const obatKhususData = Object.keys(obatKhususCounts).map(k => ({
      name: k,
      value: obatKhususCounts[k]
    })).sort((a,b) => b.value - a.value).slice(0, 5);

    return {
      docStats: { spkklpYa, spkklpTidak, totalDocUmum, totalDocGigi },
      statusData, obatKhususData, relevansiData: relData, dirujukData: rjkData, diagData, tindData, analysisText,
      topRelevansi: relData.slice(0, 3), poliData, pembiayaanData, peranData, layananBelumData: belumData, rujukanData: rujukanDataMapped
    };
  }, [filteredData, uniqueFktpData]);

  const docPieData = [
    { name: 'FKTP Ada Sp.KKLP', value: docStats.spkklpYa },
    { name: 'Tidak Ada Sp.KKLP', value: docStats.spkklpTidak }
  ].filter(d => d.value > 0);

  const exportExcelSpKKLP = async () => {
    try {
      setIsExporting(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dashboard Survey KKLP';
      const sheet = workbook.addWorksheet('Peran SpKKLP');

      sheet.columns = [
        { header: '', key: 'col1', width: 5 },
        { header: '', key: 'col2', width: 40 },
        { header: '', key: 'col3', width: 25 },
        { header: '', key: 'col4', width: 25 },
      ];

      // Header
      sheet.mergeCells('B1:D1');
      sheet.getCell('B1').value = 'DASHBOARD DETAIL PRAKTIK & PERSPEKTIF SP.KKLP';
      sheet.getCell('B1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getCell('B1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

      // Insight Text
      sheet.mergeCells('B3:D3');
      sheet.getCell('B3').value = 'INSIGHT & GAP ANALYSIS';
      sheet.getCell('B3').font = { bold: true };
      
      sheet.mergeCells('B4:D7');
      const cleanText = analysisText.replace(/<[^>]+>/g, '');
      sheet.getCell('B4').value = cleanText;
      sheet.getCell('B4').alignment = { wrapText: true, vertical: 'top' };

      let currentRow = 9;

      // Charts
      const chartIds = [
        { id: 'chart-ketersediaan', title: 'Ketersediaan Dokter Sp.KKLP' },
        { id: 'chart-kualifikasi', title: 'Kualifikasi Sp.KKLP' },
        { id: 'chart-poli', title: 'Detail Praktik: Poli Tersendiri' },
        { id: 'chart-pembiayaan', title: 'Detail Praktik: Pembiayaan' },
        { id: 'chart-dirujuk', title: 'Top 5 Layanan Sering Dirujuk' },
        { id: 'chart-belum-jalan', title: 'Top Layanan Belum Berjalan' },
        { id: 'chart-pengaruh', title: 'Perspektif: Pengaruh Penurunan Rujukan' },
        { id: 'chart-relevansi', title: 'Rata-Rata Skala Relevansi' },
        { id: 'chart-peran', title: 'Peran Sp.KKLP dalam Optimalisasi' },
      ];

      for (const chart of chartIds) {
        const element = document.getElementById(chart.id);
        if (element) {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          const imageId = workbook.addImage({ base64: imgData, extension: 'png' });
          
          sheet.getCell(`B${currentRow}`).value = chart.title;
          sheet.getCell(`B${currentRow}`).font = { bold: true };
          
          sheet.addImage(imageId, {
            tl: { col: 1, row: currentRow },
            ext: { width: 500, height: 320 }
          });
          currentRow += 18;
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Dashboard_SpKKLP_${new Date().getTime()}.xlsx`);

    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-10`}></div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-600')}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print">
          <button 
            onClick={exportExcelSpKKLP} 
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-bold hover:from-indigo-400 hover:to-blue-500 transition shadow-md active:scale-95 disabled:opacity-50 text-sm"
          >
            {isExporting ? 'Menyiapkan Excel...' : 'Download Excel (Detail & Perspektif)'}
          </button>
        </div>
      )}

      {/* Insight Panel */}
      <div className={`bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
        <h3 className="text-xl font-bold text-indigo-900 mb-3 flex items-center">
          <Award className="w-6 h-6 mr-2 text-indigo-600" /> Executive Insight & Gap Analysis
        </h3>
        <p className="text-slate-700 leading-relaxed text-sm md:text-base" dangerouslySetInnerHTML={{ __html: analysisText }}></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="FKTP Memiliki Sp.KKLP" value={docStats.spkklpYa} subtitle={`${filteredData.length > 0 ? Math.round((docStats.spkklpYa/filteredData.length)*100) : 0}% dari total`} icon={Stethoscope} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Top 1 Peran Sp.KKLP" value={topRelevansi[0]?.avgScore || 0} subtitle={topRelevansi[0]?.name || '-'} icon={Award} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Top 2 Peran Sp.KKLP" value={topRelevansi[1]?.avgScore || 0} subtitle={topRelevansi[1]?.name || '-'} icon={CheckCircle} colorClass="bg-teal-500 text-teal-600 bg-teal-100" />
        <StatCard title="Layanan Sering Dirujuk" value={dirujukData[0]?.value || 0} subtitle={dirujukData[0]?.name || '-'} icon={FileSearch} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ketersediaan SpKKLP */}
        <div id="chart-ketersediaan" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-blue-600" /> Ketersediaan Sp.KKLP</h3>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie data={docPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  <Cell fill="#3b82f6" /><Cell fill="#94a3b8" />
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kualifikasi SpKKLP */}
        {statusData && statusData.length > 0 && (
          <div id="chart-kualifikasi" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Award className="w-5 h-5 mr-2 text-violet-600" /> Kualifikasi Sp.KKLP</h3>
            <div className="h-72">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                    {statusData.map((_, i) => <Cell key={i} fill={['#8b5cf6', '#ec4899', '#f97316', '#14b8a6'][i % 4]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Poli Tersendiri */}
        {poliData && poliData.length > 0 && (
          <div id="chart-poli" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Building className="w-5 h-5 mr-2 text-emerald-600" /> Detail Praktik: Poli Tersendiri</h3>
            <div className="h-72">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie data={poliData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                    {poliData.map((_, i) => <Cell key={i} fill={['#10b981', '#64748b'][i % 2]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Pembiayaan */}
        {pembiayaanData && pembiayaanData.length > 0 && (
          <div id="chart-pembiayaan" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-teal-600" /> Detail Praktik: Pembiayaan</h3>
            <div className="h-72">
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={pembiayaanData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Dirujuk */}
        <div id="chart-dirujuk" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><FileSearch className="w-5 h-5 mr-2 text-amber-600" /> Top 5 Layanan Sering Dirujuk ke FKRTL</h3>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={dirujukData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 11 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={32}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Belum Berjalan */}
        <div id="chart-belum-jalan" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-rose-600" /> Perspektif: Layanan Belum Berjalan</h3>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={layananBelumData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fontSize: 11 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="value" fill="#e11d48" radius={[0, 6, 6, 0]} barSize={32}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pengaruh Penurunan Rujukan */}
        <div id="chart-pengaruh" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><ArrowDownCircle className="w-5 h-5 mr-2 text-indigo-600" /> Perspektif: Pengaruh Penurunan Rujukan</h3>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={rujukanData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Relevansi */}
        <div id="chart-relevansi" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Award className="w-5 h-5 mr-2 text-emerald-600" /> Rata-Rata Skala Relevansi (1-4)</h3>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={relevansiData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4]} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="avgScore" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="avgScore" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peran SpKKLP */}
        <div id="chart-peran" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-blue-600" /> Peran Sp.KKLP dalam Optimalisasi (Skala 1-4)</h3>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={peranData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-15} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4]} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="avgScore" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="avgScore" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
