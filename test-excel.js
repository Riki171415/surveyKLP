import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabase = createClient('https://kvpslcbhjthwmxgshfoe.supabase.co', 'sb_publishable_368pEsST-qbiSYZFINgNpA_hCsJS9XJ');

// Mock reference data
const penyakitPasienBulanan = [
  { id: 'ispa', label: 'ISPA' },
  { id: 'hipertensi', label: 'Hipertensi' },
  { id: 'dm', label: 'DM' },
  { id: 'diare', label: 'Diare' },
  { id: 'tb', label: 'TB Paru' },
  { id: 'kehamilan', label: 'Kehamilan Normal' }
];

const layananDirujukItems = [
  "Pasien menolak dirawat di faskes primer",
  "Tidak ada tenaga dokter yang kompeten",
  "Alat medis/penunjang tidak tersedia",
  "Obat tidak tersedia",
  "Kondisi pasien gawat darurat",
  "Permintaan rujukan dari pasien/keluarga",
  "Lainnya"
];

const layananBelumBerjalanItems = [
  "Home Care / Kunjungan Rumah",
  "Konseling Gizi / Psikologi",
  "Pemeriksaan Penunjang Lanjutan",
  "Paliatif Care",
  "Lainnya"
];

const kompetensiLayanan = [
  "Manajemen pasien dengan multimorbiditas kompleks", "Pemeriksaan USG Dasar untuk penegakan diagnosis",
  "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)", "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
  "Home Care Klinis dengan intervensi medis komprehensif", "Pelayanan Paliatif Primer (manajemen nyeri/akhir hayat) di rumah",
  "Pemeriksaan Xray untuk penegakan diagnosis"
];

const relevansiItems = [
  "Sp.KKLP sangat diperlukan untuk memimpin tim pelayanan primer di Faskes Anda.",
  "Sp.KKLP meningkatkan kualitas layanan pencegahan dan promotif secara signifikan.",
  "Kehadiran Sp.KKLP mengurangi angka rujukan ke Rumah Sakit (FKRTL)."
];

const peranSpkklpItems = [
  "Sebagai konsultan bagi dokter umum di Faskes Primer.",
  "Sebagai pelaksana langsung untuk kasus-kasus kompleks di FKTP.",
  "Sebagai pendidik klinis (clinical educator) bagi tenaga kesehatan lain di FKTP."
];

const nonOptimalServices = [
  "Home care dan kunjungan rumah",
  "Pelayanan paliatif akhir hayat",
  "Tindakan bedah minor",
  "Pelayanan kesehatan jiwa dasar",
  "Edukasi / Konseling Gizi dan Perilaku"
];

async function testExport() {
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  try {
      const flatData = surveys.map((row) => {
        // Flatten Identitas
        const base = {
          "Timestamp": new Date(row.created_at).toLocaleString('id-ID'),
          "Provinsi": row.provinsi || row.city || '-',
          "Kabupaten/Kota": row.kab_kota || '-',
          "Nama Faskes": row.fktp_name || '-',
          "Kode Faskes": row.kode_faskes || '-',
          "Nama Responden": row.nama_responden || '-',
          "Nomor WA": row.nomor_wa || '-',
          "Jabatan": row.role || '-',
          "Dokter Sp.KKLP": row.doc_kklp || '-'
        };

        // Flatten Survei DPM (A-E)
        if (row.role === 'Dokter Praktik Mandiri' && row.dpm) {
          const d = row.dpm;
          // A
          base["DPM_Lama Praktik"] = d.karakteristik?.lamaPraktik || '-';
          base["DPM_Rata-rata Kunjungan"] = d.karakteristik?.jumlahKunjungan || '-';
          base["DPM_Kelompok Umur"] = d.karakteristik?.kelompokUmur || '-';
          base["DPM_Status Kepesertaan"] = d.karakteristik?.statusPeserta || '-';

          // B
          base["DPM_Masalah Kesehatan"] = Array.isArray(d.kasus?.masalahKesehatan) ? d.kasus.masalahKesehatan.join(', ') : (d.kasus?.masalahKesehatan || '-');
          base["DPM_Masalah Lainnya"] = d.kasus?.masalahLainnya || '-';
          base["DPM_Persen Kasus Kronis"] = d.kasus?.persenKronis || '-';
          base["DPM_Persen Pasien Kontrol"] = d.kasus?.persenKontrol || '-';
          base["DPM_Alasan Rujukan"] = d.kasus?.alasanRujukan || '-';

          // C
          base["DPM_Tahu Keluarga Inti"] = d.pendekatan?.tahuKeluargaInti || '-';
          base["DPM_Menangani Keluarga Yg Sama"] = d.pendekatan?.menanganiKeluargaSama || '-';
          base["DPM_Tanya Kondisi Keluarga Lain"] = d.pendekatan?.tanyaKondisiKeluargaLain || '-';
          base["DPM_Aspek Digali"] = Array.isArray(d.pendekatan?.aspekDigali) ? d.pendekatan.aspekDigali.join(', ') : (d.pendekatan?.aspekDigali || '-');
          base["DPM_Pengaruh Keluarga pd Kasus"] = d.pendekatan?.pengaruhKeluargaKasus || '-';
          base["DPM_Contoh Masalah Keluarga"] = d.pendekatan?.contohMasalahKeluarga || '-';
          base["DPM_Contoh Masalah Lainnya"] = d.pendekatan?.contohMasalahLainnya || '-';

          // D
          base["DPM_Sistem Pencatatan"] = d.kontinuitas?.sistemPencatatan || '-';
          base["DPM_Jadwalkan Kunjungan Ulang"] = d.kontinuitas?.jadwalkanKunjunganUlang || '-';
          base["DPM_Tindak Lanjut Tdk Datang"] = d.kontinuitas?.tindakLanjutTidakDatang || '-';

          // E
          base["DPM_Kegiatan Dilakukan"] = Array.isArray(d.gambaran?.kegiatanDilakukan) ? d.gambaran.kegiatanDilakukan.join(', ') : (d.gambaran?.kegiatanDilakukan || '-');
          base["DPM_Bentuk Pelayanan Keluarga"] = d.gambaran?.bentukPelayananKeluarga || '-';
          base["DPM_Contoh Kasus Keluarga"] = d.gambaran?.contohKasusKeluarga || '-';
          base["DPM_Contoh Layanan Holistik"] = d.gambaran?.contohLayananHolistik || '-';

          // G. Data Pasien Bulanan
          penyakitPasienBulanan.forEach(p => {
            base[`DPM_Pasien_Bulanan_${p.label}`] = d.dataPasienBulanan?.[p.id] !== undefined ? d.dataPasienBulanan[p.id] : '-';
          });
        }

        // Khusus Dokter / SpKKLP
        if (row.role !== 'Dokter Praktik Mandiri' && (row.role === 'Dokter Umum' || row.role === 'Dokter Sp.KKLP')) {
          base["Waktu Rata-rata Poli (menit)"] = row.time_in_poli || '-';
          base["Waktu Rata-rata Home Visit (menit)"] = row.time_home_visit || '-';
          base["Proporsi Dalam Gedung (%)"] = row.prop_in_fktp || '-';
          base["Proporsi Luar Gedung (%)"] = row.prop_out_fktp || '-';

          kompetensiLayanan.forEach((komp, i) => {
            base[`Kompetensi_${i+1}`] = komp;
            base[`Kompetensi_Status_${i+1}`] = row.kompetensi?.[i]?.status || '-';
          });
        }

        if (row.role === 'Dokter Sp.KKLP') {
          base["SpKKLP Berpraktik"] = row.spkklp_berpraktik || '-';
          base["SpKKLP Poli_Sejak"] = row.spkklp_poli?.sejak || '-';
          base["SpKKLP Poli_Kunjungan/hari"] = row.spkklp_poli?.kunjungan || '-';
          base["SpKKLP Poli_Pembiayaan"] = row.spkklp_poli?.pembiayaan || '-';
          base["SpKKLP Poli_Diagnosis"] = row.spkklp_poli?.diagnosis || '-';
          base["SpKKLP Poli_Tindakan"] = row.spkklp_poli?.tindakan || '-';
        }

        if (row.role !== 'Dokter Praktik Mandiri') {
          // Data Pasien Bulanan
          penyakitPasienBulanan.forEach(p => {
            base[`Pasien_Bulanan_${p.label}`] = row.data_pasien_bulanan?.[p.id] !== undefined ? row.data_pasien_bulanan[p.id] : '-';
          });

          // Perspektif
          relevansiItems.forEach((rel, i) => {
            base[`Relevansi_Skala_${i+1}`] = row.relevansi_spkklp?.[i] || '-';
          });
          peranSpkklpItems.forEach((rel, i) => {
            base[`Peran_SpKKLP_Skala_${i+1}`] = row.peran_spkklp?.[i] || '-';
          });
          base["Pengaruh Penurunan Rujukan"] = row.layanan_dirujuk?.pengaruhPenurunanRujukan || '-';
          base["Layanan Sering Dirujuk"] = row.layanan_dirujuk ? Object.keys(row.layanan_dirujuk).filter(k => row.layanan_dirujuk[k] && k !== 'pengaruhPenurunanRujukan').map(k => layananDirujukItems[k] || k).join(', ') : '-';
          base["Alasan Dirujuk"] = row.alasan_dirujuk || '-';
          base["Layanan Belum Berjalan"] = row.layanan_belum_berjalan ? Object.keys(row.layanan_belum_berjalan).filter(k => row.layanan_belum_berjalan[k]).map(k => layananBelumBerjalanItems[k] || k).join(', ') : '-';

          // PRB
          base["PRB_Aktif"] = row.prb?.aktif || '-';
          base["PRB_Rutin"] = row.prb?.rutin || '-';
          base["PRB_Tidak Rutin"] = row.prb?.tidak_rutin || '-';
          base["PRB_Rujukan FKRTL"] = row.prb?.rujukan || '-';
          base["Mekanisme PRB"] = row.prb ? Object.keys(row.prb).filter(k => k.startsWith('mek_') && row.prb[k]).map(k => k.replace('mek_', '')).join(', ') : '-';
          base["PRB_Masalah"] = row.prb?.masalah || '-';
          base["PRB_Edukasi"] = row.prb?.edukasi || '-';

          // Home Care
          base["HC_Melaksanakan"] = row.home_care?.melaksanakan || '-';
          if (row.home_care?.melaksanakan === 'Ya' || row.home_care?.melaksanakan === 'ya') {
            base["HC_Kunjungan/bulan"] = row.home_care?.kunjungan || '-';
            base["HC_Pembiayaan"] = row.home_care?.pembiayaan || '-';
            base["HC_Kasus Terbanyak"] = row.home_care?.kasus || '-';
            base["HC_Masalah"] = row.home_care?.masalah || '-';
            base["HC_Perbaikan"] = row.home_care?.perbaikan || '-';
          }

          // Paliatif
          base["Pal_Melaksanakan"] = row.paliatif?.screening || '-';
          if (row.paliatif?.screening === 'Ya' || row.paliatif?.screening === 'ya') {
            base["Pal_Tenaga"] = row.paliatif?.tenaga || '-';
            base["Pal_Diagnosis"] = row.paliatif?.diagnosis || '-';
            
            const palKondisi = [];
            const palTujuan = [];
            if (row.paliatif) {
               Object.keys(row.paliatif).forEach(k => {
                 if (k.startsWith('kondisi_') && row.paliatif[k]) palKondisi.push(k.replace('kondisi_', ''));
                 if (k.startsWith('tujuan_') && row.paliatif[k]) palTujuan.push(k.replace('tujuan_', ''));
               });
            }
            base["Pal_Kondisi"] = palKondisi.length > 0 ? palKondisi.join(', ') : '-';
            base["Pal_Tujuan"] = palTujuan.length > 0 ? palTujuan.join(', ') : '-';

            base["Pal_Terapi"] = row.paliatif?.terapi || '-';
            base["Pal_Kolaborasi"] = row.paliatif?.kolaborasi || '-';
            base["Pal_Kepatuhan"] = row.paliatif?.kepatuhan || '-';
            base["Pal_Perbaikan"] = row.paliatif?.perbaikan || '-';
          }

          // Non-Optimal
          nonOptimalServices.forEach((nonOpt, i) => {
            base[`NonOpt_${i+1}_MasukJKN`] = row.non_optimal?.[i]?.masukJkn || '-';
            base[`NonOpt_${i+1}_Skala`] = row.non_optimal?.[i]?.skala || '-';
            base[`NonOpt_${i+1}_Catatan`] = row.non_optimal?.[i]?.catatan || '-';
          });
        }

        // Wawancara / Pendalaman (8 Pertanyaan)
        [...Array(8)].forEach((_, i) => {
          base[`Wawancara_Q${i+1}`] = row.wawancara?.[i] || '-';
        });

        // SANITIZE base object to prevent XLSX errors from deeply nested objects
        for (const key in base) {
          if (typeof base[key] === 'object' && base[key] !== null) {
            console.log("Found object at key:", key, base[key]);
            base[key] = JSON.stringify(base[key]);
          }
        }

        return base;
      });

      console.log('Flat data sample:', flatData[0]);

      const worksheet = XLSX.utils.json_to_sheet(flatData);
      console.log('Sheet generated successfully');
    } catch (err) {
      console.error("EXCEL EXPORT ERROR:", err);
    }
}
testExport();
