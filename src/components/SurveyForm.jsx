import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Save, CheckCircle } from 'lucide-react';

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
    console.log("Submitting:", formData);
    
    try {
      // TODO: Replace with actual Google Apps Script Web App URL
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_PLACEHOLDER/exec';
      
      // Using no-cors mode for Google Apps Script Web App POST to avoid CORS issues on frontend
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
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-sm text-center animate-fade-in">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Terima Kasih!</h2>
        <p className="text-slate-600 mb-6">Survey Anda telah berhasil disimpan.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          Isi Survey Baru
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Survey Optimalisasi JKN di FPKTP
        </h1>
        <p className="text-slate-500 mt-2">
          Transformasi Layanan Primer & Peran Dokter Sp.KKLP
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {s}
            </div>
            {s < 4 && (
              <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-primary-600' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
        {/* Step 1: Identitas */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">A. Identitas Responden</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama FKTP/Puskesmas</label>
                <input required type="text" name="fktpName" value={formData.fktpName} onChange={handleInputChange} placeholder="Misal: Puskesmas Melati" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kabupaten/Kota</label>
                <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Misal: Kota Bandung" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition placeholder:text-slate-300" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Jabatan <span className="text-xs text-slate-400 font-normal ml-1">(Pilih posisi Anda saat ini)</span></label>
                <div className="flex gap-4 flex-wrap">
                  {['Kepala Puskesmas', 'Dokter Umum', 'Dokter Sp.KKLP', 'Tenaga Kesehatan Lainnya'].map(role => (
                    <label key={role} className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleInputChange} className="text-primary-600 focus:ring-primary-500" required />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Ketersediaan Dokter</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                    <input type="checkbox" name="docUmum" checked={formData.docUmum} onChange={handleInputChange} className="rounded text-primary-600 focus:ring-primary-500 w-5 h-5" />
                    <span>Dokter Umum</span>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                    <input type="checkbox" name="docGigi" checked={formData.docGigi} onChange={handleInputChange} className="rounded text-primary-600 focus:ring-primary-500 w-5 h-5" />
                    <span>Dokter Gigi</span>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                    <input type="checkbox" name="docKklp" checked={formData.docKklp} onChange={handleInputChange} className="rounded text-primary-600 focus:ring-primary-500 w-5 h-5" />
                    <span>Dokter Sp.KKLP</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Kompetensi */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">B. Kompetensi Dokter & Beban Kerja</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rata-rata waktu Poli (Menit/pasien)</label>
                <input type="number" name="timeInPoli" value={formData.timeInPoli} onChange={handleInputChange} placeholder="Contoh: 10" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rata-rata waktu Home Visit (Menit/pasien)</label>
                <input type="number" name="timeHomeVisit" value={formData.timeHomeVisit} onChange={handleInputChange} placeholder="Contoh: 45" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proporsi Beban Dalam Gedung (%)</label>
                <input type="number" name="propInFktp" value={formData.propInFktp} onChange={handleInputChange} placeholder="Contoh: 70" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proporsi Beban Luar Gedung (%)</label>
                <input type="number" name="propOutFktp" value={formData.propOutFktp} onChange={handleInputChange} placeholder="Contoh: 30" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300" />
                <p className="text-xs text-slate-500 mt-1">Total persentase dalam dan luar gedung harus 100%.</p>
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
              <p className="font-semibold mb-1">Panduan Pengisian Status:</p>
              <ul className="list-disc pl-5">
                <li>Pilih <strong>"Sudah"</strong> jika kompetensi layanan pernah atau sedang dilakukan di fasilitas Anda.</li>
                <li>Pilih <strong>"Belum"</strong> jika belum diterapkan, lalu isikan alasan di kolom kendala.</li>
              </ul>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mt-4">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Jenis Kompetensi / Layanan</th>
                    <th className="p-3 w-32 text-center">Status</th>
                    <th className="p-3 rounded-tr-lg">Kendala Utama (Jika Belum)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kompetensiLayanan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">{item}</td>
                      <td className="p-3 text-center">
                        <select 
                          className="px-2 py-1 border rounded w-full"
                          value={formData.kompetensi[idx]?.status || ''}
                          onChange={(e) => handleNestedChange('kompetensi', idx, 'status', e.target.value)}
                        >
                          <option value="">- Pilih -</option>
                          <option value="sudah">Sudah</option>
                          <option value="belum">Belum</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Kendala..." 
                          className="w-full px-3 py-1 border rounded"
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
            <h2 className="text-xl font-semibold border-b pb-2">C. Paket Manfaat JKN Saat Ini</h2>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
              <p className="font-semibold mb-1">Skala Penilaian Kompetensi:</p>
              <ul className="list-disc pl-5">
                <li>1 = Dapat optimal dilakukan dokter umum</li>
                <li>2 = Dokter umum perlu pelatihan tambahan</li>
                <li>3 = Lebih baik dengan supervisi/kolaborasi Sp.KKLP</li>
                <li>4 = Kompetensi utama Sp.KKLP</li>
              </ul>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mt-4">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Jenis Layanan JKN</th>
                    <th className="p-3 w-40 text-center">Skala (1-4)</th>
                    <th className="p-3 rounded-tr-lg">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jknBenefits.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">{item}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          {[1,2,3,4].map(val => (
                            <label key={val} className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded-full border ${formData.jkn[idx]?.skala === val.toString() ? 'bg-primary-600 text-white border-primary-600' : 'bg-white hover:bg-slate-100'}`}>
                              <input 
                                type="radio" 
                                className="hidden" 
                                name={`jkn-${idx}`} 
                                value={val}
                                checked={formData.jkn[idx]?.skala === val.toString()}
                                onChange={(e) => handleNestedChange('jkn', idx, 'skala', e.target.value)}
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Catatan..." 
                          className="w-full px-3 py-1 border rounded"
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
            <h2 className="text-xl font-semibold border-b pb-2">D. Layanan yang Belum Optimal / Tidak Terakomodasi</h2>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
              <p className="font-semibold mb-1">Panduan Penilaian:</p>
              <ul className="list-disc pl-5">
                <li><strong>Masuk JKN:</strong> Tentukan apakah layanan ini menurut Anda perlu diakomodasi ke dalam JKN (Ya/Tidak).</li>
                <li><strong>Skala Kompetensi:</strong> Berikan nilai (1-4) seperti panduan pada langkah sebelumnya.</li>
              </ul>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mt-4">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Layanan Belum Optimal</th>
                    <th className="p-3 w-32 text-center">Masuk JKN?</th>
                    <th className="p-3 w-40 text-center">Skala (1-4)</th>
                    <th className="p-3 rounded-tr-lg">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {nonOptimalServices.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">{item}</td>
                      <td className="p-3 text-center">
                        <select 
                          className="px-2 py-1 border rounded w-full"
                          value={formData.nonOptimal[idx]?.masukJkn || ''}
                          onChange={(e) => handleNestedChange('nonOptimal', idx, 'masukJkn', e.target.value)}
                        >
                          <option value="">-</option>
                          <option value="Ya">Ya</option>
                          <option value="Tidak">Tidak</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          {[1,2,3,4].map(val => (
                            <label key={val} className={`cursor-pointer w-7 h-7 text-xs flex items-center justify-center rounded-full border ${formData.nonOptimal[idx]?.skala === val.toString() ? 'bg-primary-600 text-white border-primary-600' : 'bg-white hover:bg-slate-100'}`}>
                              <input 
                                type="radio" 
                                className="hidden" 
                                name={`nonopt-${idx}`} 
                                value={val}
                                checked={formData.nonOptimal[idx]?.skala === val.toString()}
                                onChange={(e) => handleNestedChange('nonOptimal', idx, 'skala', e.target.value)}
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <input 
                          type="text" 
                          placeholder="Catatan..." 
                          className="w-full px-3 py-1 border rounded"
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

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button 
            type="button" 
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${step === 1 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Sebelumnya
          </button>
          
          {step < 4 ? (
            <button 
              type="button" 
              onClick={nextStep}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Selanjutnya <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex items-center px-6 py-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg font-medium transition`}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Survey'}
              {!isSubmitting && <Save className="w-5 h-5 ml-2" />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
