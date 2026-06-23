import React from 'react';
import { Printer } from 'lucide-react';
import logoKemenkes from '../assets/logo-kemenkes.png';
import {
  relevansiItems,
  peranSpkklpItems,
  layananDirujukItems,
  layananBelumBerjalanItems,
  kompetensiLayanan,
  penyakitPasienBulanan,
  interviewQuestionsWithSpkklp,
  interviewQuestionsWithoutSpkklp,
} from './SurveyForm';

// ─── Komponen pembantu ─────────────────────────────────────────────────────────

function ScaleBoxes({ count = 4 }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-8 h-8 border-2 border-slate-400 rounded flex items-center justify-center text-xs font-bold text-slate-500">
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function CheckBox({ label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="w-5 h-5 border-2 border-slate-400 rounded flex-shrink-0" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function RadioGroup({ options = [] }) {
  return (
    <div className="flex gap-4 flex-wrap">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-700">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function SectionHeader({ color = 'bg-primary-600', title }) {
  return (
    <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 mb-4">
      <div className={`w-1 h-6 ${color} rounded-full`} />
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    </div>
  );
}

function BlankLine({ label, className = '' }) {
  return (
    <div className={`mb-3 ${className}`}>
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>}
      <div className="border-b border-slate-400 h-7 w-full" />
    </div>
  );
}

function FormHeader({ withSpkklp }) {
  return (
    <div className="flex items-start gap-4 mb-6 pb-4 border-b-2 border-slate-300">
      <img src={logoKemenkes} alt="Logo Kemenkes" className="h-16 object-contain" />
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">
          Survey Optimalisasi Program JKN di Puskesmas / Klinik
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kementerian Kesehatan RI — PMK 19 Tahun 2024 — Sp.KKLP
        </p>
        <div className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold ${
          withSpkklp
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : 'bg-orange-100 text-orange-800 border border-orange-300'
        }`}>
          {withSpkklp
            ? '✅ Formulir A — Faskes MEMILIKI Dokter Sp.KKLP'
            : '🔲 Formulir B — Faskes TIDAK MEMILIKI Dokter Sp.KKLP'}
        </div>
      </div>
    </div>
  );
}

// ─── Form utama (satu versi) ───────────────────────────────────────────────────

function FormContent({ withSpkklp }) {
  const interviewQuestions = withSpkklp
    ? interviewQuestionsWithSpkklp
    : interviewQuestionsWithoutSpkklp;

  return (
    <div className="space-y-8 text-sm">
      <FormHeader withSpkklp={withSpkklp} />

      {/* BAGIAN A: IDENTITAS */}
      <section>
        <SectionHeader color="bg-primary-600" title="A. Identitas Responden" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <BlankLine label="Provinsi" />
          <BlankLine label="Kabupaten / Kota" />
          <BlankLine label="Nama Puskesmas / Klinik" />
          <BlankLine label="Kode Faskes BPJS" />
          <BlankLine label="Nama Responden" />
          <BlankLine label="Tanggal Pengisian" />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Jenis Faskes / Responden</label>
          <RadioGroup options={['Puskesmas', 'Klinik', 'Dokter Praktik Mandiri']} />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Jabatan</label>
          <RadioGroup options={['Kepala Puskesmas / klinik', 'Dokter Umum', 'Dokter Sp.KKLP', 'Tenaga Kesehatan Fungsional']} />
        </div>

        <div className="mt-3 p-3 rounded-lg border-2 font-bold text-sm text-center" style={{ borderColor: withSpkklp ? '#10b981' : '#f97316', color: withSpkklp ? '#065f46' : '#7c2d12', background: withSpkklp ? '#ecfdf5' : '#fff7ed' }}>
          Apakah Puskesmas / Klinik memiliki Dokter Sp.KKLP?
          <span className="ml-6 font-extrabold text-lg">{withSpkklp ? '☑ Ya     ☐ Tidak' : '☐ Ya     ☑ Tidak'}</span>
        </div>
      </section>

      {/* BAGIAN B: KOMPETENSI DOKTER */}
      <section>
        <SectionHeader color="bg-blue-600" title="B. Kompetensi Dokter & Beban Kerja (Khusus Dokter Umum & Sp.KKLP)" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
          <BlankLine label="Waktu rata-rata per pasien di Poli (menit)" />
          <BlankLine label="Waktu rata-rata per pasien Home Visit (menit)" />
          <BlankLine label="Proporsi layanan dalam gedung (%)" />
          <BlankLine label="Proporsi layanan luar gedung (%)" />
        </div>

        <div className="mt-2">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            Tabel Kompetensi Layanan — Pilih status untuk setiap layanan:
          </p>
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 w-1/2">Layanan</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Saat ini berjalan</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Terbatas</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700">Belum berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kompetensiLayanan.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-slate-700">{item}</td>
                  <td className="px-3 py-2 text-center"><div className="w-5 h-5 border-2 border-slate-400 rounded-full mx-auto" /></td>
                  <td className="px-3 py-2 text-center"><div className="w-5 h-5 border-2 border-slate-400 rounded-full mx-auto" /></td>
                  <td className="px-3 py-2 text-center"><div className="w-5 h-5 border-2 border-slate-400 rounded-full mx-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {withSpkklp && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-xs font-semibold text-emerald-800 mb-2">Tambahan khusus Sp.KKLP:</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <BlankLine label="Jumlah hari praktik sebagai Sp.KKLP per minggu" />
              <BlankLine label="Jumlah jam praktik sebagai Sp.KKLP per hari" />
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Apakah Poli Khusus KKLP tersedia?</label>
                <RadioGroup options={['Ya, tersedia', 'Tidak tersedia', 'Dalam proses pembentukan']} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* BAGIAN C: PERSPEKTIF SP.KKLP */}
      <section>
        <SectionHeader color="bg-indigo-600" title="C. Perspektif terhadap Sp.KKLP di Puskesmas / Klinik" />
        <p className="text-xs text-slate-600 mb-3 italic">
          {withSpkklp
            ? 'Skala 1–4: 1=Sangat Tidak Setuju, 2=Tidak Setuju, 3=Setuju, 4=Sangat Setuju'
            : 'Bagaimana harapan Bapak/Ibu terhadap dukungan yang dapat diberikan oleh kompetensi dokter Sp.KKLP?'}
          {' '}Skala 1–4: 1=Sangat Tidak Setuju, 2=Tidak Setuju, 3=Setuju, 4=Sangat Setuju
        </p>

        <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden mb-4">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700 w-3/5">Kegiatan</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700">Skala (1–4)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {relevansiItems.map((item, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 text-slate-700">{item}</td>
                <td className="px-3 py-2"><ScaleBoxes /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {withSpkklp && (
          <>
            <p className="text-xs font-semibold text-slate-700 mb-2 mt-4">A.2 Peran Sp.KKLP dalam Optimalisasi Layanan (Skala 1–4)</p>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden mb-4">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 w-3/5">Pernyataan</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-700">Skala (1–4)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {peranSpkklpItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-slate-700">{item}</td>
                    <td className="px-3 py-2"><ScaleBoxes /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Layanan Dirujuk */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Layanan yang masih sering dirujuk ke RS (centang semua yang sesuai):
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {layananDirujukItems.map((item, idx) => (
              <CheckBox key={idx} label={item} />
            ))}
            <CheckBox label="Lainnya: _______________________________________________" />
          </div>
        </div>

        {/* Layanan Belum Berjalan */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Layanan yang belum berjalan di Puskesmas / Klinik (centang semua yang sesuai):
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {layananBelumBerjalanItems.map((item, idx) => (
              <CheckBox key={idx} label={item} />
            ))}
          </div>
        </div>

        {/* Pengaruh Penurunan Rujukan */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            {withSpkklp
              ? 'Apakah keberadaan Sp.KKLP berpengaruh terhadap penurunan jumlah rujukan pasien ke FKRTL?'
              : 'Apakah Anda berharap kehadiran Sp.KKLP dapat menurunkan jumlah rujukan ke FKRTL?'}
          </p>
          <RadioGroup options={['Ya, sangat berpengaruh', 'Ya, cukup berpengaruh', 'Tidak berpengaruh', 'Tidak tahu']} />
        </div>
      </section>

      {/* BAGIAN D: PRB */}
      <section>
        <SectionHeader color="bg-teal-600" title="D. Program Rujuk Balik (PRB)" />
        <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-3">
          <BlankLine label="Jumlah total peserta PRB" />
          <BlankLine label="Peserta PRB DM" />
          <BlankLine label="Peserta PRB Hipertensi" />
          <BlankLine label="Peserta PRB Jantung" />
          <BlankLine label="Peserta PRB PPOK" />
          <BlankLine label="Peserta PRB Asma" />
          <BlankLine label="Peserta PRB Stroke" />
          <BlankLine label="Peserta PRB Epilepsi" />
          <BlankLine label="Peserta PRB Skizofrenia" />
          <BlankLine label="Peserta PRB SLE" />
          <BlankLine label="Peserta rutin berkunjung (3 bln)" />
          <BlankLine label="Peserta tidak berkunjung (3 bln)" />
          <BlankLine label="Rata-rata rujukan ke FKRTL/bulan" />
        </div>
        <div className="mt-2">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Mekanisme pemantauan PRB (centang semua yang sesuai):</label>
          <div className="grid grid-cols-2 gap-1.5">
            {['Kunjungan langsung (tatap muka)', 'Telepon/SMS', 'WhatsApp / aplikasi', 'Kunjungan rumah (home visit)', 'Belum ada mekanisme khusus'].map(opt => (
              <CheckBox key={opt} label={opt} />
            ))}
          </div>
        </div>
      </section>

      {/* BAGIAN D: PAKET MANFAAT JKN */}
      <section>
        <SectionHeader color="bg-amber-600" title="D. Paket Manfaat JKN (Skala 1–4)" />
        <p className="text-xs text-slate-500 mb-3 italic">Skala 1–4: 1=Sangat Tidak Bermanfaat, 2=Tidak Bermanfaat, 3=Bermanfaat, 4=Sangat Bermanfaat</p>
        <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden mb-4">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700 w-3/4">Layanan JKN</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700">Skala (1–4)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              'Pemantauan kepatuhan terapi pasien AIDS, TB, dan Malaria.',
              'Pelaksanaan Program Rujuk Balik (PRB).',
              'Pengelolaan Hipertensi tanpa komplikasi.',
              'Deprescribing/pengurangan obat pada pasien polifarmasi.',
            ].map((item, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 text-slate-700">{item}</td>
                <td className="px-3 py-2"><ScaleBoxes /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Data Kunjungan Pasien */}
        <p className="text-xs font-semibold text-slate-700 mb-2">Jumlah Kunjungan Pasien (1 Bulan Terakhir):</p>
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {penyakitPasienBulanan.map(p => (
            <BlankLine key={p.id} label={`${p.label}${p.required ? ' *' : ''}`} />
          ))}
        </div>
      </section>

      {/* BAGIAN E: LAYANAN NON-OPTIMAL */}
      <section>
        <SectionHeader color="bg-primary-600" title="E. Layanan yang Belum Optimal / Tidak Terakomodasi JKN" />
        <p className="text-xs text-slate-500 mb-3 italic">Pilih Ya/Tidak/Tidak Tahu dan berikan Skala 1–4 (1=Sangat Tidak Setuju s/d 4=Sangat Setuju)</p>
        <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700 w-2/5">Layanan</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700">Skala (1–4)</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-700">Perlu Masuk JKN?</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              'Pelayanan lifestyle medicine',
              'Pelayanan wellness dan healthy aging',
              'Konsultasi travel medicine',
              'Manajemen pasien geriatri frailty',
              'Precision medicine / konseling genetik dasar',
              'Layanan promotif berbasis keluarga',
            ].map((item, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 text-slate-700">{item}</td>
                <td className="px-3 py-2"><ScaleBoxes /></td>
                <td className="px-3 py-2">
                  <div className="flex gap-1 justify-center">
                    {['Ya', 'Tidak', 'TT'].map(o => (
                      <div key={o} className="flex flex-col items-center gap-0.5">
                        <div className="w-4 h-4 border border-slate-400 rounded" />
                        <span className="text-[10px] text-slate-500">{o}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="border-b border-slate-300 h-5 w-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* BAGIAN F: PENDALAMAN KUALITATIF */}
      <section>
        <SectionHeader color="bg-emerald-600" title="F. Pendalaman Kualitatif (Jawab semua pertanyaan)" />
        <div className="space-y-5">
          {interviewQuestions.map((question, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-800 mb-2 leading-relaxed">{question}</p>
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="border-b border-slate-300 h-6" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tanda tangan */}
      <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8">
        <div>
          <p className="text-xs text-slate-500 mb-1">Tanggal pengisian:</p>
          <div className="border-b border-slate-400 h-6 mb-6" />
          <p className="text-xs text-slate-500 mb-1">Tanda tangan responden:</p>
          <div className="border-b border-slate-400 h-14" />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Nama lengkap & jabatan:</p>
          <div className="border-b border-slate-400 h-6 mb-6" />
          <p className="text-xs text-slate-500 mb-1">Stempel / cap faskes:</p>
          <div className="border border-slate-300 rounded-lg h-14" />
        </div>
      </div>
    </div>
  );
}

// ─── Form khusus Dokter Praktik Mandiri (DPM) ────────────────────────────────
function FormDPMContent() {
  return (
    <div className="space-y-8 text-sm">
      <div className="flex items-start gap-4 mb-6 pb-4 border-b-2 border-slate-300">
        <img src={logoKemenkes} alt="Logo Kemenkes" className="h-16 object-contain" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            Survey Optimalisasi Program JKN di Praktik Mandiri
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kementerian Kesehatan RI — PMK 19 Tahun 2024 — Sp.KKLP
          </p>
          <div className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-300">
            🩺 Formulir C — Khusus Dokter Praktik Mandiri (DPM)
          </div>
        </div>
      </div>

      <section>
        <SectionHeader color="bg-primary-600" title="A. Identitas Responden" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <BlankLine label="Provinsi" />
          <BlankLine label="Kabupaten / Kota" />
          <BlankLine label="Nama Praktik Mandiri" />
          <BlankLine label="Kode Faskes BPJS" />
          <BlankLine label="Nama Responden" />
          <BlankLine label="Tanggal Pengisian" />
        </div>
      </section>

      <section>
        <SectionHeader color="bg-primary-600" title="B. Karakteristik Praktik & Kasus" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-2 text-slate-700">1. Lama praktik dokter saat ini:</p>
              <RadioGroup options={['< 1 tahun', '1–5 tahun', '6–10 tahun', '> 10 tahun']} />
            </div>
            <div>
              <p className="font-semibold mb-2 text-slate-700">2. Rata-rata kunjungan per hari:</p>
              <RadioGroup options={['< 10 pasien', '10–20 pasien', '21–30 pasien', '> 30 pasien']} />
            </div>
            <div>
              <p className="font-semibold mb-2 text-slate-700">3. Sebagian besar pasien yang datang:</p>
              <RadioGroup options={['Anak', 'Dewasa', 'Lansia', 'Campuran semua umur']} />
            </div>
            <div>
              <p className="font-semibold mb-2 text-slate-700">4. Status kepesertaan pasien:</p>
              <RadioGroup options={['Mayoritas JKN', 'Mayoritas umum', 'Seimbang']} />
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">5. Masalah kesehatan paling sering ditangani (pilih max 5):</p>
            <div className="grid grid-cols-3 gap-2">
              {['ISPA', 'Hipertensi', 'Diabetes', 'Nyeri otot/sendi', 'Penyakit kulit', 'Gangguan lambung', 'Kesehatan ibu dan anak', 'Lainnya'].map(k => (
                <CheckBox key={k} label={k} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-2 text-slate-700">6. Persen pasien kasus kronis:</p>
              <RadioGroup options={['< 25%', '25–50%', '51–75%', '> 75%']} />
            </div>
            <div>
              <p className="font-semibold mb-2 text-slate-700">7. Persen pasien kontrol:</p>
              <RadioGroup options={['< 25%', '25–50%', '51–75%', '> 75%']} />
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">8. Apabila pasien dirujuk, indikasi/alasan:</p>
            <div className="border border-slate-300 rounded h-16 w-full" />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader color="bg-blue-600" title="C. Pendekatan Kedokteran Keluarga" />
        <div className="space-y-4">
          <div>
            <p className="font-semibold mb-2 text-slate-700">9. Seberapa sering dokter mengetahui anggota keluarga inti pasien?</p>
            <RadioGroup options={['Tidak pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']} />
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">10. 1 bulan terakhir, pernah menangani {'>1'} anggota keluarga yang sama?</p>
            <RadioGroup options={['Tidak pernah', '1–5 keluarga', '6–10 keluarga', '> 10 keluarga']} />
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">11. Untuk pasien kronis, apakah menanyakan kondisi keluarga lainnya?</p>
            <RadioGroup options={['Tidak pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']} />
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">12. Aspek yang digali selain keluhan fisik:</p>
            <div className="grid grid-cols-3 gap-2">
              {['Pola makan', 'Aktivitas fisik', 'Kondisi pekerjaan', 'Kondisi ekonomi', 'Kondisi psikologis', 'Dukungan keluarga', 'Lingkungan tempat tinggal', 'Tidak ada'].map(a => (
                <CheckBox key={a} label={a} />
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">13. Berapa kali masalah kesehatan pasien dipengaruhi kondisi keluarga?</p>
            <RadioGroup options={['Tidak pernah', '1–5 kasus', '6–10 kasus', '> 10 kasus']} />
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">14. Contoh masalah keluarga yang sering memengaruhi:</p>
            <div className="border-b border-slate-300 h-6 w-full" />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader color="bg-teal-600" title="D. Kontinuitas & Praktik Kedokteran Keluarga" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-2 text-slate-700">15. Memiliki sistem pencatatan pemantauan jangka panjang?</p>
              <RadioGroup options={['Ya', 'Tidak']} />
            </div>
            <div>
              <p className="font-semibold mb-2 text-slate-700">17. Tindak lanjut pasien tidak datang kontrol?</p>
              <RadioGroup options={['Ya', 'Tidak']} />
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">16. Aktif menjadwalkan kunjungan ulang untuk pasien kronis?</p>
            <RadioGroup options={['Tidak pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']} />
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">18. Kegiatan yang pernah dilakukan (1 bulan terakhir):</p>
            <div className="grid grid-cols-2 gap-2">
              {['Edukasi keluarga', 'Konseling hidup sehat', 'Pemantauan penyakit kronis', 'Koordinasi rujukan', 'Home visit', 'Melibatkan keluarga terapi', 'Skrining risiko keluarga', 'Tidak pernah'].map(a => (
                <CheckBox key={a} label={a} />
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">19. Bentuk pelayanan keluarga yang paling sering dilakukan:</p>
            <div className="border border-slate-300 rounded h-12 w-full" />
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">20. Contoh kasus kondisi keluarga memengaruhi penanganan:</p>
            <div className="border border-slate-300 rounded h-16 w-full" />
          </div>
          <div>
            <p className="font-semibold mb-2 text-slate-700">21. Contoh kegiatan pelayanan holistik yang pernah dilakukan:</p>
            <div className="border border-slate-300 rounded h-16 w-full" />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader color="bg-amber-600" title="E. Informasi Poli KKLP & Pelayanan" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <BlankLine label="Sejak kapan poli KKLP beroperasi?" />
          <BlankLine label="Rata-rata jumlah kunjungan per bulan" />
          <BlankLine label="Nama diagnosis apa saja yg ditangani SpKKLP dalam praktek sehari2" />
          <BlankLine label="tindakan apa saja yg dilakukan Sp.KKLP" />
        </div>
        <div className="mt-4">
          <p className="font-semibold mb-2 text-slate-700">Luaran pelayanan (centang semua yang sesuai):</p>
          <div className="grid grid-cols-3 gap-2">
            {['Selesai di Praktik', 'Kontrol berkala di Praktik', 'Home care', 'Paliatif', 'PRB', 'Rujukan ke FKRTL', 'Lainnya'].map(l => (
              <CheckBox key={l} label={l} />
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="font-semibold mb-2 text-slate-700">Apabila pasien dirujuk, indikasi atau alasan rujukan tersebut:</p>
          <div className="border border-slate-300 rounded h-12 w-full" />
        </div>
      </section>

      <section>
        <SectionHeader color="bg-indigo-600" title="F. Data Jumlah Pasien Dilayani (1 Bulan Terakhir)" />
        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          {penyakitPasienBulanan.map(p => (
            <BlankLine key={p.id} label={`${p.label}${p.required ? ' *' : ''}`} />
          ))}
        </div>
    </section>

      {/* BAGIAN G: PENDALAMAN KUALITATIF */}
      <section>
        <SectionHeader color="bg-emerald-600" title="G. Pendalaman Kualitatif (Jawab semua pertanyaan)" />
        <div className="space-y-5">
          {interviewQuestionsWithoutSpkklp.map((question, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-800 mb-2 leading-relaxed">{question}</p>
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="border-b border-slate-300 h-6" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tanda tangan */}
      <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8">
        <div>
          <p className="text-xs text-slate-500 mb-1">Tanggal pengisian:</p>
          <div className="border-b border-slate-400 h-6 mb-6" />
          <p className="text-xs text-slate-500 mb-1">Tanda tangan responden:</p>
          <div className="border-b border-slate-400 h-14" />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Nama lengkap & SIP:</p>
          <div className="border-b border-slate-400 h-6 mb-6" />
          <p className="text-xs text-slate-500 mb-1">Stempel / cap praktik:</p>
          <div className="border border-slate-300 rounded-lg h-14" />
        </div>
      </div>
    </div>
  );
}

// ─── Halaman utama ─────────────────────────────────────────────────────────────

export default function PrintForms() {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Toolbar (tidak tercetak) */}
      <div className="no-print sticky top-0 z-50 bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="font-bold text-lg">Cetak Formulir Survey</h1>
          <p className="text-slate-400 text-sm">Formulir A (dengan Sp.KKLP), Formulir B (tanpa Sp.KKLP) & Formulir C (Dokter Praktik Mandiri)</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
        >
          <Printer className="w-5 h-5" />
          Cetak ke PDF
        </button>
      </div>

      {/* Info (tidak tercetak) */}
      <div className="no-print max-w-5xl mx-auto mt-4 mb-2 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>📋 Panduan:</strong> Halaman ini menampilkan tiga formulir sekaligus:
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li><strong>Formulir A</strong> — untuk faskes yang <strong>MEMILIKI</strong> Sp.KKLP (pertanyaan dengan konteks keberadaan Sp.KKLP)</li>
            <li><strong>Formulir B</strong> — untuk faskes yang <strong>TIDAK MEMILIKI</strong> Sp.KKLP (pertanyaan dengan konteks harapan terhadap Sp.KKLP)</li>
            <li><strong>Formulir C</strong> — khusus untuk isian <strong>Dokter Praktik Mandiri (DPM)</strong></li>
          </ul>
          Klik <strong>"Cetak ke PDF"</strong> untuk mencetak atau menyimpan semua formulir sebagai PDF.
        </div>
      </div>

      {/* FORM A — Dengan Sp.KKLP */}
      <div className="max-w-5xl mx-auto px-4 mb-6 print:max-w-none print:px-0 print:mx-0 print:mb-0">
        <div className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none print:rounded-none print:p-0 print-page-break-inside-avoid">
          <FormContent withSpkklp={true} />
        </div>
      </div>

      {/* Pemisah halaman (akan jadi page break saat cetak) */}
      <div className="print-page-break" />

      {/* FORM B — Tanpa Sp.KKLP */}
      <div className="max-w-5xl mx-auto px-4 pb-10 print:max-w-none print:px-0 print:mx-0 print:pb-0">
        <div className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none print:rounded-none print:p-0 print-page-break-inside-avoid">
          <FormContent withSpkklp={false} />
        </div>
      </div>

      {/* Pemisah halaman (akan jadi page break saat cetak) */}
      <div className="print-page-break" />

      {/* FORM C — Dokter Praktik Mandiri */}
      <div className="max-w-5xl mx-auto px-4 pb-10 print:max-w-none print:px-0 print:mx-0 print:pb-0">
        <div className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none print:rounded-none print:p-0 print-page-break-inside-avoid">
          <FormDPMContent />
        </div>
      </div>
    </div>
  );
}
