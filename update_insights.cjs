const fs = require('fs');

// 1. Update KokpitKemenkes.jsx
let kokpit = fs.readFileSync('./src/components/KokpitKemenkes.jsx', 'utf8');

const insightPanelKokpit = `
      {/* EXECUTIVE INSIGHT PANEL */}
      <div className="mt-8 bg-white/90 border border-primary-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
          <Layers className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-wide uppercase">Executive Insight: Peta Jalan Kebijakan Sp.KKLP</h2>
        </div>
        
        <div className="space-y-6 text-slate-600 leading-relaxed text-sm md:text-base">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0 font-bold">1</div>
            <div>
              <h4 className="text-slate-800 font-bold mb-1">Paradoks Ketersediaan vs Kebutuhan</h4>
              <p>Meskipun sebagian besar FKTP belum memiliki Sp.KKLP, data <span className="text-primary-300 font-semibold">Gap Persepsi</span> menunjukkan bahwa institusi primer (Kepala PKM & Dokter Umum) memberikan skor relevansi yang sangat tinggi. Pasar layanan primer sudah siap; urgensi saat ini bergeser pada percepatan distribusi tenaga medis.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold">2</div>
            <div>
              <h4 className="text-slate-800 font-bold mb-1">Kebocoran Gatekeeper pada Kasus Sederhana</h4>
              <p>Top rujukan primer masih didominasi oleh kasus PTM tanpa komplikasi dan bedah minor. Ini membuktikan bahwa <span className="text-rose-300 font-semibold">fungsi gatekeeper JKN belum optimal</span>. Kehadiran Sp.KKLP di titik-titik lemah (provinsi merah) dapat mencegah triliunan rupiah bocor ke FKRTL.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">3</div>
            <div>
              <h4 className="text-slate-800 font-bold mb-1">"Blind Spot" Pembiayaan Non-Kapitasi</h4>
              <p>Suara lapangan dan usulan prioritas secara masif menuntut diakomodasinya layanan <span className="text-amber-300 font-semibold">Home Care dan Paliatif</span>. Penempatan Sp.KKLP wajib dibarengi perombakan skema insentif JKN yang mengapresiasi upaya preventif & proaktif, bukan sekadar kuratif reaktif.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> REKOMENDASI TINDAKAN (30 HARI KEDEPAN)</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-emerald-100/80 marker:text-emerald-500">
            <li>Gunakan data usulan prioritas untuk advokasi revisi PMK (Paket Manfaat JKN).</li>
            <li>Fokuskan beasiswa afirmasi Sp.KKLP pada 5 Provinsi terbawah di Peta Kesiapan yang rujukannya masih tinggi.</li>
            <li>Lakukan sosialisasi ke Kepala FKTP agar Sp.KKLP dimanfaatkan sebagai <em className="text-slate-800">Manager of Care</em> komunitas.</li>
          </ul>
        </div>
      </div>`;

// Remove the insight panel from the bottom of KokpitKemenkes.jsx
// It was placed right before `    </div>\n  );\n}`
// Use a regex or simple replace
let kokpitNew = kokpit.replace(insightPanelKokpit, '');

// Inject it back into the 'utama' tab only
const utamaEndAnchor = `            </div>
          </div>
        </>
      )}`;

kokpitNew = kokpitNew.replace(utamaEndAnchor, `            </div>
          </div>
${insightPanelKokpit}
        </>
      )}`);

fs.writeFileSync('./src/components/KokpitKemenkes.jsx', kokpitNew, 'utf8');

// 2. Update DashboardEksekutif.jsx
let eksekutif = fs.readFileSync('./src/components/dashboards/DashboardEksekutif.jsx', 'utf8');

const dynamicInsightComponent = `
const ExecutiveInsight = ({ tab }) => {
  const insights = {
    overview: {
      title: "Executive Insight: Profil Kesiapan Fasilitas Primer",
      iconColor: "text-blue-500",
      bgLight: "bg-blue-50",
      points: [
        { title: "Dominasi Puskesmas", desc: "Sebagian besar data survei diisi oleh Puskesmas, yang merepresentasikan ujung tombak layanan primer pemerintah." },
        { title: "Kesenjangan Distribusi", desc: "Terdapat gap yang signifikan antara ketersediaan Sp.KKLP di kota besar dibandingkan daerah rural. Ini mengindikasikan perlunya intervensi penempatan secara khusus." },
        { title: "Potensi Skala Nasional", desc: "Jika 10% saja dari FKTP yang belum memiliki Sp.KKLP ini segera dipenuhi, kapasitas promotif-preventif JKN akan meningkat tajam." }
      ]
    },
    ketersediaan: {
      title: "Executive Insight: Optimalisasi & Perluasan JKN",
      iconColor: "text-amber-500",
      bgLight: "bg-amber-50",
      points: [
        { title: "Validasi Layanan Eksisting", desc: "Program PRB dan pemantauan penyakit kronis dinilai sebagai layanan JKN yang paling dirasakan manfaatnya saat ini." },
        { title: "Urgensi Pembiayaan Baru", desc: "Layanan Lifestyle Medicine dan Promotif Berbasis Keluarga menduduki peringkat teratas usulan layanan yang HARUS dibiayai JKN." },
        { title: "Transisi Paradigma", desc: "Sistem JKN perlu segera bertransisi dari 'Kuratif-Sentris' menjadi 'Preventif-Proaktif' dengan memberikan insentif khusus bagi FKTP yang aktif melakukan home care." }
      ]
    },
    perbandingan: {
      title: "Executive Insight: Dampak Nyata Sp.KKLP di Lapangan",
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
      points: [
        { title: "Keunggulan Klinis", desc: "FKTP dengan Sp.KKLP terbukti memiliki skor penanganan multimorbiditas tanpa rujukan yang jauh lebih superior dibanding FKTP tanpa Sp.KKLP." },
        { title: "Waktu Konsultasi Efektif", desc: "Meskipun memiliki beban manajerial, dokter Sp.KKLP secara konsisten memberikan waktu konsultasi yang lebih mendalam dan komprehensif bagi pasien." },
        { title: "Efisiensi Sistem", desc: "Kemampuan menyelesaikan masalah kompleks di FKTP secara langsung berdampak pada penurunan angka rujukan yang tidak perlu ke rumah sakit." }
      ]
    },
    rujukan: {
      title: "Executive Insight: Menutup Kebocoran Rujukan Primer",
      iconColor: "text-rose-500",
      bgLight: "bg-rose-50",
      points: [
        { title: "Red Flag Rujukan PTM", desc: "Kasus Penyakit Tidak Menular (PTM) tanpa komplikasi masih mendominasi rujukan, mengindikasikan fungsi gatekeeper belum optimal di banyak daerah." },
        { title: "Tantangan Bedah Minor", desc: "Tingginya rujukan bedah minor menyoroti kurangnya ketersediaan alat medis dasar atau insentif tindakan bagi dokter di FKTP." },
        { title: "Rekomendasi Kebijakan", desc: "Wajibkan pendampingan klinis oleh Sp.KKLP di puskesmas dengan rasio rujukan PTM tertinggi untuk menekan beban klaim BPJS secara drastis." }
      ]
    },
    hambatan: {
      title: "Executive Insight: Hambatan Operasional & Finansial",
      iconColor: "text-orange-500",
      bgLight: "bg-orange-50",
      points: [
        { title: "Krisis SDM & Sarana", desc: "Kurangnya SDM pendukung dan sarana prasarana menjadi batu sandungan utama bagi dokter Sp.KKLP untuk mengimplementasikan keilmuannya secara utuh." },
        { title: "Regulasi Insentif", desc: "Tidak adanya skema kapitasi atau jasa medis spesifik untuk Sp.KKLP menurunkan motivasi dan menghambat distribusi spesialis ke daerah." },
        { title: "Solusi Cepat", desc: "Kemenkes perlu berkoordinasi dengan BPJS untuk menerbitkan regulasi insentif 'Top-Up' berbasis performa kualitas layanan preventif." }
      ]
    },
    kualitatif: {
      title: "Executive Insight: Aspirasi & Sentimen Akar Rumput",
      iconColor: "text-indigo-500",
      bgLight: "bg-indigo-50",
      points: [
        { title: "Kebingungan Kewenangan", desc: "Banyak nakes di puskesmas masih bingung membedakan kewenangan klinis antara dokter umum dan Sp.KKLP. Perlu pedoman klinis (PNPK) yang tegas." },
        { title: "Tuntutan Realistis", desc: "Permintaan terbanyak di lapangan bukanlah insentif mewah, melainkan kejelasan regulasi JKN dan ketersediaan obat kronis PRB yang sering kosong." },
        { title: "Moral Kerja", desc: "Dukungan moril dari Dinas Kesehatan sangat dibutuhkan agar program kedokteran keluarga tidak dilihat sebagai beban administratif tambahan semata." }
      ]
    }
  };

  const current = insights[tab];
  if (!current) return null;

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg">
      <div className={\`absolute top-0 right-0 w-64 h-64 \${current.bgLight} rounded-full blur-3xl -z-10\`}></div>
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-wide uppercase">{current.title}</h2>
      </div>
      
      <div className="space-y-6 text-slate-600 leading-relaxed text-sm md:text-base">
        {current.points.map((pt, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className={\`w-8 h-8 rounded-full \${current.bgLight} \${current.iconColor} flex items-center justify-center shrink-0 font-bold\`}>{i+1}</div>
            <div>
              <h4 className="text-slate-800 font-bold mb-1">{pt.title}</h4>
              <p>{pt.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
`;

// Insert the component before the DashboardEksekutif function
let eksekutifNew = eksekutif.replace('export default function DashboardEksekutif', dynamicInsightComponent + '\nexport default function DashboardEksekutif');

// Insert the rendering of ExecutiveInsight at the end of the DashboardEksekutif return block
const eksekutifEndAnchor = `      </div>
    </div>
  );
}`;

eksekutifNew = eksekutifNew.replace(eksekutifEndAnchor, `        <ExecutiveInsight tab={activeTab} />
      </div>
    </div>
  );
}`);

fs.writeFileSync('./src/components/dashboards/DashboardEksekutif.jsx', eksekutifNew, 'utf8');

console.log("Insights updated!");
