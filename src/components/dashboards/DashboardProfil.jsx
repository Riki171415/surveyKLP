import React, { useMemo, useState } from 'react';
import wilayahMapping from '../../data/wilayahMapping.json';
import ExportButton from '../ExportButton';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { Users, Stethoscope, Building, Map, ChevronDown, ChevronUp, CheckCircle, XCircle, Download } from 'lucide-react';

export const normalizeStr = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
export const normalizeProv = (p) => p ? p.toLowerCase().replace(/[^a-z0-9]/g, '') : 'lainnya';

// Precompute reverse lookup map once
export const faskesToKabMap = {};
if (wilayahMapping.fktp) {
  for (const prov in wilayahMapping.fktp) {
    for (const kab in wilayahMapping.fktp[prov]) {
      wilayahMapping.fktp[prov][kab].forEach(faskes => {
        faskesToKabMap[normalizeStr(faskes)] = { prov, kab, type: 'FKTP/Klinik' };
      });
    }
  }
}
if (wilayahMapping.dpm) {
  for (const prov in wilayahMapping.dpm) {
    for (const kab in wilayahMapping.dpm[prov]) {
      wilayahMapping.dpm[prov][kab].forEach(faskes => {
        faskesToKabMap[normalizeStr(faskes)] = { prov, kab, type: 'DPM' };
      });
    }
  }
}

export default function DashboardProfil({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [expandedProv, setExpandedProv] = useState(null);
  const [expandedKab, setExpandedKab] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const totalResponden = filteredData.length;
  const totalFktp = uniqueFktpData.length;

  const { roleChartData, spkklpCount, fktpTypeData, uniqueFktpTypeData, regionalData, partisipasiData } = useMemo(() => {
    const roleCount = {}; 
    const fktpTypeCount = { 'Puskesmas': 0, 'Klinik': 0, 'Dokter Praktik Mandiri': 0 };
    const regionalCount = {};
    let spkklpCount = 0;

    filteredData.forEach((row, index) => {
      const role = row.role || 'Lainnya'; 
      roleCount[role] = (roleCount[role] || 0) + 1;
      
      const fName = (row.fktp_name || '').toLowerCase();
      let type = row.jenis_faskes;
      if (type !== 'Puskesmas' && type !== 'Klinik' && type !== 'Dokter Praktik Mandiri') {
        if (role === 'Dokter Praktik Mandiri') type = 'Dokter Praktik Mandiri';
        else if (fName.includes('puskesmas') || fName.includes('pkm') || fName.includes('puseksmas') || fName.includes('puskes')) type = 'Puskesmas';
        else type = 'Klinik';
      }
      fktpTypeCount[type]++;

      const prov = row.provinsi || 'Lainnya';
      regionalCount[prov] = (regionalCount[prov] || 0) + 1;
    });

    const uniqueFktpTypeCount = { 'Puskesmas': 0, 'Klinik': 0, 'Dokter Praktik Mandiri': 0 };
    uniqueFktpData.forEach((row) => {
      const stKklp = row.doc_kklp || 'Tidak';
      if (stKklp === 'Ya') spkklpCount++;

      const fName = (row.fktp_name || '').toLowerCase();
      let type = row.jenis_faskes;
      if (type !== 'Puskesmas' && type !== 'Klinik' && type !== 'Dokter Praktik Mandiri') {
        if (row.role === 'Dokter Praktik Mandiri') type = 'Dokter Praktik Mandiri';
        else if (fName.includes('puskesmas') || fName.includes('pkm') || fName.includes('puseksmas') || fName.includes('puskes')) type = 'Puskesmas';
        else type = 'Klinik';
      }
      uniqueFktpTypeCount[type]++;
    });

    const regionalTargetNormalized = {};
    const originalProvNames = {};
    const kabKotaTargetNormalized = {};
    const originalKabNames = {};

    if (wilayahMapping.fktp) {
      Object.keys(wilayahMapping.fktp).forEach(prov => {
        let count = 0;
        const normProv = normalizeProv(prov);
        regionalTargetNormalized[normProv] = regionalTargetNormalized[normProv] || 0;
        kabKotaTargetNormalized[normProv] = kabKotaTargetNormalized[normProv] || {};
        originalProvNames[normProv] = prov;
        originalKabNames[normProv] = originalKabNames[normProv] || {};

        Object.keys(wilayahMapping.fktp[prov]).forEach(kab => {
          const arr = wilayahMapping.fktp[prov][kab];
          const c = arr.length;
          count += c;
          const normKab = normalizeProv(kab);
          kabKotaTargetNormalized[normProv][normKab] = (kabKotaTargetNormalized[normProv][normKab] || 0) + c;
          originalKabNames[normProv][normKab] = kab;
        });
        regionalTargetNormalized[normProv] += count;
      });
    }
    
    if (wilayahMapping.dpm) {
      Object.keys(wilayahMapping.dpm).forEach(prov => {
        let count = 0;
        const normProv = normalizeProv(prov);
        regionalTargetNormalized[normProv] = regionalTargetNormalized[normProv] || 0;
        kabKotaTargetNormalized[normProv] = kabKotaTargetNormalized[normProv] || {};
        if (!originalProvNames[normProv]) originalProvNames[normProv] = prov;
        originalKabNames[normProv] = originalKabNames[normProv] || {};

        Object.keys(wilayahMapping.dpm[prov]).forEach(kab => {
          const arr = wilayahMapping.dpm[prov][kab];
          const c = arr.length;
          count += c;
          const normKab = normalizeProv(kab);
          kabKotaTargetNormalized[normProv][normKab] = (kabKotaTargetNormalized[normProv][normKab] || 0) + c;
          if (!originalKabNames[normProv][normKab]) originalKabNames[normProv][normKab] = kab;
        });
        regionalTargetNormalized[normProv] += count;
      });
    }

    const uniqueRegionalCountNormalized = {};
    const uniqueKabKotaCountNormalized = {};
    
    // Group uniqueFktpData by originalProv and originalKab for faster drill-down mapping
    const groupedFktpData = {};

    uniqueFktpData.forEach(row => {
      let prov = row.provinsi || 'Lainnya';
      let kab = row.kab_kota || row.city || 'Lainnya';
      const nf = normalizeStr(row.fktp_name);
      
      // REVERSE LOOKUP: Force official Province and Kab/Kota if Faskes matches
      const officialRegion = faskesToKabMap[nf];
      if (officialRegion) {
         prov = officialRegion.prov;
         kab = officialRegion.kab;
      } else {
         const cleanProv = (p) => {
            if (!p) return '';
            const lower = p.toLowerCase();
            if (lower.includes('kepri') || lower.includes('kepulauan riau')) return 'kepulauanriau';
            if (lower.includes('diy') || lower.includes('yogyakarta')) return 'diyogyakarta';
            if (lower.includes('dki') || lower.includes('jakarta')) return 'dkijakarta';
            return lower.replace(/provinsi|prov\.|prov /g, '').replace(/[^a-z0-9]/g, '');
         };
         const cleanKab = (k) => {
            if (!k) return '';
            return k.toLowerCase().replace(/kabupaten|kab\.|kab |kota administrasi|kota /g, '').replace(/[^a-z0-9]/g, '');
         };
         
         const cProv = cleanProv(prov);
         const cKab = cleanKab(kab);
         
         let matchedProv = Object.keys(wilayahMapping.fktp || {}).find(p => {
            const pC = cleanProv(p);
            return pC === cProv || pC.includes(cProv) || cProv.includes(pC);
         });
         
         if (matchedProv) {
            prov = matchedProv;
            let matchedKab = Object.keys(wilayahMapping.fktp[matchedProv] || {}).find(k => {
               const kC = cleanKab(k);
               return kC === cKab || kC.includes(cKab) || cKab.includes(kC);
            });
            if (matchedKab) kab = matchedKab;
         }
      }
      
      if (!groupedFktpData[prov]) groupedFktpData[prov] = {};
      if (!groupedFktpData[prov][kab]) groupedFktpData[prov][kab] = [];
      groupedFktpData[prov][kab].push({ name: row.fktp_name, nf });

      const normProv = prov !== 'Lainnya' ? normalizeProv(prov) : prov;
      uniqueRegionalCountNormalized[normProv] = (uniqueRegionalCountNormalized[normProv] || 0) + 1;
      
      const normKab = kab !== 'Lainnya' ? normalizeProv(kab) : kab;
      
      uniqueKabKotaCountNormalized[normProv] = uniqueKabKotaCountNormalized[normProv] || {};
      uniqueKabKotaCountNormalized[normProv][normKab] = (uniqueKabKotaCountNormalized[normProv][normKab] || 0) + 1;

      originalKabNames[normProv] = originalKabNames[normProv] || {};
      if (!originalKabNames[normProv][normKab]) originalKabNames[normProv][normKab] = kab;
    });

    const partisipasiData = Object.keys(originalProvNames).map(normProv => {
      const target = regionalTargetNormalized[normProv] || 0;
      const capaian = uniqueRegionalCountNormalized[normProv] || 0;
      if (target === 0 && capaian === 0) return null;
      const persentase = target > 0 ? (capaian / target) * 100 : (capaian > 0 ? 100 : 0);

      const originalProv = originalProvNames[normProv];

      const kabKotaList = Object.keys(originalKabNames[normProv] || {}).map(normKab => {
        const kTarget = kabKotaTargetNormalized[normProv]?.[normKab] || 0;
        const kCapaian = uniqueKabKotaCountNormalized[normProv]?.[normKab] || 0;
        if (kTarget === 0 && kCapaian === 0) return null;
        
        const originalKab = originalKabNames[normProv][normKab];
        
        // Build Target list for this kab
        const faskesListMap = {}; // name -> { name, type, target, capaian }
        
        if (wilayahMapping.fktp[originalProv] && wilayahMapping.fktp[originalProv][originalKab]) {
           wilayahMapping.fktp[originalProv][originalKab].forEach(f => {
              faskesListMap[normalizeStr(f)] = { name: f, type: 'FKTP/Klinik', target: 1, capaian: 0 };
           });
        }
        if (wilayahMapping.dpm[originalProv] && wilayahMapping.dpm[originalProv][originalKab]) {
           wilayahMapping.dpm[originalProv][originalKab].forEach(f => {
              faskesListMap[normalizeStr(f)] = { name: f, type: 'DPM', target: 1, capaian: 0 };
           });
        }

        const respondentsInKab = groupedFktpData[originalProv]?.[originalKab] || [];
        respondentsInKab.forEach(r => {
           if (faskesListMap[r.nf]) {
              faskesListMap[r.nf].capaian = 1;
           } else {
              faskesListMap[r.nf] = { name: r.name || 'Lainnya', type: 'Unmapped', target: 0, capaian: 1 };
           }
        });
        
        const faskesList = Object.values(faskesListMap).sort((a,b) => {
           if (b.capaian !== a.capaian) return b.capaian - a.capaian;
           return a.name.localeCompare(b.name);
        });

        const kPersentase = kTarget > 0 ? (kCapaian / kTarget) * 100 : (kCapaian > 0 ? 100 : 0);
        return {
          kabKota: originalKab,
          target: kTarget,
          capaian: kCapaian,
          persentase: kPersentase,
          faskesList
        };
      }).filter(Boolean).sort((a, b) => b.capaian - a.capaian);

      return { provinsi: originalProvNames[normProv], target, capaian, persentase, kabKotaList };
    }).filter(Boolean).sort((a, b) => b.capaian - a.capaian);

    return {
      roleChartData: Object.keys(roleCount).map(key => ({ name: key, value: roleCount[key] })).sort((a,b) => b.value - a.value),
      spkklpCount,
      fktpTypeData: Object.keys(fktpTypeCount).filter(k => fktpTypeCount[k] > 0).map(key => ({ name: key, value: fktpTypeCount[key] })),
      uniqueFktpTypeData: Object.keys(uniqueFktpTypeCount).filter(k => uniqueFktpTypeCount[k] > 0).map(key => ({ name: key, value: uniqueFktpTypeCount[key] })),
      regionalData: Object.keys(regionalCount).map(key => ({ name: key, value: regionalCount[key] })).sort((a,b) => b.value - a.value).slice(0, 10),
      partisipasiData
    };
  }, [filteredData, uniqueFktpData]);

  const exportNativeExcel = async () => {
    try {
      setIsExporting(true);
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dashboard Survey KKLP';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Dashboard Profil');
      
      // Setup Columns
      sheet.columns = [
        { header: '', key: 'no', width: 5 },
        { header: '', key: 'col1', width: 35 },
        { header: '', key: 'col2', width: 15 },
        { header: '', key: 'col3', width: 15 },
        { header: '', key: 'col4', width: 20 },
      ];

      // Title
      sheet.mergeCells('A1:E1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'DASHBOARD PROFIL & TARGET CAPAIAN';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0ea5e9' } };

      sheet.addRow([]);
      
      // Ringkasan Data
      sheet.mergeCells('A3:E3');
      const sumTitle = sheet.getCell('A3');
      sumTitle.value = 'RINGKASAN DATA';
      sumTitle.font = { bold: true, size: 12 };
      
      sheet.addRow(['', 'Total Responden', filteredData.length]);
      sheet.addRow(['', 'Total Institusi FKTP', uniqueFktpData.length]);
      sheet.addRow(['', 'Provinsi Terjangkau', new Set(uniqueFktpData.map(d => d.provinsi).filter(Boolean)).size]);
      sheet.addRow(['', 'FKTP dengan Sp.KKLP', spkklpCount || 0]);
      
      sheet.addRow([]);

      // Data Distribusi Faskes
      sheet.mergeCells('A9:E9');
      sheet.getCell('A9').value = 'DISTRIBUSI JENIS FASKES (Unik)';
      sheet.getCell('A9').font = { bold: true, size: 12 };
      uniqueFktpTypeData.forEach(item => {
        sheet.addRow(['', item.name, item.value]);
      });

      sheet.addRow([]);

      let currentRow = sheet.rowCount + 2;

      // Charts (Capture images)
      const chartIds = [
        { id: 'chart-fktp-type', title: 'Proporsi Responden per FKTP' },
        { id: 'chart-unique-fktp', title: 'Proporsi FKTP Unik' },
        { id: 'chart-role', title: 'Proporsi Jabatan Responden' },
        { id: 'chart-regional', title: '10 Provinsi Terbanyak' }
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
            ext: { width: 500, height: 350 }
          });
          currentRow += 20; // reserve rows for image
        }
      }

      sheet.addRow([]);
      currentRow = sheet.rowCount + 2;

      // Target vs Capaian Table
      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const tableTitle = sheet.getCell(`A${currentRow}`);
      tableTitle.value = 'TARGET VS CAPAIAN PARTISIPASI PER PROVINSI';
      tableTitle.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      tableTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0ea5e9' } };
      tableTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      
      currentRow++;
      // Write Header Row for Table
      const headerRow = sheet.getRow(currentRow);
      headerRow.values = ['No', 'Provinsi', 'Target', 'Capaian', 'Persentase (%)'];
      headerRow.font = { bold: true, color: { argb: 'FF334155' } };
      headerRow.eachCell(cell => {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
         cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
         cell.alignment = { horizontal: 'center' };
      });

      currentRow++;
      
      partisipasiData.forEach((row, idx) => {
        const dataRow = sheet.getRow(currentRow);
        dataRow.values = [idx + 1, row.provinsi, row.target, row.capaian, row.persentase / 100];
        
        dataRow.getCell(5).numFmt = '0.00%';
        dataRow.getCell(1).alignment = { horizontal: 'center' };
        dataRow.getCell(3).alignment = { horizontal: 'center' };
        dataRow.getCell(4).alignment = { horizontal: 'center' };
        dataRow.getCell(5).alignment = { horizontal: 'center' };
        
        dataRow.eachCell(cell => {
           cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
        currentRow++;
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Dashboard_Profil_${new Date().getTime()}.xlsx`);
      
    } catch (err) {
      console.error('Failed to export native excel:', err);
      alert('Gagal mengekspor Excel Native: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-10`}></div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-500 font-medium mb-1 text-sm">{title}</p>
          <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
          {subtitle && <p className="text-sm font-medium mt-3 text-slate-500">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-2xl ${colorClass}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print">
          <button 
            onClick={exportNativeExcel} 
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 disabled:opacity-50 text-sm"
          >
            {isExporting ? (
              <span className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Menyiapkan Excel...</span>
            ) : (
              <span className="flex items-center"><Download className="w-4 h-4 mr-2" /> Download Excel Dashboard (Native Charts)</span>
            )}
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Responden" value={filteredData.length} subtitle="Partisipan Medis" icon={Users} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Total Institusi FKTP" value={uniqueFktpData.length} subtitle="Unik Berdasarkan Nama FKTP" icon={Building} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="Provinsi Terjangkau" value={new Set(uniqueFktpData.map(d => d.provinsi).filter(Boolean)).size} subtitle="Wilayah Sebaran FKTP" icon={Map} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="FKTP dengan Sp.KKLP" value={spkklpCount || 0} subtitle={`${uniqueFktpData.length > 0 ? Math.round((spkklpCount / uniqueFktpData.length) * 100) : 0}% dari total FKTP`} icon={Stethoscope} colorClass="bg-primary-500 text-primary-600 bg-primary-100" />
      </div>

      <div className="mt-8 border-t border-slate-100 pt-8 mb-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
          <Building className="w-6 h-6 mr-2 text-indigo-600" /> Institusi FKTP Berpartisipasi (Unik Berdasarkan Nama)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title="Puskesmas Unik" value={uniqueFktpTypeData.find(d => d.name === 'Puskesmas')?.value || 0} icon={Building} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
          <StatCard title="Klinik Unik" value={uniqueFktpTypeData.find(d => d.name === 'Klinik')?.value || 0} icon={Building} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
          <StatCard title="DPM Unik" value={uniqueFktpTypeData.find(d => d.name === 'Dokter Praktik Mandiri')?.value || 0} icon={Stethoscope} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Building className="w-5 h-5 mr-2 text-primary-600" /> Proporsi Responden per FKTP</h3>
            {!isPrinting && <ExportButton fileName="Proporsi Responden per FKTP" />}
          </div>
          <div id="chart-fktp-type" className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie data={fktpTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {fktpTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Responden`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Building className="w-5 h-5 mr-2 text-indigo-600" /> Proporsi FKTP Unik</h3>
            {!isPrinting && <ExportButton fileName="Proporsi FKTP Unik" />}
          </div>
          <div id="chart-unique-fktp" className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie data={uniqueFktpTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {uniqueFktpTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Institusi`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Users className="w-5 h-5 mr-2 text-primary-600" /> Proporsi Jabatan Responden</h3>
            {!isPrinting && <ExportButton fileName="Proporsi Jabatan Responden" />}
          </div>
          <div id="chart-role" className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie data={roleChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {roleChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Responden`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '15px', paddingBottom: '10px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 flex flex-col ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Map className="w-5 h-5 mr-2 text-primary-600" /> 10 Provinsi Terbanyak</h3>
            {!isPrinting && <ExportButton fileName="10 Provinsi Terbanyak" />}
          </div>
          <div id="chart-regional" className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <BarChart data={regionalData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-45} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah Responden" fill="#00857A" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Partisipasi Wilayah */}
      <div className={`mt-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center"><Map className="w-5 h-5 mr-2 text-primary-600" /> Target vs Capaian Partisipasi per Provinsi</h3>
          {!isPrinting && <ExportButton fileName="Target vs Capaian Provinsi" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Provinsi</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Estimasi Total FKTP</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Telah Mengisi Survey (Unik)</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Persentase Partisipasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {partisipasiData.map((row, i) => (
                <React.Fragment key={i}>
                  <tr 
                    onClick={() => {
                      setExpandedProv(expandedProv === row.provinsi ? null : row.provinsi);
                      setExpandedKab(null);
                    }}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                      <div className={`p-1 rounded-md transition-colors ${expandedProv === row.provinsi ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        {expandedProv === row.provinsi ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      {row.provinsi}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{row.target.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-center font-bold text-primary-700">{row.capaian.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${row.persentase >= 80 ? 'bg-emerald-500' : row.persentase >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${Math.min(row.persentase, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold ${row.persentase >= 80 ? 'text-emerald-700' : row.persentase >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                          {row.persentase.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                  {expandedProv === row.provinsi && (
                    <tr className="bg-slate-50/30">
                      <td colSpan="4" className="px-0 py-0">
                        <div className="px-6 py-4 border-l-4 border-l-primary-400 ml-8 mb-4 mt-2 bg-white rounded-r-xl shadow-sm border-t border-b border-r border-slate-100">
                          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                            <Map className="w-4 h-4 mr-2 text-primary-500" />
                            Detail Kabupaten/Kota di {row.provinsi}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="text-slate-500 border-b border-slate-100 bg-slate-50">
                                <tr>
                                  <th className="px-4 py-2 font-medium">Kabupaten/Kota</th>
                                  <th className="px-4 py-2 font-medium text-center">Target</th>
                                  <th className="px-4 py-2 font-medium text-center">Capaian</th>
                                  <th className="px-4 py-2 font-medium text-center">Persentase</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {row.kabKotaList.map((kabRow, j) => (
                                  <React.Fragment key={j}>
                                    <tr 
                                      className="hover:bg-slate-100 cursor-pointer"
                                      onClick={() => setExpandedKab(expandedKab === kabRow.kabKota ? null : kabRow.kabKota)}
                                    >
                                      <td className="px-4 py-3 text-slate-700 font-medium flex items-center gap-2">
                                        <div className={`p-0.5 rounded transition-colors ${expandedKab === kabRow.kabKota ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-500'}`}>
                                          {expandedKab === kabRow.kabKota ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </div>
                                        {kabRow.kabKota}
                                      </td>
                                      <td className="px-4 py-3 text-slate-500 text-center">{kabRow.target.toLocaleString('id-ID')}</td>
                                      <td className="px-4 py-3 text-primary-600 font-bold text-center">{kabRow.capaian.toLocaleString('id-ID')}</td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-md font-bold ${kabRow.persentase >= 80 ? 'bg-emerald-100 text-emerald-700' : kabRow.persentase >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                          {kabRow.persentase.toFixed(1)}%
                                        </span>
                                      </td>
                                    </tr>
                                    {expandedKab === kabRow.kabKota && (
                                      <tr className="bg-slate-50/50">
                                        <td colSpan="4" className="px-0 py-0">
                                          <div className="px-4 py-3 ml-8 border-l-2 border-l-indigo-300 bg-white shadow-inner max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-left text-xs">
                                              <thead className="text-slate-400 border-b border-slate-100 sticky top-0 bg-white">
                                                <tr>
                                                  <th className="py-2 px-2 font-medium">Nama Faskes</th>
                                                  <th className="py-2 px-2 font-medium">Jenis</th>
                                                  <th className="py-2 px-2 font-medium text-center">Status</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-50">
                                                {kabRow.faskesList.map((f, k) => (
                                                  <tr key={k} className="hover:bg-slate-50">
                                                    <td className={`py-2 px-2 font-medium ${f.capaian > 0 ? 'text-slate-800' : 'text-slate-500'}`}>{f.name}</td>
                                                    <td className="py-2 px-2 text-slate-500">
                                                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${f.type === 'Unmapped' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                                        {f.type}
                                                      </span>
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                      {f.capaian > 0 ? (
                                                        <div className="flex items-center justify-center text-emerald-600 font-medium">
                                                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Sudah Isi
                                                        </div>
                                                      ) : (
                                                        <div className="flex items-center justify-center text-rose-500">
                                                          <XCircle className="w-3.5 h-3.5 mr-1 opacity-70" /> Belum
                                                        </div>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))}
                                                {kabRow.faskesList.length === 0 && (
                                                  <tr>
                                                    <td colSpan="3" className="py-3 text-center text-slate-400">Tidak ada daftar Faskes target.</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))}
                                {row.kabKotaList.length === 0 && (
                                  <tr>
                                    <td colSpan="4" className="py-4 text-center text-slate-400">Tidak ada data detail wilayah.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
