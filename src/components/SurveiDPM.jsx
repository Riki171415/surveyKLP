import React, { useState } from 'react';
import { penyakitPasienBulanan } from './SurveyForm';
import ListSelectorModal from './ListSelectorModal';

export default function SurveiDPM({ formData, setFormData, showErrors }) {
  const [selectorConfig, setSelectorConfig] = useState({ isOpen: false, type: 'diagnosa' });
  const data = formData.dpm || {};

  const handleSelectList = (selectedString) => {
    const field = selectorConfig.type === 'diagnosa' ? 'namaDiagnosis' : 'tindakanProsedur';
    const currentValue = data.poliKklp?.[field] || '';
    const newValue = currentValue ? `${currentValue}, ${selectedString}` : selectedString;
    updateField('poliKklp', field, newValue);
  };

  const updateField = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      dpm: {
        ...prev.dpm,
        [category]: {
          ...prev.dpm?.[category],
          [field]: value
        }
      }
    }));
  };

  const updateArrayField = (category, field, value, isChecked) => {
    setFormData(prev => {
      const currentArr = prev.dpm?.[category]?.[field] || [];
      let newArr;
      if (isChecked) {
        newArr = [...currentArr, value];
      } else {
        newArr = currentArr.filter(v => v !== value);
      }
      return {
        ...prev,
        dpm: {
          ...prev.dpm,
          [category]: {
            ...prev.dpm?.[category],
            [field]: newArr
          }
        }
      };
    });
  };

  const RadioGroup = ({ category, field, options, label, required }) => {
    const value = data[category]?.[field] || '';
    const hasError = showErrors && required && !value;
    
    return (
      <div className={`mb-6 p-4 rounded-xl border ${hasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
        <label className="block text-sm font-semibold text-slate-800 mb-3">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {options.map(opt => (
            <label key={opt} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${value === opt ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white hover:border-primary-300'}`}>
              <input type="radio" checked={value === opt} onChange={() => updateField(category, field, opt)} className="hidden" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${value === opt ? 'border-primary-500' : 'border-slate-300'}`}>
                {value === opt && <div className="w-2 h-2 rounded-full bg-primary-500"></div>}
              </div>
              <span className="text-sm font-medium">{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* A. Karakteristik Praktik */}
      <section>
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5">
          <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-800">A. Karakteristik Praktik</h2>
        </div>
        
        <RadioGroup category="karakteristik" field="lamaPraktik" label="1. Lama praktik dokter saat ini:" required options={['< 1 tahun', '1–5 tahun', '6–10 tahun', '> 10 tahun']} />
        <RadioGroup category="karakteristik" field="jumlahKunjungan" label="2. Rata-rata jumlah kunjungan pasien per hari:" required options={['< 10 pasien', '10–20 pasien', '21–30 pasien', '> 30 pasien']} />
        <RadioGroup category="karakteristik" field="kelompokUmur" label="3. Sebagian besar pasien yang datang adalah:" required options={['Anak', 'Dewasa', 'Lansia', 'Campuran semua kelompok umur']} />
        <RadioGroup category="karakteristik" field="statusPeserta" label="4. Status kepesertaan pasien yang dilayani:" required options={['Mayoritas JKN', 'Mayoritas umum', 'Seimbang']} />
      </section>

      {/* B. Gambaran Kasus yang Dilayani */}
      <section>
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5 mt-8">
          <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-800">B. Gambaran Kasus yang Dilayani</h2>
        </div>
        
        <div className={`mb-6 p-4 rounded-xl border ${showErrors && (!data.kasus?.masalahKesehatan || data.kasus?.masalahKesehatan.length === 0) ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-3">5. Masalah kesehatan yang paling sering ditangani dalam satu bulan terakhir (pilih maksimal 5): <span className="text-rose-500">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {['ISPA', 'Hipertensi', 'Diabetes', 'Nyeri otot/sendi', 'Penyakit kulit', 'Gangguan lambung', 'Kesehatan ibu dan anak', 'Lainnya'].map(k => (
              <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={data.kasus?.masalahKesehatan?.includes(k) || false} onChange={(e) => updateArrayField('kasus', 'masalahKesehatan', k, e.target.checked)} className="rounded" />
                {k}
              </label>
            ))}
          </div>
          {data.kasus?.masalahKesehatan?.includes('Lainnya') && (
             <input type="text" placeholder="Sebutkan masalah kesehatan lainnya..." className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" value={data.kasus?.masalahLainnya || ''} onChange={(e) => updateField('kasus', 'masalahLainnya', e.target.value)} />
          )}
        </div>

        <RadioGroup category="kasus" field="persenKronis" label="6. Dari seluruh pasien yang datang, berapa persen yang merupakan kasus penyakit kronis?" required options={['< 25%', '25–50%', '51–75%', '> 75%']} />
        <RadioGroup category="kasus" field="persenKontrol" label="7. Berapa persen pasien yang datang merupakan pasien yang berkunjung kembali (kontrol)?" required options={['< 25%', '25–50%', '51–75%', '> 75%']} />
        
        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.kasus?.alasanRujukan ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-2">8. Apabila pasien di rujuk, Apa indikasi atau alasan rujukan tersebut? <span className="text-rose-500">*</span></label>
          <textarea rows={3} required placeholder="Tuliskan indikasi atau alasan rujukan..." className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y" value={data.kasus?.alasanRujukan || ''} onChange={(e) => updateField('kasus', 'alasanRujukan', e.target.value)}></textarea>
        </div>
      </section>

      {/* C. Pendekatan Kedokteran Keluarga */}
      <section>
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5 mt-8">
          <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-800">C. Pendekatan Kedokteran Keluarga</h2>
        </div>
        
        <h3 className="font-semibold text-slate-700 mb-4 bg-slate-100 p-2 rounded">Mengenal Keluarga Pasien</h3>
        <RadioGroup category="pendekatan" field="tahuKeluargaInti" label="9. Saat menangani pasien, seberapa sering dokter mengetahui anggota keluarga inti pasien?" required options={['Tidak pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']} />
        <RadioGroup category="pendekatan" field="menanganiKeluargaSama" label="10. Dalam satu bulan terakhir, apakah pernah menangani lebih dari satu anggota keluarga yang sama?" required options={['Tidak pernah', '1–5 keluarga', '6–10 keluarga', '> 10 keluarga']} />
        <RadioGroup category="pendekatan" field="tanyaKondisiKeluargaLain" label="11. Ketika pasien memiliki penyakit kronis, apakah dokter menanyakan kondisi kesehatan anggota keluarga lainnya?" required options={['Tidak pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']} />

        <h3 className="font-semibold text-slate-700 mb-4 mt-6 bg-slate-100 p-2 rounded">Pelayanan Holistik</h3>
        <div className={`mb-6 p-4 rounded-xl border ${showErrors && (!data.pendekatan?.aspekDigali || data.pendekatan?.aspekDigali.length === 0) ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-3">12. Selain keluhan fisik, aspek apa yang paling sering digali saat konsultasi? (boleh lebih dari satu): <span className="text-rose-500">*</span></label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {['Pola makan', 'Aktivitas fisik', 'Kondisi pekerjaan', 'Kondisi ekonomi', 'Kondisi psikologis', 'Dukungan keluarga', 'Lingkungan tempat tinggal', 'Tidak ada'].map(a => (
              <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={data.pendekatan?.aspekDigali?.includes(a) || false} onChange={(e) => updateArrayField('pendekatan', 'aspekDigali', a, e.target.checked)} className="rounded" />
                {a}
              </label>
            ))}
          </div>
        </div>
        
        <RadioGroup category="pendekatan" field="pengaruhKeluargaKasus" label="13. Dalam satu bulan terakhir, berapa kali dokter menemukan bahwa masalah kesehatan pasien dipengaruhi kondisi keluarga?" required options={['Tidak pernah', '1–5 kasus', '6–10 kasus', '> 10 kasus']} />
        
        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.pendekatan?.contohMasalahKeluarga ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-3">14. Contoh masalah keluarga yang paling sering memengaruhi kondisi pasien: <span className="text-rose-500">*</span></label>
          <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white" value={data.pendekatan?.contohMasalahKeluarga || ''} onChange={(e) => updateField('pendekatan', 'contohMasalahKeluarga', e.target.value)}>
            <option value="">-- Pilih --</option>
            {['Pola makan keluarga', 'Perawatan lansia', 'Pengasuhan anak', 'Kepatuhan minum obat', 'Konflik keluarga', 'Masalah ekonomi', 'Lainnya'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {data.pendekatan?.contohMasalahKeluarga === 'Lainnya' && (
             <input type="text" placeholder="Sebutkan..." className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" value={data.pendekatan?.contohMasalahLainnya || ''} onChange={(e) => updateField('pendekatan', 'contohMasalahLainnya', e.target.value)} />
          )}
        </div>
      </section>

      {/* D. Kontinuitas Pelayanan */}
      <section>
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5 mt-8">
          <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-800">D. Kontinuitas Pelayanan</h2>
        </div>
        <RadioGroup category="kontinuitas" field="sistemPencatatan" label="15. Apakah dokter memiliki sistem pencatatan riwayat pasien yang memungkinkan pemantauan jangka panjang?" required options={['Ya', 'Tidak']} />
        <RadioGroup category="kontinuitas" field="jadwalkanKunjunganUlang" label="16. Apakah dokter secara aktif menjadwalkan kunjungan ulang untuk pasien kronis?" required options={['Tidak pernah', 'Jarang', 'Kadang-kadang', 'Sering', 'Selalu']} />
        <RadioGroup category="kontinuitas" field="tindakLanjutTidakDatang" label="17. Apakah dokter melakukan tindak lanjut terhadap pasien yang tidak datang kontrol sesuai jadwal?" required options={['Ya', 'Tidak']} />
      </section>

      {/* E. Gambaran Praktik Kedokteran Keluarga */}
      <section>
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5 mt-8">
          <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-800">E. Gambaran Praktik Kedokteran Keluarga</h2>
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${showErrors && (!data.gambaran?.kegiatanDilakukan || data.gambaran?.kegiatanDilakukan.length === 0) ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-3">18. Dalam satu bulan terakhir, kegiatan berikut yang pernah dilakukan (boleh lebih dari satu): <span className="text-rose-500">*</span></label>
          <div className="grid grid-cols-1 gap-2">
            {[
              'Edukasi keluarga pasien', 'Konseling perubahan perilaku hidup sehat', 
              'Pemantauan penyakit kronis secara berkala', 'Koordinasi rujukan pasien', 
              'Home visit/kunjungan rumah', 'Melibatkan keluarga dalam pengambilan keputusan terapi', 
              'Skrining faktor risiko anggota keluarga', 'Tidak pernah melakukan kegiatan di atas'
            ].map(a => (
              <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={data.gambaran?.kegiatanDilakukan?.includes(a) || false} onChange={(e) => updateArrayField('gambaran', 'kegiatanDilakukan', a, e.target.checked)} className="rounded" />
                {a}
              </label>
            ))}
          </div>
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.gambaran?.bentukPelayananKeluarga ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-2">19. Menurut dokter, apa bentuk pelayanan keluarga yang paling sering dilakukan di praktik sehari-hari? <span className="text-rose-500">*</span></label>
          <textarea rows={3} required placeholder="Tuliskan jawaban Anda..." className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y" value={data.gambaran?.bentukPelayananKeluarga || ''} onChange={(e) => updateField('gambaran', 'bentukPelayananKeluarga', e.target.value)}></textarea>
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.gambaran?.contohKasusKeluarga ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-2">20. Ceritakan satu contoh kasus di mana kondisi keluarga memengaruhi penanganan pasien. <span className="text-rose-500">*</span></label>
          <textarea rows={4} required placeholder="Ceritakan pengalamannya..." className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y" value={data.gambaran?.contohKasusKeluarga || ''} onChange={(e) => updateField('gambaran', 'contohKasusKeluarga', e.target.value)}></textarea>
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.gambaran?.contohLayananHolistik ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-2">21. Ceritakan satu contoh kegiatan pelayanan holistik yang pernah dilakukan kepada pasien atau keluarganya. <span className="text-rose-500">*</span></label>
          <textarea rows={4} required placeholder="Ceritakan pengalamannya..." className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y" value={data.gambaran?.contohLayananHolistik || ''} onChange={(e) => updateField('gambaran', 'contohLayananHolistik', e.target.value)}></textarea>
        </div>

      </section>

      {/* Informasi Poli KKLP */}
      <section>
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5 mt-8">
          <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-800">F. Informasi Poli KKLP & Pelayanan</h2>
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.poliKklp?.sejakKapanBeroperasi ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-2">Sejak kapan poli KKLP beroperasi? <span className="text-rose-500">*</span></label>
          <input type="text" required placeholder="Contoh: Januari 2024" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={data.poliKklp?.sejakKapanBeroperasi || ''} onChange={(e) => updateField('poliKklp', 'sejakKapanBeroperasi', e.target.value)} />
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.poliKklp?.rataRataKunjungan ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-2">Rata-rata jumlah kunjungan per bulan <span className="text-rose-500">*</span></label>
          <input type="text" required placeholder="Jumlah" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={data.poliKklp?.rataRataKunjungan || ''} onChange={(e) => updateField('poliKklp', 'rataRataKunjungan', e.target.value)} />
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.poliKklp?.namaDiagnosis ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="block text-sm font-semibold text-slate-800">Nama diagnosis apa saja yg ditangani SpKKLP dalam praktek sehari2 <span className="text-rose-500">*</span></label>
            <button type="button" onClick={() => setSelectorConfig({ isOpen: true, type: 'diagnosa' })} className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors border border-primary-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> Pilih dari Daftar
            </button>
          </div>
          <textarea rows={3} required placeholder="Contoh: DM tipe 2 (E11), Hipertensi esensial (I10)" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y" value={data.poliKklp?.namaDiagnosis || ''} onChange={(e) => updateField('poliKklp', 'namaDiagnosis', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className={`p-4 rounded-xl border ${showErrors && !data.poliKklp?.tindakanProsedur ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-semibold text-slate-800">tindakan apa saja yg dilakukan Sp.KKLP <span className="text-rose-500">*</span></label>
              <button type="button" onClick={() => setSelectorConfig({ isOpen: true, type: 'tindakan' })} className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors border border-primary-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> Pilih dari Daftar
              </button>
            </div>
            <textarea rows={7} required placeholder="Jelaskan..." className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y" value={data.poliKklp?.tindakanProsedur || ''} onChange={(e) => updateField('poliKklp', 'tindakanProsedur', e.target.value)}></textarea>
          </div>

          <div className={`p-4 rounded-xl border ${showErrors && (!data.poliKklp?.luaranPelayanan || data.poliKklp?.luaranPelayanan.length === 0) ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
            <label className="block text-sm font-semibold text-slate-800 mb-3">Luaran pelayanan (centang semua yang sesuai)</label>
            <div className="flex flex-col gap-2">
              {['Selesai di Puskesmas / Klinik', 'Kontrol berkala di Puskesmas / Klinik', 'Home care', 'Paliatif', 'PRB', 'Rujukan ke FKRTL', 'Lainnya'].map(l => (
                <label key={l} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={data.poliKklp?.luaranPelayanan?.includes(l) || false} onChange={(e) => updateArrayField('poliKklp', 'luaranPelayanan', l, e.target.checked)} className="rounded" />
                  {l}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${showErrors && !data.poliKklp?.indikasiRujukan ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100 bg-slate-50'}`}>
          <label className="block text-sm font-semibold text-slate-800 mb-2">Apabila pasien di rujuk, Apa indikasi atau alasan rujukan tersebut? <span className="text-rose-500">*</span></label>
          <textarea rows={3} required placeholder="Jelaskan indikasi atau alasan rujukan..." className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y" value={data.poliKklp?.indikasiRujukan || ''} onChange={(e) => updateField('poliKklp', 'indikasiRujukan', e.target.value)}></textarea>
        </div>
      </section>

      {/* G. Data Pasien Bulanan */}
      <section>
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5 mt-8">
          <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-800">G. Data Jumlah Pasien Dilayani (1 Bulan Terakhir)</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">Mohon isi jumlah pasien yang dilayani di Praktik Mandiri Anda selama 1 bulan terakhir untuk diagnosis penyakit berikut. Hipertensi dan Diabetes Melitus wajib diisi (minimal 0).</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {penyakitPasienBulanan.map((p) => {
            const isRequired = p.required;
            const hasError = showErrors && isRequired && (data.dataPasienBulanan?.[p.id] === undefined || data.dataPasienBulanan?.[p.id] === null || data.dataPasienBulanan?.[p.id] === '');
            return (
              <div key={p.id} className={`p-4 rounded-xl border transition-all ${hasError ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'}`}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {p.label} {isRequired && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 ${hasError ? 'border-rose-400 bg-white' : 'border-slate-200 bg-white'}`}
                  value={data.dataPasienBulanan?.[p.id] !== undefined ? data.dataPasienBulanan?.[p.id] : ''}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      dpm: {
                        ...prev.dpm,
                        dataPasienBulanan: {
                          ...prev.dpm?.dataPasienBulanan,
                          [p.id]: e.target.value
                        }
                      }
                    }));
                  }}
                />
              </div>
            );
          })}
        </div>
      </section>
      {/* List Selector Modal */}
      <ListSelectorModal 
        isOpen={selectorConfig.isOpen} 
        onClose={() => setSelectorConfig({ ...selectorConfig, isOpen: false })} 
        type={selectorConfig.type}
        onSelect={handleSelectList} 
      />
    </div>
  );
}
