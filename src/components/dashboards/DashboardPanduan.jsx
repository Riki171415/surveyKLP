import React, { useState } from 'react';
import { BookOpen, Users, Activity, HeartPulse, Stethoscope, AlertTriangle, MessageSquare, Database, Printer, Filter, Home, ShieldAlert, Beaker, Lightbulb, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';

const GUIDES = [
  {
    id: 'profil',
    title: 'Profil',
    icon: Users,
    desc: 'Menampilkan gambaran umum tentang siapa saja responden yang berpartisipasi dan dari mana asal faskes mereka.',
    howToRead: [
      'Angka besar di atas menunjukkan total survei yang masuk.',
      'Grafik Lingkaran (Pie Chart) menunjukkan proporsi (persentase) jabatan responden dan jenis fasilitas kesehatan (Puskesmas vs Klinik).',
      'Peta Batang Horizontal menunjukkan distribusi wilayah (Provinsi) responden. Semakin panjang bar, semakin banyak faskes dari provinsi tersebut.',
      'Gunakan tab ini untuk melihat apakah data Anda cukup mewakili berbagai daerah secara proporsional.'
    ]
  },
  {
    id: 'prb',
    title: 'PRB (Program Rujuk Balik)',
    icon: Activity,
    desc: 'Menganalisis seberapa aktif pasien kronis terdaftar dan patuh melakukan kunjungan rutin di FKTP.',
    howToRead: [
      'Rasio Kepatuhan PRB (hijau muda) menunjukkan persentase pasien terdaftar yang rutin berobat. Angka di atas 50% menunjukkan kepatuhan yang baik.',
      'Rasio Drop-out (merah muda) adalah kebalikan dari kepatuhan, yakni pasien terdaftar yang tidak berkunjung sama sekali.',
      'Grafik Scatter Plot PRB: Sumbu mendatar (X) adalah total pasien terdaftar, sumbu tegak (Y) adalah jumlah yang tidak datang. Semakin titik berada di kanan atas, semakin besar PRB di faskes tersebut namun banyak yang tidak datang.'
    ]
  },
  {
    id: 'mon_prb',
    title: 'Monitoring PRB',
    icon: FileSearch,
    desc: 'Melihat metode yang digunakan FKTP dalam melacak dan memanggil kembali pasien PRB yang tidak datang.',
    howToRead: [
      'Grafik "Cara Faskes Menghubungi Pasien" menunjukkan seberapa proaktif faskes. Faskes yang menggunakan "Telepon/WA" atau "Kunjungan Rumah" lebih proaktif dibanding yang sekadar "Menunggu pasien datang".',
      'Sistem Pencatatan: Menunjukkan apakah faskes sudah digital (SIMPUS/P-Care) atau masih mengandalkan rekam medis manual (kertas).',
      'Tab ini penting untuk mengevaluasi apakah SOP follow-up pasien kronis sudah berjalan dengan baik.'
    ]
  },
  {
    id: 'homecare',
    title: 'Home Care',
    icon: Home,
    desc: 'Evaluasi pelaksanaan pelayanan kesehatan di rumah pasien (kunjungan rumah).',
    howToRead: [
      'Melihat persentase FKTP yang melaksanakan Home Care vs tidak.',
      'Mengetahui tenaga kesehatan mana saja yang paling sering dilibatkan (Dokter, Perawat, Bidan, dsb).',
      'Membaca alasan utama mengapa Home Care sulit dilakukan (misal: kurang SDM, kurang biaya transport). Semakin besar baris, semakin sering kendala itu dikeluhkan.'
    ]
  },
  {
    id: 'paliatif',
    title: 'Paliatif',
    icon: HeartPulse,
    desc: 'Menganalisis kesiapan faskes dalam menangani pasien dengan penyakit terminal (stadium akhir).',
    howToRead: [
      'Sebagian besar faskes mungkin belum memiliki layanan Paliatif yang formal.',
      'Perhatikan grafik "Kolaborasi Paliatif" untuk melihat apakah dokter umum sudah berani berkolaborasi dengan spesialis atau dinas sosial untuk merawat pasien terminal di rumah.'
    ]
  },
  {
    id: 'nonopt',
    title: 'Non-Optimal',
    icon: ShieldAlert,
    desc: 'Mendeteksi dan menampilkan faskes yang memiliki rapor merah pada indikator krusial.',
    howToRead: [
      'Dashboard ini layaknya "Alarm". Ia hanya menampilkan faskes yang Kepatuhan PRB-nya sangat rendah (<20%) ATAU angka pasien yang tidak datang sangat tinggi.',
      'Tabel di bagian bawah secara eksplisit menyebutkan nama faskes, agar Dinas/Kemenkes bisa langsung melakukan intervensi atau pembinaan langsung ke target tersebut.'
    ]
  },
  {
    id: 'spkklp',
    title: 'Peran Sp.KKLP (Spesialis Kedokteran Keluarga Layanan Primer)',
    icon: Stethoscope,
    desc: 'Melihat sebaran ketersediaan Sp.KKLP dan jam kerja mereka di FKTP.',
    howToRead: [
      'Diagram menunjukkan persentase Faskes yang sudah memiliki Sp.KKLP. Saat ini biasanya angkanya masih sangat kecil.',
      'Grafik Alokasi Waktu membandingkan berapa jam dokter bekerja di "Dalam Gedung" (Poli) vs "Luar Gedung" (Home Visit/Penyuluhan).',
      'Idealnya, dokter keluarga memiliki proporsi waktu Luar Gedung yang cukup, tidak hanya duduk di dalam Poli.'
    ]
  },
  {
    id: 'impact_spkklp',
    title: 'Impact Sp.KKLP (Dampak)',
    icon: Activity,
    desc: 'Menganalisis perbedaan performa secara sekilas (visual) antara Faskes dengan Sp.KKLP vs Tanpa Sp.KKLP.',
    howToRead: [
      'Lihat diagram batang "Kepatuhan PRB" yang berdampingan (side-by-side). Batang biru adalah FKTP dengan Sp.KKLP, batang abu-abu adalah tanpa Sp.KKLP.',
      'Jika batang biru selalu lebih tinggi, berarti keberadaan Sp.KKLP berkorelasi positif dengan kepatuhan pasien.',
      'Tabel Rangkuman Komparatif Kinerja memperlihatkan selisih (Delta) secara agregat.'
    ]
  },
  {
    id: 'analisis_lanjut',
    title: 'Analisis Kaidah Statistik (T-Test & PSM)',
    icon: Beaker,
    desc: 'Pembuktian matematis secara absolut (Kausalitas) menggunakan metode Propensity Score Matching (PSM) dan Regresi Multivariat.',
    howToRead: [
      'Distribusi Propensity Score: Lihat area tumpang tindih (overlap). Jika luas, berarti faskes dengan/tanpa Sp.KKLP punya karakteristik wilayah yang cukup mirip untuk diadu (apple-to-apple).',
      'Love Plot: Lihat titik ungu (Sesudah Matching). Jika titik ungu berada di SEBELAH KIRI garis putus-putus merah (angka < 0.1), berarti bias sudah hilang!',
      'Tabel Pengujian: Fokus pada kolom Signifikansi (P-Value). Jika Hijau (Signifikan), berarti terbukti secara keilmuan bahwa Sp.KKLP meningkatkan kualitas layanan. Jika Oranye, berarti belum terbukti (biasanya karena sampel Sp.KKLP masih terlalu sedikit).'
    ]
  },
  {
    id: 'kendala',
    title: 'Kendala JKN',
    icon: AlertTriangle,
    desc: 'Menampilkan analisis kuantitatif dari masalah yang dihadapi responden selama era BPJS/JKN.',
    howToRead: [
      'Perhatikan bar chart horizontal. Kendala teratas (misalnya: Tarif Kapitasi Rendah, Jaringan P-Care Lelet) adalah prioritas tertinggi yang harus diselesaikan regulator.',
      'Cocokkan ini dengan profil responden. Apakah klinik swasta mengeluhkan hal yang berbeda dengan puskesmas?'
    ]
  },
  {
    id: 'kualitatif',
    title: 'Kualitatif (NVIVO/Word Cloud)',
    icon: MessageSquare,
    desc: 'Pemetaan kata-kata yang paling sering muncul dari seluruh jawaban esai (Teks Bebas).',
    howToRead: [
      'Awan Kata (Word Cloud): Semakin besar sebuah kata, semakin sering diketik oleh responden. Misalnya kata "RUJUKAN" sangat besar, berarti banyak masalah di sistem rujukan.',
      'Tabel Frekuensi: Menunjukkan secara pasti berapa kali kata tersebut disebut. Berguna untuk melihat tren keluhan secara cepat.'
    ]
  },
  {
    id: 'eksplorasi_kualitatif',
    title: 'Eksplorasi AI (Thematic Analysis)',
    icon: Lightbulb,
    desc: 'Asisten Peneliti AI (Gemini) yang secara otomatis menyimpulkan ribuan kalimat curhatan responden ke dalam 6 tema kebijakan.',
    howToRead: [
      'Pilih salah satu dari 6 tab di sebelah kiri (misal: "Policy-Practice Gap").',
      'Klik "Jalankan AI" jika laporan belum ada.',
      'Baca hasil rangkuman AI. AI akan memecah curhatan mentah menjadi 1) Pokok Masalah, 2) Kutipan Asli (Verbatim) dari dokter, dan 3) Rekomendasi Kebijakan yang harus diambil Kemenkes/BPJS.'
    ]
  },
  {
    id: 'keluhan_kalimat',
    title: 'Analisis Keluhan (Sentences)',
    icon: Filter,
    desc: 'Membedah kalimat-kalimat keluhan menggunakan AI Clustering (Pengelompokan Otomatis).',
    howToRead: [
      'Jika Word Cloud hanya melihat "Kata", tab ini melihat utuh satu "Kalimat".',
      'AI akan mengelompokkan kalimat mirip (misal: "BPJS error", "P-care lemot", "Sistem rujukan macet") ke dalam satu Klaster "Sistem P-Care / IT".',
      'Anda bisa klik "Tampilkan" untuk membaca persis curhatan responden tersebut tanpa harus membaca di Excel.'
    ]
  },
  {
    id: 'dpm',
    title: 'DPM (Dokter Praktik Mandiri)',
    icon: Printer,
    desc: 'Data spesifik yang hanya diisi oleh Dokter Praktik Mandiri.',
    howToRead: [
      'Menampilkan karakteristik unik praktik solo (Lama buka praktik, Rata-rata pasien per hari).',
      'Diagram akan menunjukkan apakah DPM didominasi dokter muda (baru lulus) atau dokter senior (>10 tahun).'
    ]
  },
  {
    id: 'pasien_bulanan',
    title: 'Pasien Bulanan',
    icon: Users,
    desc: 'Data epidemiologi demografi pasien yang berkunjung (Berapa jumlah pasien hipertensi, DM, TBC, dsb).',
    howToRead: [
      'Grafik batang akan menunjukkan pola penyakit terbanyak.',
      'Umumnya ISPA, Hipertensi, dan Diabetes akan merajai. Tab ini sangat bermanfaat untuk justifikasi pengadaan obat program di Dinas Kesehatan.'
    ]
  }
];

export default function DashboardPanduan({ isPrinting }) {
  const [expandedId, setExpandedId] = useState(GUIDES[0].id);

  return (
    <div className={`space-y-6 animate-fade-in pb-12 ${isPrinting ? 'print:p-0 print:bg-white print:m-0' : ''}`}>
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center relative z-10">
          <BookOpen className="w-7 h-7 mr-3 text-indigo-500" /> Buku Panduan Aplikasi
        </h2>
        <p className="text-slate-500 relative z-10 text-sm md:text-base max-w-4xl">
          Aplikasi ini memiliki 15+ sub-dashboard yang dirancang khusus untuk membedah evaluasi implementasi pelayanan kesehatan secara komprehensif. Gunakan panduan di bawah ini untuk memahami <strong>apa fungsi masing-masing tab</strong> dan <strong>bagaimana cara membaca datanya</strong> untuk pengambilan keputusan.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 text-slate-700 font-semibold border-b pb-4">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          Daftar Panduan Modul (Klik untuk memperluas)
        </div>
        
        <div className="space-y-3">
          {GUIDES.map(guide => {
            const isExpanded = expandedId === guide.id || isPrinting;
            
            return (
              <div 
                key={guide.id} 
                className={`border rounded-2xl transition-all duration-300 ${isExpanded ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}
              >
                <button 
                  onClick={() => !isPrinting && setExpandedId(isExpanded ? null : guide.id)}
                  className="w-full flex items-center justify-between p-4 focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      <guide.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-bold text-base ${isExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>{guide.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{guide.desc}</p>
                    </div>
                  </div>
                  {!isPrinting && (
                    <div className={`p-2 rounded-full transition-transform ${isExpanded ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'text-slate-400'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-5 pt-2 animate-fade-in">
                    <div className="pl-16 pr-4">
                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm text-sm text-slate-600 leading-relaxed mb-4">
                        <strong className="text-indigo-800">Tujuan Modul:</strong> {guide.desc}
                      </div>
                      
                      <h4 className="font-bold text-slate-700 mb-3 flex items-center text-sm">
                        <Info className="w-4 h-4 mr-2 text-amber-500" /> Cara Membaca & Insight yang Diharapkan:
                      </h4>
                      <ul className="space-y-2">
                        {guide.howToRead.map((step, idx) => (
                          <li key={idx} className="flex items-start text-sm text-slate-600 leading-relaxed">
                            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5">{idx + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
