import React from 'react';
import { X, CheckCircle, FileText, ChevronRight } from 'lucide-react';
import { 
  penyakitPasienBulanan, layananDirujukItems, layananBelumBerjalanItems,
  interviewQuestionsWithSpkklp, interviewQuestionsWithoutSpkklp, relevansiItems, peranSpkklpItems, kompetensiLayanan
} from './SurveyForm';
import { jknBenefits, nonOptimalServices } from './DataManagement';

export default function SurveyDetailModal({ selected, onClose }) {
  if (!selected) return null;
  // alert('SurveyDetailModal dijalankan untuk: ' + selected.fktp_name);

  const statusBadge = (status) => {
    if (status === 'sudah') return 'bg-emerald-100 text-emerald-700';
    if (status === 'belum') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  };

  const scaleBadge = (skala) => {
    const s = parseInt(skala);
    if (s >= 3) return 'bg-emerald-100 text-emerald-700';
    if (s <= 2) return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  };

  const roleBadge = (role = '') => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'bg-purple-100 text-purple-800';
    if (r.includes('survey')) return 'bg-blue-100 text-blue-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  const jknBadge = (val) => {
    if (val === 'Ya') return 'bg-emerald-100 text-emerald-700';
    if (val === 'Tidak') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  };

  const SectionHeader = ({ label }) => (
    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
      <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
      {label}
    </h4>
  );

  const Field = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xs font-medium text-slate-800">{value}</p>
      </div>
    );
  };

  try {
    return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
        <div className="px-6 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-start justify-between gap-4 shrink-0 shadow-inner">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wider text-primary-200 uppercase mb-1">Detail Isian Survey</p>
            <h3 className="font-extrabold text-lg leading-tight tracking-tight">{selected.fktp_name || 'Responden'}</h3>
            <p className="text-xs font-medium text-primary-100 mt-1 opacity-90">{selected.provinsi || selected.city} {selected.kab_kota ? `· ${selected.kab_kota}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl shrink-0 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

              {/* ── A. Identitas ── */}
              <div>
                <SectionHeader label="A. Identitas" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Field label="Waktu Submit" value={new Date(selected.created_at).toLocaleString('id-ID')} />
                  <Field label="Provinsi" value={selected.provinsi || selected.city} />
                  <Field label="Kabupaten/Kota" value={selected.kab_kota || '-'} />
                  <Field label="Nama Puskesmas / Klinik" value={selected.fktp_name} />
                  <Field label="Kode Faskes BPJS" value={selected.kode_faskes || '-'} />
                  <Field label="Nama Responden" value={selected.nama_responden || '-'} />
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Jabatan Pengisi</span>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleBadge(selected.role)}`}>{selected.role || '-'}</span>
                  </div>
                  <Field label="Dokter Sp.KKLP" value={selected.doc_kklp || 'Tidak'} />
                </div>
              </div>

              {/* ── B. Detail Khusus Sp.KKLP & Perspektif ── */}
              {selected.role === 'Dokter Sp.KKLP' && (
                <div>
                  <SectionHeader label="B. Detail Khusus Sp.KKLP & Perspektif" />
                  <div className="space-y-4">
                    <Field label="Berpraktik sbg Sp.KKLP?" value={selected.spkklp_berpraktik} />
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                      <p className="font-semibold text-slate-700 text-xs">Poli Tempat Praktik</p>
                      {selected.spkklp_poli?.hasPoli === 'Ya' ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <p><span className="text-slate-500">Sejak:</span> {selected.spkklp_poli.sejak || '-'}</p>
                          <p><span className="text-slate-500">Kunjungan/hari:</span> {selected.spkklp_poli.kunjungan || '-'}</p>
                          <p><span className="text-slate-500">Pembiayaan:</span> {selected.spkklp_poli.pembiayaan || '-'}</p>
                          <div className="col-span-2">
                             <p><span className="text-slate-500">Diagnosis:</span> {selected.spkklp_poli.diagnosis || '-'}</p>
                             <p><span className="text-slate-500 mt-1">Tindakan:</span> {selected.spkklp_poli.tindakan || '-'}</p>
                          </div>
                          <div className="col-span-2 mt-1">
                             <p><span className="text-slate-500">Luaran:</span> {Object.keys(selected.spkklp_poli).filter(k => k.startsWith('luaran_') && selected.spkklp_poli[k]).map(k => k.replace('luaran_', '')).join(', ') || '-'}</p>
                             {selected.spkklp_poli.alasanRujukan && <p><span className="text-slate-500 mt-1 block">Alasan Rujukan:</span> {selected.spkklp_poli.alasanRujukan}</p>}
                          </div>
                        </div>
                      ) : selected.spkklp_poli?.hasPoli === 'Tidak' ? (
                        <div className="text-xs">
                          <p>Tidak ada poli tersendiri.</p>
                          <p><span className="text-slate-500 mt-2 block">Diagnosis yang dilayani:</span> {selected.spkklp_poli.diagnosis || '-'}</p>
                          <p><span className="text-slate-500 mt-1 block">Tindakan/Prosedur:</span> {selected.spkklp_poli.tindakan || '-'}</p>
                          <p><span className="text-slate-500 mt-1 block">Luaran:</span> {Object.keys(selected.spkklp_poli).filter(k => k.startsWith('luaran_') && selected.spkklp_poli[k]).map(k => k.replace('luaran_', '')).join(', ') || '-'}</p>
                          {selected.spkklp_poli.alasanRujukan && <p><span className="text-slate-500 mt-1 block">Alasan Rujukan:</span> {selected.spkklp_poli.alasanRujukan}</p>}
                        </div>
                      ) : <p className="text-xs text-slate-400">-</p>}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                      <p className="font-semibold text-slate-700 text-xs">Kendala Praktik (Tanpa Poli)</p>
                      {selected.spkklp_kendala?.hasKendala === 'Ya' ? (
                        <div className="text-xs">
                           <p>Terdapat kendala.</p>
                           <p><span className="text-slate-500 mt-2 block">Diagnosis yang sering dirujuk:</span> {selected.spkklp_kendala.diagnosis || '-'}</p>
                           <p><span className="text-slate-500 mt-1 block">Tindakan/Prosedur yang terkendala:</span> {selected.spkklp_kendala.tindakan || '-'}</p>
                        </div>
                      ) : <p className="text-xs">{selected.spkklp_kendala?.hasKendala || '-'}</p>}
                    </div>

                    {selected.relevansi_spkklp && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Skala Relevansi Sp.KKLP (1-4):</p>
                        {relevansiItems.map((item, idx) => {
                          const val = selected.relevansi_spkklp[idx];
                          return (
                            <div key={idx} className="flex justify-between items-center py-1.5 text-xs border-b border-slate-200/50 last:border-0">
                              <span className="text-slate-600 mr-2">{item}</span>
                              <span className={`font-bold px-2 py-0.5 rounded shrink-0 ${val ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-100'}`}>{val || '-'}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selected.peran_spkklp && selected.doc_kklp === 'Ya' && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">A.2 Peran Sp.KKLP dalam Optimalisasi Layanan (1-4):</p>
                        {peranSpkklpItems.map((item, idx) => {
                          const val = selected.peran_spkklp[idx];
                          return (
                            <div key={idx} className="flex justify-between items-center py-1.5 text-xs border-b border-slate-200/50 last:border-0">
                              <span className="text-slate-600 mr-2">{item}</span>
                              <span className={`font-bold px-2 py-0.5 rounded shrink-0 ${val ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-100'}`}>{val || '-'}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selected.layanan_dirujuk?.pengaruhPenurunanRujukan && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Pengaruh Keberadaan Sp.KKLP Terhadap Penurunan Rujukan:</p>
                        <p className="text-sm font-bold text-indigo-700">Skala {selected.layanan_dirujuk.pengaruhPenurunanRujukan}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── B. Detail Dokter Praktik Mandiri (DPM) ── */}
              {selected.role === 'Dokter Praktik Mandiri' && selected.dpm && (
                <div>
                  <SectionHeader label="B. Detail Dokter Praktik Mandiri (DPM)" />
                  <div className="space-y-4 text-xs">
                    {/* Karakteristik Praktik */}
                    {selected.dpm.karakteristik && (
                      <div className="p-3 border rounded-lg bg-slate-50 border-slate-100 space-y-2">
                        <div className="font-semibold text-slate-600 mb-1">A. Karakteristik Praktik</div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Lama Praktik:</span> <span>{selected.dpm.karakteristik.lamaPraktik || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Rata-rata Kunjungan:</span> <span>{selected.dpm.karakteristik.jumlahKunjungan || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Mayoritas Kelompok Umur:</span> <span>{selected.dpm.karakteristik.kelompokUmur || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Status Kepesertaan:</span> <span>{selected.dpm.karakteristik.statusPeserta || '-'}</span></div>
                      </div>
                    )}
                    {/* Kasus */}
                    {selected.dpm.kasus && (
                      <div className="p-3 border rounded-lg bg-slate-50 border-slate-100 space-y-2">
                        <div className="font-semibold text-slate-600 mb-1">B. Gambaran Kasus</div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Masalah Kesehatan Terbanyak:</span> <span>{Array.isArray(selected.dpm.kasus.masalahKesehatan) ? selected.dpm.kasus.masalahKesehatan.join(', ') : '-'} {selected.dpm.kasus.masalahLainnya ? `(${selected.dpm.kasus.masalahLainnya})` : ''}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Proporsi Kasus Kronis:</span> <span>{selected.dpm.kasus.persenKronis || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Proporsi Pasien Kontrol:</span> <span>{selected.dpm.kasus.persenKontrol || '-'}</span></div>
                        {selected.dpm.kasus.alasanRujukan && <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Indikasi/Alasan Rujukan:</span> <span>{selected.dpm.kasus.alasanRujukan}</span></div>}
                      </div>
                    )}
                    {/* Pendekatan */}
                    {selected.dpm.pendekatan && (
                      <div className="p-3 border rounded-lg bg-slate-50 border-slate-100 space-y-2">
                        <div className="font-semibold text-slate-600 mb-1">C. Pendekatan Kedokteran Keluarga</div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Tahu Keluarga Inti:</span> <span>{selected.dpm.pendekatan.tahuKeluargaInti || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Menangani Keluarga Yg Sama:</span> <span>{selected.dpm.pendekatan.menanganiKeluargaSama || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Tanya Kondisi Keluarga Lain:</span> <span>{selected.dpm.pendekatan.tanyaKondisiKeluargaLain || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Aspek Digali:</span> <span>{Array.isArray(selected.dpm.pendekatan.aspekDigali) ? selected.dpm.pendekatan.aspekDigali.join(', ') : '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Pengaruh Keluarga pd Kasus:</span> <span>{selected.dpm.pendekatan.pengaruhKeluargaKasus || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Contoh Masalah Keluarga:</span> <span>{selected.dpm.pendekatan.contohMasalahKeluarga || '-'} {selected.dpm.pendekatan.contohMasalahLainnya ? `(${selected.dpm.pendekatan.contohMasalahLainnya})` : ''}</span></div>
                      </div>
                    )}
                    {/* Kontinuitas */}
                    {selected.dpm.kontinuitas && (
                      <div className="p-3 border rounded-lg bg-slate-50 border-slate-100 space-y-2">
                        <div className="font-semibold text-slate-600 mb-1">D. Kontinuitas Pelayanan</div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Sistem Pencatatan JK Panjang:</span> <span>{selected.dpm.kontinuitas.sistemPencatatan || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Jadwalkan Kunjungan Ulang:</span> <span>{selected.dpm.kontinuitas.jadwalkanKunjunganUlang || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Tindak Lanjut Tdk Datang:</span> <span>{selected.dpm.kontinuitas.tindakLanjutTidakDatang || '-'}</span></div>
                      </div>
                    )}
                    {/* Gambaran */}
                    {selected.dpm.gambaran && (
                      <div className="p-3 border rounded-lg bg-slate-50 border-slate-100 space-y-2">
                        <div className="font-semibold text-slate-600 mb-1">E. Gambaran Komprehensif</div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Kegiatan Dilakukan:</span> <span>{Array.isArray(selected.dpm.gambaran.kegiatanDilakukan) ? selected.dpm.gambaran.kegiatanDilakukan.join(', ') : '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Bentuk Pelayanan Keluarga:</span> <span>{selected.dpm.gambaran.bentukPelayananKeluarga || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Contoh Kasus Keluarga:</span> <span>{selected.dpm.gambaran.contohKasusKeluarga || '-'}</span></div>
                        <div className="flex"><span className="text-slate-500 font-medium w-48 shrink-0">Contoh Layanan Holistik:</span> <span>{selected.dpm.gambaran.contohLayananHolistik || '-'}</span></div>
                      </div>
                    )}
                    {/* Data Pasien Bulanan DPM */}
                    {selected.dpm.dataPasienBulanan && Object.keys(selected.dpm.dataPasienBulanan).length > 0 && (
                      <div className="p-3 border rounded-lg bg-slate-50 border-slate-100 mt-4">
                        <div className="font-semibold text-slate-600 mb-3">F. Data Kunjungan Pasien Bulanan</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {penyakitPasienBulanan.map(p => {
                            if (selected.dpm.dataPasienBulanan[p.id] !== undefined) {
                              return <Field key={p.id} label={p.label} value={selected.dpm.dataPasienBulanan[p.id]} />;
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Data Pasien Bulanan (Non-DPM) ── */}
              {selected.role !== 'Dokter Praktik Mandiri' && selected.data_pasien_bulanan && Object.keys(selected.data_pasien_bulanan).length > 0 && (
                <div>
                  <SectionHeader label="Data Kunjungan Pasien Bulanan" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                    {penyakitPasienBulanan.map(p => {
                      if (selected.data_pasien_bulanan[p.id] !== undefined) {
                        return <Field key={p.id} label={p.label} value={selected.data_pasien_bulanan[p.id]} />;
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* ── C. Program Rujuk Balik (PRB) ── */}
              {selected.prb && Object.keys(selected.prb).length > 0 && (
                <div>
                  <SectionHeader label="C. Program Rujuk Balik (PRB)" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <Field label="Jumlah Peserta PRB" value={selected.prb.jumlah || '-'} />
                    <Field label="Rutin Kunjungan (≥1x/bln)" value={selected.prb.rutinKunjungan || '-'} />
                    <Field label="Tidak Berkunjung (3 bln)" value={selected.prb.tidakBerkunjung || '-'} />
                    <Field label="Rata-rata Rujukan per Bulan" value={selected.prb.rataRujukan || '-'} />
                    
                    <div className="md:col-span-2">
                      <span className="font-semibold block text-xs text-slate-500 uppercase tracking-wider mb-1 mt-2">Jumlah Diagnosis PRB</span>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label="DM" value={selected.prb.peserta_dm || '-'} />
                        <Field label="Hipertensi" value={selected.prb.peserta_ht || '-'} />
                        <Field label="Jantung" value={selected.prb.peserta_jantung || '-'} />
                        <Field label="PPOK" value={selected.prb.peserta_ppok || '-'} />
                        <Field label="Asma" value={selected.prb.peserta_asma || '-'} />
                        <Field label="Stroke" value={selected.prb.peserta_stroke || '-'} />
                        <Field label="Epilepsi" value={selected.prb.peserta_epilepsi || '-'} />
                        <Field label="Skizofrenia" value={selected.prb.peserta_skizofrenia || '-'} />
                        <Field label="SLE" value={selected.prb.peserta_sle || '-'} />
                      </div>
                    </div>
                    
                    <Field label="Mekanisme Pemantauan" value={Object.keys(selected.prb).filter(k => k.startsWith('mek_') && selected.prb[k]).map(k => k.replace('mek_', '')).join(', ') || '-'} />
                    <Field label="Kendala Pelaksanaan" value={selected.prb.kendala || '-'} />
                  </div>
                </div>
              )}

              {/* ── D. Layanan Dirujuk / Belum Optimal ── */}
              {(selected.layanan_dirujuk || selected.layanan_belum_berjalan) && (
                <div>
                  <SectionHeader label="D. Layanan yang Dirujuk / Belum Optimal" />
                  <div className="grid grid-cols-1 gap-y-3 text-sm">
                    <Field label="Layanan yang Masih Sering Dirujuk" value={selected.layanan_dirujuk ? Object.keys(selected.layanan_dirujuk).filter(k => selected.layanan_dirujuk[k] && k !== 'pengaruhPenurunanRujukan').map(k => k === 'lainnya' ? selected.layanan_dirujuk.lainnya : (layananDirujukItems[k] || k)).join(', ') : '-'} />
                    <Field label="Layanan yang Belum Berjalan Optimal" value={selected.layanan_belum_berjalan ? Object.keys(selected.layanan_belum_berjalan).filter(k => selected.layanan_belum_berjalan[k]).map(k => k === 'lainnya' ? selected.layanan_belum_berjalan.lainnya : (layananBelumBerjalanItems[k] || k)).join(', ') : '-'} />
                  </div>
                </div>
              )}

              {/* ── E. Beban Kerja ── */}
              <div>
                <SectionHeader label="E. Beban Kerja Dokter" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Field label="Waktu Konsultasi Poli (mnt/pasien)" value={selected.time_in_poli} />
                  <Field label="Waktu Home Visit (mnt/pasien)" value={selected.time_home_visit} />
                  <Field label="Proporsi Dalam Gedung" value={selected.prop_in_fktp != null ? `${selected.prop_in_fktp}%` : null} />
                  <Field label="Proporsi Luar Gedung" value={selected.prop_out_fktp != null ? `${selected.prop_out_fktp}%` : null} />
                </div>
              </div>

              {/* ── C. Kompetensi Layanan ── */}
              {selected.kompetensi && Object.keys(selected.kompetensi).length > 0 && (
                <div>
                  <SectionHeader label="F. Penilaian Kompetensi Sp.KKLP" />
                  <div className="space-y-2">
                    {kompetensiLayanan.map((nama, idx) => {
                      const item = selected.kompetensi[idx];
                      return (
                        <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className="text-xs text-slate-700 flex-1">{nama}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${statusBadge(item?.status)}`}>
                            {item?.status ? `Status ${item.status === 'sudah' ? 'Sudah' : 'Belum'}` : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── D. Manfaat JKN ── */}
              {selected.jkn && Object.keys(selected.jkn).length > 0 && (
                <div>
                  <SectionHeader label="G. Penilaian Layanan JKN yang Sudah Berjalan" />
                  <div className="space-y-2">
                    {jknBenefits.map((nama, idx) => {
                      const item = selected.jkn[idx];
                      return (
                        <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className="text-xs text-slate-700 flex-1">{nama}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${scaleBadge(item?.skala)}`}>
                            {item?.skala ? `Skala ${item.skala}` : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* ── Home Care ── */}
              {selected.home_care && (selected.home_care.screening === 'ya' || selected.home_care.screening === 'Ya') && (
                <div>
                  <SectionHeader label="H. Pelayanan Home Care" />
                  <div className="space-y-2 text-xs">
                    <p><span className="font-semibold">Tenaga:</span> {selected.home_care.tenaga}</p>
                    <p><span className="font-semibold">Diagnosis:</span> {selected.home_care.diagnosis}</p>
                    <p><span className="font-semibold">Kondisi:</span> {Object.keys(selected.home_care).filter(k => k.startsWith('kondisi_') && selected.home_care[k]).map(k => k.replace('kondisi_', '')).join(', ')} {selected.home_care.kondisiLainnya ? `(${selected.home_care.kondisiLainnya})` : ''}</p>
                    <p><span className="font-semibold">Jenis Layanan:</span> {Object.keys(selected.home_care).filter(k => k.startsWith('jenis_') && selected.home_care[k]).map(k => k.replace('jenis_', '')).join(', ')} {selected.home_care.jenisLayananLainnya ? `(${selected.home_care.jenisLayananLainnya})` : ''}</p>
                    <p><span className="font-semibold">Jumlah Kunjungan:</span> {selected.home_care.jumlahKunjungan}</p>
                    <p><span className="font-semibold">Kolaborasi:</span> {(selected.home_care.kolaborasi === 'ya' || selected.home_care.kolaborasi === 'Ya') ? selected.home_care.bentukKolaborasi : 'Tidak'}</p>
                    <p><span className="font-semibold">Kepatuhan:</span> {selected.home_care.kepatuhan}</p>
                    <p><span className="font-semibold">Perbaikan:</span> {(selected.home_care.perbaikan === 'ya' || selected.home_care.perbaikan === 'Ya') ? selected.home_care.bentukPerbaikan : 'Tidak'}</p>
                  </div>
                </div>
              )}

              {/* ── Paliatif ── */}
              {selected.paliatif && (selected.paliatif.screening === 'ya' || selected.paliatif.screening === 'Ya') && (
                <div>
                  <SectionHeader label="I. Pelayanan Paliatif" />
                  <div className="space-y-2 text-xs">
                    <p><span className="font-semibold">Tenaga:</span> {selected.paliatif.tenaga}</p>
                    <p><span className="font-semibold">Diagnosis:</span> {selected.paliatif.diagnosis}</p>
                    <p><span className="font-semibold">Kondisi:</span> {Object.keys(selected.paliatif).filter(k => k.startsWith('kondisi_') && selected.paliatif[k]).map(k => k.replace('kondisi_', '')).join(', ')} {selected.paliatif.kondisiLainnya ? `(${selected.paliatif.kondisiLainnya})` : ''}</p>
                    <p><span className="font-semibold">Tujuan:</span> {Object.keys(selected.paliatif).filter(k => k.startsWith('tujuan_') && selected.paliatif[k]).map(k => k.replace('tujuan_', '')).join(', ')} {selected.paliatif.tujuanLainnya ? `(${selected.paliatif.tujuanLainnya})` : ''}</p>
                    <p><span className="font-semibold">Terapi:</span> {selected.paliatif.terapi}</p>
                    <p><span className="font-semibold">Kolaborasi:</span> {(selected.paliatif.kolaborasi === 'ya' || selected.paliatif.kolaborasi === 'Ya') ? selected.paliatif.bentukKolaborasi : 'Tidak'}</p>
                    <p><span className="font-semibold">Kepatuhan:</span> {selected.paliatif.kepatuhan}</p>
                    <p><span className="font-semibold">Perbaikan:</span> {(selected.paliatif.perbaikan === 'ya' || selected.paliatif.perbaikan === 'Ya') ? selected.paliatif.bentukPerbaikan : 'Tidak'}</p>
                  </div>
                </div>
              )}
\n              {/* ── E. Layanan Non-Optimal ── */}
              {selected.non_optimal && Object.keys(selected.non_optimal).length > 0 && (
                <div>
                  <SectionHeader label="J. Layanan Belum Optimal / Belum Tersedia" />
                  <div className="space-y-2">
                    {nonOptimalServices.map((nama, idx) => {
                      const item = selected.non_optimal[idx] || {};
                      return (
                        <div key={idx} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className="text-xs text-slate-700 flex-1">{nama}</span>
                          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${jknBadge(item.masukJkn)}`}>
                              {item.masukJkn || '-'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scaleBadge(item.skala)}`}>
                              {item.skala ? `Skala ${item.skala}` : '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── F. Wawancara ── */}
              {true && (
                <div>
                  <SectionHeader label="K. Hasil Wawancara" />
                  {selected.wawancara?.pewawancara && (
                    <div className="mb-3 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg text-xs flex gap-2">
                      <span className="font-semibold text-emerald-800">Diwawancarai oleh:</span>
                      <span className="text-emerald-700 capitalize">{selected.wawancara.pewawancara}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {(selected.doc_kklp === 'Tidak' ? interviewQuestionsWithoutSpkklp : interviewQuestionsWithSpkklp).map((q, idx) => {
                      const jawaban = selected.wawancara?.[idx];
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                          <p className="font-semibold text-slate-700 text-xs mb-2 flex gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full shrink-0 mt-0.5">{idx + 1}</span>
                            <span>{q}</span>
                          </p>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed pl-7">
                            {jawaban || <span className="text-slate-400 italic">Belum diisi</span>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              </div>
      </div>
    </div>
    );
  } catch (error) {
    console.error("SurveyDetailModal Render Error:", error);
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-red-600 mb-4">Terjadi Kesalahan Render</h2>
          <p className="text-sm text-slate-700 mb-4">Maaf, ada data yang formatnya tidak sesuai sehingga pop-up gagal ditampilkan. Kirimkan error di bawah ini ke developer:</p>
          <div className="bg-red-50 text-red-800 p-4 rounded-lg overflow-x-auto text-xs font-mono">
            {error.message}
            <br/><br/>
            {error.stack}
          </div>
        </div>
      </div>
    );
  }
}
