import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Save, CheckCircle, Info } from 'lucide-react';

const jknBenefits = [
  "Pengelolaan Diabetes Melitus tanpa komplikasi",
  "Penyusunan care plan jangka panjang pasien kronik",
  "Manajemen pasien dengan multimorbiditas (DM + hipertensi + dislipidemia)",
  "Pemantauan kepatuhan terapi pasien kronik (penyakit tidak menular)",
  "Pemantauan kepatuhan terapi pasien AIDS, TB, Malaria",
  "Pelaksanaan Program Rujuk Balik (PRB)",
  "Pengelolaan Hipertensi tanpa komplikasi",
  "Deprescribing/pengurangan obat pada pasien polifarmasi",
  "Homecare pasien kronik stabil",
  "Home care pasien dengan keterbatasan mobilitas",
  "Discharge planning pasca rawat inap",
  "Koordinasi rujuk balik FKRTL-FKTP",
  "Pelayanan paliatif primer di rumah",
  "Intervensi keluarga pada pasien kronik",
  "Pembinaan Posbindu PTM",
  "Edukasi kelompok pasien DM dan hipertensi",
  "Monitoring komunitas risiko tinggi",
  "Koordinasi lintas profesi dan kader kesehatan"
];

const nonOptimalServices = [
  "Home care penyakit kronik terintegrasi",
  "Konsultasi keluarga dan family conference",
  "Pelayanan lifestyle medicine",
  "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine",
  "Pelayanan paliatif komunitas",
  "Manajemen pasien geriatri frailty",
  "Precision medicine/konseling genetik dasar",
  "Monitoring pasien kronik berbasis komunitas",
  "Program edukasi kelompok kronik terstruktur",
  "Telemonitoring pasien kronik",
  "Pelayanan transisi FKRTL-FKTP",
  "Konseling kepatuhan pengobatan jangka panjang",
  "Deprescribing dan medication review",
  "Layanan promotif berbasis keluarga"
];

const kompetensiLayanan = [
  "Manajemen pasien dengan multimorbiditas kompleks",
  "Pemeriksaan USG Dasar untuk penegakan diagnosis",
  "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)",
  "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
  "Home Care Klinis dengan intervensi medis komprehensif",
  "Pelayanan Paliatif Primer (manajemen nyeri/akhir hayat) di rumah",
  "Pemeriksaan Xray untuk penegakan diagnosis"
];

const STEPS = [
  { id: 1, title: 'Identitas' },
  { id: 2, title: 'Beban Kerja' },
  { id: 3, title: 'Manfaat JKN' },
  { id: 4, title: 'Layanan Ekstra' }
];

export default function SurveyForm({ isEdit = false }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fktpName: '',
    city: '',
    role: '',
    docUmum: false,
    docGigi: false,
    docKklp: false,
    timeInPoli: '',
    timeHomeVisit: '',
    propInFktp: '',
    propOutFktp: '',
    kompetensi: {},
    jkn: {},
    nonOptimal: {}
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedChange = (category, itemIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [itemIndex]: {
          ...prev[category]?.[itemIndex],
          [field]: value
        }
      }
    }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwDiWEJm0LJwkjYmUDbrt5KLNx42uMERm7TtobhxoYs9ygRnz92cuT9Bwr_C-YJ9qTVwQ/exec';
      
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white rounded-xl shadow-sm border border-slate-200 text-center animate-fade-in mt-10">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Data Berhasil Disimpan</h2>
        <p className="text-slate-500 mb-8 text-lg">Terima kasih atas partisipasi Anda dalam Survey Optimalisasi JKN di FPKTP.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          Isi Survey Baru
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Formulir Survey JKN
        </h1>
        <p className="text-slate-500 mt-2 text-sm max-w-2xl">
          Survey optimalisasi program JKN di FPKTP dalam rangka Transformasi Layanan Primer & Peran Dokter Sp.KKLP.
        </p>
      </div>

      {/* Enterprise Stepper */}
      <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex flex-col items-center relative z-10 w-1/4">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300 shadow-sm ${
                step > s.id 
                  ? 'bg-primary-600 text-white ring-4 ring-primary-50' 
                  : step === s.id 
                    ? 'bg-slate-900 text-white ring-4 ring-slate-100'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              <span className={`mt-2 text-xs font-semibold ${step >= s.id ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="animate-fade-in relative">
          
          <div className="p-6 sm:p-8">
            {/* Step 1: Identitas */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">A. Identitas Responden</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama FKTP/Puskesmas</label>
                    <input required type="text" name="fktpName" value={formData.fktpName} onChange={handleInputChange} placeholder="Misal: Puskesmas Melati" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kabupaten/Kota</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Misal: Kota Bandung" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Jabatan <span className="text-xs text-slate-400 font-normal ml-1">(Pilih salah satu)</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['Kepala Puskesmas', 'Dokter Umum', 'Dokter Sp.KKLP', 'Nakes Lainnya'].map(role => (
                        <label key={role} className={`flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-all ${formData.role === role ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}`}>
                          <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleInputChange} className="hidden" required />
                          <span className="text-sm">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Ketersediaan Dokter</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { name: 'docUmum', label: 'Dokter Umum' },
                        { name: 'docGigi', label: 'Dokter Gigi' },
                        { name: 'docKklp', label: 'Dokter Sp.KKLP' }
                      ].map(doc => (
                        <label key={doc.name} className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${formData[doc.name] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                          <div className={`w-5 h-5 flex items-center justify-center rounded border ${formData[doc.name] ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}>
                            {formData[doc.name] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" name={doc.name} checked={formData[doc.name]} onChange={handleInputChange} className="hidden" />
                          <span className={`text-sm font-medium ${formData[doc.name] ? 'text-emerald-800' : 'text-slate-600'}`}>{doc.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Kompetensi */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">B. Kompetensi Dokter & Beban Kerja</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50 border border-slate-100 rounded-xl mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rata-rata waktu Poli (mnt/pasien)</label>
                    <input type="number" name="timeInPoli" value={formData.timeInPoli} onChange={handleInputChange} placeholder="Contoh: 10" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rata-rata waktu Home Visit (mnt/pasien)</label>
                    <input type="number" name="timeHomeVisit" value={formData.timeHomeVisit} onChange={handleInputChange} placeholder="Contoh: 45" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Beban Dalam Gedung (%)</label>
                    <input type="number" name="propInFktp" value={formData.propInFktp} onChange={handleInputChange} placeholder="Contoh: 70" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Beban Luar Gedung (%)</label>
                    <input type="number" name="propOutFktp" value={formData.propOutFktp} onChange={handleInputChange} placeholder="Contoh: 30" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300" />
                  </div>
                </div>

                <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-4 flex items-start space-x-3 mb-6">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <span className="font-semibold block mb-1">Panduan Pengisian Status:</span>
                    Pilih <strong>Sudah</strong> jika kompetensi layanan pernah/sedang dilakukan. Pilih <strong>Belum</strong> jika belum diterapkan, lalu isikan alasan di kolom kendala.
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700 w-1/2">Jenis Kompetensi / Layanan</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center w-1/5">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 w-3/10">Kendala Utama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kompetensiLayanan.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-4 py-3 text-slate-800 text-xs md:text-sm">{item}</td>
                          <td className="px-4 py-3 text-center">
                            <select 
                              className="px-2 py-1.5 bg-white border border-slate-200 rounded-md w-full focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                              value={formData.kompetensi[idx]?.status || ''}
                              onChange={(e) => handleNestedChange('kompetensi', idx, 'status', e.target.value)}
                            >
                              <option value="">- Pilih -</option>
                              <option value="sudah">Sudah</option>
                              <option value="belum">Belum</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              placeholder="Kendala (jika belum)..." 
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300"
                              disabled={formData.kompetensi[idx]?.status === 'sudah'}
                              value={formData.kompetensi[idx]?.kendala || ''}
                              onChange={(e) => handleNestedChange('kompetensi', idx, 'kendala', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 3: Paket Manfaat JKN */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">C. Paket Manfaat JKN Saat Ini</h2>
                </div>
                
                <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-4 flex items-start space-x-3 mb-6">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <span className="font-semibold block mb-1">Skala Penilaian Kompetensi:</span>
                    <ul className="list-decimal pl-5 space-y-1">
                      <li>Dapat optimal dilakukan dokter umum</li>
                      <li>Dokter umum perlu pelatihan tambahan</li>
                      <li>Lebih baik dengan supervisi/kolaborasi Sp.KKLP</li>
                      <li>Kompetensi utama Sp.KKLP</li>
                    </ul>
                  </div>
                </div>
                
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700 w-1/2">Jenis Layanan JKN</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center w-1/4">Skala (1-4)</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 w-1/4">Catatan Opsional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jknBenefits.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-800 text-xs md:text-sm">{item}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1.5">
                              {[1,2,3,4].map(val => {
                                const isSelected = formData.jkn[idx]?.skala === val.toString();
                                return (
                                  <label key={val} className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded text-xs font-semibold border transition-all ${isSelected ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>
                                    <input 
                                      type="radio" 
                                      className="hidden" 
                                      name={`jkn-${idx}`} 
                                      value={val}
                                      checked={isSelected}
                                      onChange={(e) => handleNestedChange('jkn', idx, 'skala', e.target.value)}
                                    />
                                    {val}
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              placeholder="Catatan (opsional)..." 
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300"
                              value={formData.jkn[idx]?.catatan || ''}
                              onChange={(e) => handleNestedChange('jkn', idx, 'catatan', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 4: Layanan Belum Optimal */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">D. Layanan yang Belum Optimal / Tidak Terakomodasi</h2>
                </div>

                <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-4 flex items-start space-x-3 mb-6">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <span className="font-semibold block mb-1">Panduan Penilaian:</span>
                    Pilih <strong>Ya/Tidak</strong> apakah layanan perlu diakomodasi ke JKN. Berikan nilai <strong>Skala (1-4)</strong> kompetensi seperti panduan di halaman sebelumnya.
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700 w-2/5">Layanan Belum Optimal</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center w-1/6">Masuk JKN?</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center w-1/5">Skala (1-4)</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 w-1/4">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {nonOptimalServices.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-800 text-xs md:text-sm">{item}</td>
                          <td className="px-4 py-3 text-center">
                            <select 
                              className="px-2 py-1.5 bg-white border border-slate-200 rounded-md w-full focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                              value={formData.nonOptimal[idx]?.masukJkn || ''}
                              onChange={(e) => handleNestedChange('nonOptimal', idx, 'masukJkn', e.target.value)}
                            >
                              <option value="">-</option>
                              <option value="Ya">Ya</option>
                              <option value="Tidak">Tidak</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              {[1,2,3,4].map(val => {
                                const isSelected = formData.nonOptimal[idx]?.skala === val.toString();
                                return (
                                  <label key={val} className={`cursor-pointer w-7 h-7 flex items-center justify-center rounded text-xs font-semibold border transition-all ${isSelected ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>
                                    <input 
                                      type="radio" 
                                      className="hidden" 
                                      name={`nonopt-${idx}`} 
                                      value={val}
                                      checked={isSelected}
                                      onChange={(e) => handleNestedChange('nonOptimal', idx, 'skala', e.target.value)}
                                    />
                                    {val}
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              placeholder="Penjelasan..." 
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300"
                              value={formData.nonOptimal[idx]?.catatan || ''}
                              onChange={(e) => handleNestedChange('nonOptimal', idx, 'catatan', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <button 
              type="button" 
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm'}`}
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" /> Sebelumnya
            </button>
            
            {step < 4 ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="flex items-center px-6 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
              >
                Selanjutnya <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex items-center px-6 py-2 text-white rounded-lg font-medium text-sm transition-all shadow-sm ${isSubmitting ? 'bg-slate-400 cursor-wait' : 'bg-primary-600 hover:bg-primary-700'}`}
              >
                {isSubmitting ? 'Memproses...' : 'Simpan Data'}
                {!isSubmitting && <Save className="w-4 h-4 ml-2" />}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
