import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, CheckCircle, XCircle, MinusCircle, AlertCircle, Printer } from 'lucide-react';
import {
  penyakitPasienBulanan, layananDirujukItems, layananBelumBerjalanItems,
  interviewQuestionsWithSpkklp, interviewQuestionsWithoutSpkklp,
  relevansiItems, peranSpkklpItems, kompetensiLayanan
} from './SurveyForm';
import { jknBenefits, nonOptimalServices } from './DataManagement';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const scaleLabel = { 1: 'Sangat Tidak Setuju', 2: 'Tidak Setuju', 3: 'Setuju', 4: 'Sangat Setuju' };
const scaleColor = (s) => {
  const n = Number(s);
  if (n === 1) return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' };
  if (n === 2) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
  if (n === 3) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
  if (n === 4) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
  return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
};

const roleBadge = (role = '') => {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (r.includes('sp.kklp') || r.includes('spkklp')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (r.includes('dokter')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (r.includes('kepala')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const spkklpBadge = (val) =>
  val === 'Ya' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200';

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionBlock({ title, color = 'bg-primary-600', icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm print:break-inside-avoid print:shadow-none print:border-slate-300">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className={`w-1.5 h-5 ${color} rounded-full shrink-0`} />
        <span className="font-bold text-sm text-slate-800 flex-1">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 py-4 bg-white">{children}</div>}
    </div>
  );
}

function InfoGrid({ items }) {
  // items: [{label, value, wide?}]
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ label, value, wide }, i) => {
        if (value === null || value === undefined || value === '') return null;
        return (
          <div key={i} className={`bg-slate-50 border border-slate-100 rounded-xl p-3 ${wide ? 'col-span-2' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-slate-800 leading-snug break-words">{value}</p>
          </div>
        );
      })}
    </div>
  );
}

function ScaleBadge({ value }) {
  const c = scaleColor(value);
  const n = Number(value);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className="font-black">{value || '-'}</span>
      {scaleLabel[n] && <span className="font-medium opacity-80">· {scaleLabel[n]}</span>}
    </span>
  );
}

function CheckBadge({ checked }) {
  return checked
    ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
    : <XCircle className="w-4 h-4 text-slate-300 shrink-0" />;
}

function ScaleTable({ items, values, keyFn = (_, i) => i }) {
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <tbody className="divide-y divide-slate-50">
          {items.map((label, idx) => {
            const val = values?.[keyFn(label, idx)];
            const rawVal = typeof val === 'object' ? val?.skala : val;
            const c = scaleColor(rawVal);
            return (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-slate-700 leading-relaxed">{label}</td>
                <td className="px-4 py-2.5 text-right w-36 shrink-0">
                  {rawVal
                    ? <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border ${c.bg} ${c.text} ${c.border}`}>
                        {rawVal} — {scaleLabel[Number(rawVal)] || '-'}
                      </span>
                    : <span className="text-slate-300 italic">—</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TagList({ items = [], emptyText = '—' }) {
  if (!items.length) return <span className="text-sm text-slate-400 italic">{emptyText}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium">
          {t}
        </span>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SurveyDetailModal({ selected, onClose }) {
  if (!selected) return null;

  const isDpm = selected.role === 'Dokter Praktik Mandiri';
  const isSpKklp = selected.role === 'Dokter Sp.KKLP';
  const withSpkklp = selected.doc_kklp === 'Ya';

  // ── Helpers untuk parsing data layanan ──
  const parseLayananDirujuk = () => {
    if (!selected.layanan_dirujuk) return [];
    return Object.keys(selected.layanan_dirujuk)
      .filter(k => selected.layanan_dirujuk[k] && k !== 'pengaruhPenurunanRujukan' && k !== 'lainnya')
      .map(k => isNaN(k) ? k : (layananDirujukItems[Number(k)] || k))
      .concat(selected.layanan_dirujuk.lainnya ? [`Lainnya: ${selected.layanan_dirujuk.lainnya}`] : []);
  };

  const parseLayananBelumBerjalan = () => {
    if (!selected.layanan_belum_berjalan) return [];
    return Object.keys(selected.layanan_belum_berjalan)
      .filter(k => selected.layanan_belum_berjalan[k] && k !== 'lainnya')
      .map(k => isNaN(k) ? k : (layananBelumBerjalanItems[Number(k)] || k))
      .concat(selected.layanan_belum_berjalan.lainnya ? [`Lainnya: ${selected.layanan_belum_berjalan.lainnya}`] : []);
  };

  const parseMekanismePRB = () => {
    if (!selected.prb) return '-';
    return Object.keys(selected.prb)
      .filter(k => k.startsWith('mek_') && selected.prb[k])
      .map(k => k.replace('mek_', '').replace(/_/g, ' '))
      .join(', ') || '-';
  };

  const interviewQuestions = (!isDpm && selected.doc_kklp === 'Tidak')
    ? interviewQuestionsWithoutSpkklp
    : interviewQuestionsWithSpkklp;

  try {
    const handlePrint = () => {
      document.body.classList.add('printing-modal');
      // Beri sedikit jeda agar DOM terupdate, lalu panggil print
      setTimeout(() => {
        window.print();
        // Hapus class setelah dialog print ditutup
        setTimeout(() => {
          document.body.classList.remove('printing-modal');
        }, 500);
      }, 100);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:block print:absolute print:inset-0 print:p-0 print:bg-transparent print:backdrop-blur-none print-modal-content">
        <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in print:shadow-none print:max-w-none print:w-full print:max-h-none print:h-auto print:overflow-visible print:rounded-none">

          {/* ── Header ── */}
          <div className="px-6 py-5 bg-gradient-to-r from-primary-700 to-primary-600 text-white flex items-start justify-between gap-4 shrink-0 print:bg-none print:bg-white print:text-black print:border-b print:border-slate-300 print:px-0">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-widest text-primary-200 uppercase mb-1 print:text-slate-500">Detail Isian Survey</p>
              <h3 className="font-extrabold text-xl leading-tight tracking-tight print:text-slate-900">{selected.fktp_name || 'Responden'}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {selected.provinsi && (
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
                    {selected.provinsi}{selected.kab_kota ? ` · ${selected.kab_kota}` : ''}
                  </span>
                )}
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${roleBadge(selected.role)} bg-white`}>
                  {selected.role || '-'}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${spkklpBadge(selected.doc_kklp)} bg-white`}>
                  {selected.doc_kklp === 'Ya' ? '✅ Memiliki Sp.KKLP' : '🔲 Tidak Memiliki Sp.KKLP'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 print:hidden">
              <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all shadow-sm">
                <Printer className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>
              <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-slate-50 print:overflow-visible print:bg-white print:p-0 print:space-y-6">

            {/* ═══ A. IDENTITAS ═══ */}
            <SectionBlock title="A. Identitas Responden" color="bg-primary-600">
              <InfoGrid items={[
                { label: 'Nama Puskesmas / Klinik', value: selected.fktp_name, wide: true },
                { label: 'Provinsi', value: selected.provinsi || selected.city },
                { label: 'Kabupaten / Kota', value: selected.kab_kota },
                { label: 'Kode Faskes BPJS', value: selected.kode_faskes },
                { label: 'Nama Responden', value: selected.nama_responden },
                { label: 'Jabatan', value: selected.role },
                { label: 'Jenis Faskes', value: selected.jenis_faskes },
                { label: 'Waktu Submit', value: selected.created_at ? new Date(selected.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : null },
              ]} />
            </SectionBlock>

            {/* ═══ B. BEBAN KERJA & KOMPETENSI DOKTER ═══ */}
            {!isDpm && (selected.time_in_poli || selected.kompetensi) && (
              <SectionBlock title="B. Kompetensi Dokter & Beban Kerja" color="bg-blue-600">
                <div className="space-y-4">
                  {(selected.time_in_poli || selected.time_home_visit || selected.prop_in_fktp != null) && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Beban Kerja</p>
                      <InfoGrid items={[
                        { label: 'Waktu Konsultasi Poli (mnt/pasien)', value: selected.time_in_poli },
                        { label: 'Waktu Home Visit (mnt/pasien)', value: selected.time_home_visit },
                        { label: 'Proporsi Dalam Gedung', value: selected.prop_in_fktp != null ? `${selected.prop_in_fktp}%` : null },
                        { label: 'Proporsi Luar Gedung', value: selected.prop_out_fktp != null ? `${selected.prop_out_fktp}%` : null },
                      ]} />
                    </div>
                  )}

                  {selected.kompetensi && Object.keys(selected.kompetensi).length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tabel Kompetensi Layanan</p>
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Layanan</th>
                              <th className="px-4 py-2.5 text-center font-semibold text-slate-600 w-36">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {kompetensiLayanan.map((nama, idx) => {
                              const item = selected.kompetensi[idx];
                              const status = item?.status;
                              const config = status === 'sudah'
                                ? { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Sudah Berjalan' }
                                : status === 'terbatas'
                                  ? { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Terbatas' }
                                  : status === 'belum'
                                    ? { cls: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Belum Berjalan' }
                                    : { cls: 'bg-slate-100 text-slate-400 border-slate-200', label: '—' };
                              return (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-2.5 text-slate-700">{nama}</td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.cls}`}>
                                      {config.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Khusus Sp.KKLP */}
                  {isSpKklp && selected.spkklp_poli && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detail Praktik Sp.KKLP</p>
                      <InfoGrid items={[
                        { label: 'Berpraktik sbg Sp.KKLP?', value: selected.spkklp_berpraktik },
                        { label: 'Poli Tersendiri', value: selected.spkklp_poli?.hasPoli },
                        { label: 'Sejak Tahun', value: selected.spkklp_poli?.sejak },
                        { label: 'Kunjungan/Hari', value: selected.spkklp_poli?.kunjungan },
                        { label: 'Pembiayaan', value: selected.spkklp_poli?.pembiayaan },
                        { label: 'Diagnosis Utama', value: selected.spkklp_poli?.diagnosis, wide: true },
                        { label: 'Tindakan/Prosedur', value: selected.spkklp_poli?.tindakan, wide: true },
                      ]} />
                    </div>
                  )}
                </div>
              </SectionBlock>
            )}

            {/* ═══ B. DATA DPM ═══ */}
            {isDpm && selected.dpm && (
              <SectionBlock title="B. Data Dokter Praktik Mandiri" color="bg-violet-600">
                <div className="space-y-4">
                  {selected.dpm.karakteristik && (
                    <>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">A. Karakteristik Praktik</p>
                      <InfoGrid items={[
                        { label: 'Lama Praktik', value: selected.dpm.karakteristik.lamaPraktik },
                        { label: 'Rata-rata Kunjungan', value: selected.dpm.karakteristik.jumlahKunjungan },
                        { label: 'Mayoritas Kelompok Umur', value: selected.dpm.karakteristik.kelompokUmur },
                        { label: 'Status Kepesertaan', value: selected.dpm.karakteristik.statusPeserta },
                      ]} />
                    </>
                  )}
                  {selected.dpm.kasus && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">B. Gambaran Kasus</p>
                      <InfoGrid items={[
                        { label: 'Masalah Kesehatan Terbanyak', value: Array.isArray(selected.dpm.kasus.masalahKesehatan) ? selected.dpm.kasus.masalahKesehatan.join(', ') : selected.dpm.kasus.masalahKesehatan, wide: true },
                        { label: 'Proporsi Kasus Kronis', value: selected.dpm.kasus.persenKronis },
                        { label: 'Proporsi Pasien Kontrol', value: selected.dpm.kasus.persenKontrol },
                        { label: 'Alasan Rujukan', value: selected.dpm.kasus.alasanRujukan, wide: true },
                      ]} />
                    </div>
                  )}
                </div>
              </SectionBlock>
            )}

            {/* ═══ C. PERSPEKTIF TERHADAP SP.KKLP ═══ */}
            {!isDpm && (selected.relevansi_spkklp || selected.peran_spkklp) && (
              <SectionBlock title="C. Perspektif terhadap Sp.KKLP" color="bg-indigo-600">
                <div className="space-y-4">
                  {selected.relevansi_spkklp && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {withSpkklp ? 'Relevansi Kegiatan Sp.KKLP (Skala 1–4)' : 'Harapan terhadap Sp.KKLP (Skala 1–4)'}
                      </p>
                      <ScaleTable items={relevansiItems} values={selected.relevansi_spkklp} />
                    </div>
                  )}

                  {selected.peran_spkklp && withSpkklp && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        A.2 Peran Sp.KKLP dalam Optimalisasi Layanan (Skala 1–4)
                      </p>
                      <ScaleTable items={peranSpkklpItems} values={selected.peran_spkklp} />
                    </div>
                  )}

                  {/* Layanan Dirujuk */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Layanan yang Masih Sering Dirujuk ke RS</p>
                    <TagList items={parseLayananDirujuk()} emptyText="Tidak ada data" />
                  </div>

                  {/* Layanan Belum Berjalan */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Layanan yang Belum Berjalan di Faskes</p>
                    <TagList items={parseLayananBelumBerjalan()} emptyText="Tidak ada data" />
                  </div>

                  {/* Pengaruh Penurunan Rujukan */}
                  {selected.layanan_dirujuk?.pengaruhPenurunanRujukan && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {withSpkklp ? 'Pengaruh Keberadaan Sp.KKLP thd Penurunan Rujukan' : 'Harapan Sp.KKLP Kurangi Rujukan'}
                      </p>
                      {(() => {
                        const val = selected.layanan_dirujuk.pengaruhPenurunanRujukan;
                        const labelMap = {
                          '1': '1 — Sangat Tidak Setuju',
                          '2': '2 — Tidak Setuju',
                          '3': '3 — Setuju',
                          '4': '4 — Sangat Setuju',
                        };
                        const c = scaleColor(val);
                        const display = labelMap[val] || val;
                        return (
                          <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-sm border ${c.bg} ${c.text} ${c.border}`}>
                            {display}
                          </span>
                        );
                      })()}
                    </div>
                  )}

                </div>
              </SectionBlock>
            )}

            {/* ═══ D. PROGRAM RUJUK BALIK (PRB) ═══ */}
            {selected.prb && Object.keys(selected.prb).length > 0 && (
              <SectionBlock title="D. Program Rujuk Balik (PRB)" color="bg-teal-600">
                <div className="space-y-4">
                  <InfoGrid items={[
                    { label: 'Jumlah Total Peserta PRB', value: selected.prb.jumlah },
                    { label: 'Rata-rata Rujukan ke FKRTL/Bulan', value: selected.prb.rataRujukan },
                    { label: 'Peserta Rutin Berkunjung (≥1x/bln)', value: selected.prb.rutinKunjungan },
                    { label: 'Peserta Tidak Berkunjung (3 bln)', value: selected.prb.tidakBerkunjung },
                  ]} />
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rincian Diagnosis PRB</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['DM', selected.prb.peserta_dm],
                        ['Hipertensi', selected.prb.peserta_ht],
                        ['Jantung', selected.prb.peserta_jantung],
                        ['PPOK', selected.prb.peserta_ppok],
                        ['Asma', selected.prb.peserta_asma],
                        ['Stroke', selected.prb.peserta_stroke],
                        ['Epilepsi', selected.prb.peserta_epilepsi],
                        ['Skizofrenia', selected.prb.peserta_skizofrenia],
                        ['SLE', selected.prb.peserta_sle],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
                          <p className="text-base font-black text-slate-800">{val ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mekanisme Pemantauan PRB</p>
                    <p className="text-sm text-slate-700">{parseMekanismePRB()}</p>
                  </div>
                </div>
              </SectionBlock>
            )}

            {/* ═══ E. PAKET MANFAAT JKN & DATA PASIEN ═══ */}
            {(selected.jkn || selected.data_pasien_bulanan || (isDpm && selected.dpm?.dataPasienBulanan)) && (
              <SectionBlock title="E. Paket Manfaat JKN & Data Kunjungan Pasien" color="bg-amber-600">
                <div className="space-y-4">
                  {selected.jkn && Object.keys(selected.jkn).length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Penilaian Layanan JKN (Skala 1–4)</p>
                      <ScaleTable items={jknBenefits} values={selected.jkn} />
                    </div>
                  )}

                  {/* Home Care */}
                  {selected.home_care && (selected.home_care.screening === 'ya' || selected.home_care.screening === 'Ya') && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pelayanan Home Care</p>
                      <InfoGrid items={[
                        { label: 'Tenaga Pelaksana', value: selected.home_care.tenaga },
                        { label: 'Jumlah Kunjungan', value: selected.home_care.jumlahKunjungan },
                        { label: 'Diagnosis', value: selected.home_care.diagnosis, wide: true },
                        { label: 'Kolaborasi', value: (selected.home_care.kolaborasi === 'ya' || selected.home_care.kolaborasi === 'Ya') ? selected.home_care.bentukKolaborasi : 'Tidak' },
                        { label: 'Kepatuhan', value: selected.home_care.kepatuhan },
                        { label: 'Perbaikan', value: (selected.home_care.perbaikan === 'ya' || selected.home_care.perbaikan === 'Ya') ? selected.home_care.bentukPerbaikan : 'Tidak' },
                      ]} />
                    </div>
                  )}

                  {/* Paliatif */}
                  {selected.paliatif && (selected.paliatif.screening === 'ya' || selected.paliatif.screening === 'Ya') && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pelayanan Paliatif</p>
                      <InfoGrid items={[
                        { label: 'Tenaga Pelaksana', value: selected.paliatif.tenaga },
                        { label: 'Terapi', value: selected.paliatif.terapi },
                        { label: 'Diagnosis', value: selected.paliatif.diagnosis, wide: true },
                        { label: 'Kolaborasi', value: (selected.paliatif.kolaborasi === 'ya' || selected.paliatif.kolaborasi === 'Ya') ? selected.paliatif.bentukKolaborasi : 'Tidak' },
                        { label: 'Kepatuhan', value: selected.paliatif.kepatuhan },
                        { label: 'Perbaikan', value: (selected.paliatif.perbaikan === 'ya' || selected.paliatif.perbaikan === 'Ya') ? selected.paliatif.bentukPerbaikan : 'Tidak' },
                      ]} />
                    </div>
                  )}

                  {/* Data Kunjungan Pasien Bulanan */}
                  {(() => {
                    const dpb = isDpm ? selected.dpm?.dataPasienBulanan : selected.data_pasien_bulanan;
                    if (!dpb || !Object.keys(dpb).length) return null;
                    return (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Kunjungan Pasien (1 Bulan Terakhir)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {penyakitPasienBulanan.map(p => {
                            if (dpb[p.id] === undefined) return null;
                            return (
                              <div key={p.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{p.label}</p>
                                <p className="text-base font-black text-slate-800">{dpb[p.id]}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </SectionBlock>
            )}

            {/* ═══ F. LAYANAN NON-OPTIMAL ═══ */}
            {selected.non_optimal && Object.keys(selected.non_optimal).length > 0 && (
              <SectionBlock title="F. Layanan Belum Optimal / Tidak Terakomodasi JKN" color="bg-rose-600">
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Layanan</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-slate-600 w-28">Skala</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-slate-600 w-28">Perlu ke JKN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {nonOptimalServices.map((nama, idx) => {
                        const item = selected.non_optimal[idx] || {};
                        const c = scaleColor(item.skala);
                        const jknConfig = item.masukJkn === 'Ya'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : item.masukJkn === 'Tidak'
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200';
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5 text-slate-700 leading-relaxed">{nama}</td>
                            <td className="px-4 py-2.5 text-center">
                              {item.skala
                                ? <span className={`inline-block px-2 py-0.5 rounded-full font-bold border ${c.bg} ${c.text} ${c.border}`}>{item.skala}</span>
                                : <span className="text-slate-300">—</span>
                              }
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {item.masukJkn
                                ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${jknConfig}`}>{item.masukJkn}</span>
                                : <span className="text-slate-300">—</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionBlock>
            )}

            {/* ═══ G. PENDALAMAN KUALITATIF ═══ */}
            <SectionBlock title="G. Pendalaman Kualitatif" color="bg-emerald-600" defaultOpen={false}>
              <div className="space-y-3">
                {selected.wawancara?.pewawancara && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl text-sm">
                    <span className="font-semibold text-emerald-800">Diwawancarai oleh:</span>
                    <span className="text-emerald-700 capitalize">{selected.wawancara.pewawancara}</span>
                  </div>
                )}
                {interviewQuestions.map((q, idx) => {
                  const jawaban = selected.wawancara?.[idx];
                  const isEmpty = !jawaban;
                  return (
                    <div key={idx} className={`rounded-xl border p-4 ${isEmpty ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                      <div className="flex gap-3 mb-2">
                        <span className="w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed flex-1">{q}</p>
                      </div>
                      <div className="pl-9">
                        {isEmpty
                          ? <p className="text-xs text-slate-400 italic">Belum diisi</p>
                          : <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{jawaban}</p>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionBlock>

          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SurveyDetailModal Render Error:', error);
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-red-600 mb-4">Terjadi Kesalahan Render</h2>
          <p className="text-sm text-slate-700 mb-4">Ada data yang formatnya tidak sesuai. Kirimkan error berikut ke developer:</p>
          <div className="bg-red-50 text-red-800 p-4 rounded-lg overflow-x-auto text-xs font-mono">
            {error.message}<br /><br />{error.stack}
          </div>
        </div>
      </div>
    );
  }
}
