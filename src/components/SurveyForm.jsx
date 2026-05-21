import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Save, CheckCircle, Info } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import faskesMapping from '../data/faskesMapping.json';

const jknBenefits = [
  "Pengelolaan Diabetes Melitus tanpa komplikasi", "Penyusunan care plan jangka panjang pasien kronik",
  "Manajemen pasien dengan multimorbiditas (DM + hipertensi + dislipidemia)", "Pemantauan kepatuhan terapi pasien kronik (penyakit tidak menular)",
  "Pemantauan kepatuhan terapi pasien AIDS, TB, Malaria", "Pelaksanaan Program Rujuk Balik (PRB)",
  "Pengelolaan Hipertensi tanpa komplikasi", "Deprescribing/pengurangan obat pada pasien polifarmasi",
  "Homecare pasien kronik stabil", "Home care pasien dengan keterbatasan mobilitas",
  "Discharge planning pasca rawat inap", "Koordinasi rujuk balik FKRTL-FKTP",
  "Pelayanan paliatif primer di rumah", "Intervensi keluarga pada pasien kronik",
  "Pembinaan Posbindu PTM", "Edukasi kelompok pasien DM dan hipertensi",
  "Monitoring komunitas risiko tinggi", "Koordinasi lintas profesi dan kader kesehatan"
];

const nonOptimalServices = [
  "Home care penyakit kronik terintegrasi", "Konsultasi keluarga dan family conference",
  "Pelayanan lifestyle medicine", "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine", "Pelayanan paliatif komunitas",
  "Manajemen pasien geriatri frailty", "Precision medicine/konseling genetik dasar",
  "Monitoring pasien kronik berbasis komunitas", "Program edukasi kelompok kronik terstruktur",
  "Telemonitoring pasien kronik", "Pelayanan transisi FKRTL-FKTP",
  "Konseling kepatuhan pengobatan jangka panjang", "Deprescribing dan medication review",
  "Layanan promotif berbasis keluarga"
];

const kompetensiLayanan = [
  "Manajemen pasien dengan multimorbiditas kompleks", "Pemeriksaan USG Dasar untuk penegakan diagnosis",
  "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)", "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
  "Home Care Klinis dengan intervensi medis komprehensif", "Pelayanan Paliatif Primer (manajemen nyeri/akhir hayat) di rumah",
  "Pemeriksaan Xray untuk penegakan diagnosis"
];

const interviewQuestions = [
  "1. Bagaimana pendapat anda terkait layanan penyakit kronik? (probing terkait apakah perlu mendapatkan kapitasi berbasis kinerja untuk kompetensi Sp.KKLP)",
  "2. Bagaimana implementasi home visit dan home care saat ini? apakah perlu menjadi manfaat non-kapitasi JKN? Atau ada opsi fund channeling lain?",
  "3. Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN? Atau ada opsi fund channeling lain? (probing: isi aktivitasnya apa saja)",
  "4. Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN FKTP?",
  "5. Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB dengan adanya sp.KKLP?",
  "6. Menurut anda apakah ada perubahan yang dirasakan oleh faskes dengan adanya Sp.KKLP?",
  "7. Menurut anda apakah FKTP dengan dokter Sp.KKLP perlu mendapatkan insentif tambahan? Jelaskan alasannya"
];

export default function SurveyForm({ isEdit = false, isInterview = false }) {
  const [step, setStep] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();
  
  const STEPS = [
    { id: 1, title: 'Identitas' },
    { id: 2, title: 'Beban Kerja' },
    { id: 3, title: 'Manfaat JKN' },
    { id: 4, title: 'Layanan Ekstra' },
    ...(isInterview ? [{ id: 5, title: 'Wawancara' }] : [])
  ];

  const totalSteps = isInterview ? 5 : 4;

  const { user } = useAuth();
  const [formData, setFormData] = useState({
    id: null,
    fktpName: '', city: '', role: '',
    docUmum: false, docGigi: false, docKklp: false,
    timeInPoli: '', timeHomeVisit: '', propInFktp: '', propOutFktp: '',
    kompetensi: {}, jkn: {}, nonOptimal: {}, wawancara: {}
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    // 1. Mode Wawancara (Tim Survey dari Halaman List)
    if (isInterview && location.state?.surveyData) {
      const data = location.state.surveyData;
      setFormData({
        id: data.id,
        fktpName: data.fktp_name || '',
        city: data.city || '',
        role: data.role || '',
        docUmum: data.doc_umum || false,
        docGigi: data.doc_gigi || false,
        docKklp: data.doc_kklp || false,
        timeInPoli: data.time_in_poli || '',
        timeHomeVisit: data.time_home_visit || '',
        propInFktp: data.prop_in_fktp || '',
        propOutFktp: data.prop_out_fktp || '',
        kompetensi: data.kompetensi || {},
        jkn: data.jkn || {},
        nonOptimal: data.non_optimal || {},
        wawancara: data.wawancara || {}
      });
      return;
    }

    // 2. Mode Puskesmas (Auto-fill & Cek Data Lama)
    if (!isInterview && user && user.role === 'puskesmas') {
      const pkmInfo = faskesMapping[user.username];
      
      const checkExistingData = async (namaFaskes, provinsi) => {
        setLoadingData(true);
        try {
          const { data, error } = await supabase
            .from('surveys')
            .select('*')
            .eq('fktp_name', namaFaskes)
            .single();

          if (data) {
            // Data sudah ada, tampilkan isiannya
            setFormData({
              id: data.id,
              fktpName: data.fktp_name || '',
              city: data.city || '',
              role: data.role || '',
              docUmum: data.doc_umum || false,
              docGigi: data.doc_gigi || false,
              docKklp: data.doc_kklp || false,
              timeInPoli: data.time_in_poli || '',
              timeHomeVisit: data.time_home_visit || '',
              propInFktp: data.prop_in_fktp || '',
              propOutFktp: data.prop_out_fktp || '',
              kompetensi: data.kompetensi || {},
              jkn: data.jkn || {},
              nonOptimal: data.non_optimal || {},
              wawancara: data.wawancara || {}
            });
            setHasExistingData(true);
          } else {
            // Belum ada data, set nama dan provinsi dari mapping
            setFormData(prev => ({
              ...prev,
              fktpName: namaFaskes,
              city: provinsi
            }));
          }
        } catch (err) {
          // Normal jika single() tidak menemukan data
          setFormData(prev => ({
            ...prev,
            fktpName: namaFaskes,
            city: provinsi
          }));
        } finally {
          setLoadingData(false);
        }
      };

      if (pkmInfo) {
        checkExistingData(pkmInfo.nama, pkmInfo.provinsi);
      }
    }
  }, [isInterview, location.state, user]);

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

  const handleWawancaraChange = (idx, value) => {
    setFormData(prev => ({
      ...prev,
      wawancara: {
        ...prev.wawancara,
        [idx]: value
      }
    }));
  };

  // Validasi Step
  const isStep1Valid = formData.fktpName.trim() !== '' && formData.city.trim() !== '' && formData.role !== '';
  const isStep2Valid = formData.timeInPoli !== '' && formData.timeHomeVisit !== '' && 
                       formData.propInFktp !== '' && formData.propOutFktp !== '' &&
                       (Number(formData.propInFktp) + Number(formData.propOutFktp) === 100) &&
                       kompetensiLayanan.every((_, idx) => formData.kompetensi[idx]?.status);
  const isStep3Valid = jknBenefits.every((_, idx) => formData.jkn[idx]?.skala);
  const isStep4Valid = nonOptimalServices.every((_, idx) => formData.nonOptimal[idx]?.masukJkn && formData.nonOptimal[idx]?.skala);
  const isStep5Valid = interviewQuestions.every((_, idx) => formData.wawancara[idx]?.trim() !== '');

  const canProceed = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    if (step === 4) return isStep4Valid;
    if (step === 5) return isStep5Valid;
    return false;
  };

  const nextStep = () => {
    if (canProceed()) setStep(prev => Math.min(prev + 1, totalSteps));
  };
  
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const submitData = async () => {
    if (isInterview && !isStep5Valid) return;
    if (!isInterview && !isStep4Valid) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        fktp_name: formData.fktpName,
        city: formData.city,
        role: formData.role,
        doc_umum: formData.docUmum,
        doc_gigi: formData.docGigi,
        doc_kklp: formData.docKklp,
        time_in_poli: formData.timeInPoli,
        time_home_visit: formData.timeHomeVisit,
        prop_in_fktp: formData.propInFktp,
        prop_out_fktp: formData.propOutFktp,
        kompetensi: formData.kompetensi,
        jkn: formData.jkn,
        non_optimal: formData.nonOptimal,
        wawancara: formData.wawancara
      };

      let error;
      if (isInterview && formData.id) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('surveys')
          .update(payload)
          .eq('id', formData.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('surveys')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan saat menyimpan data ke Supabase. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white rounded-xl shadow-sm border border-slate-200 text-center animate-fade-in mt-10">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Data Berhasil Disimpan</h2>
        <p className="text-slate-500 mb-8 text-lg">Terima kasih atas partisipasi Anda.</p>
        <button 
          onClick={() => {
            if (isInterview) navigate('/wawancara');
            else window.location.reload();
          }}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          {isInterview ? 'Kembali ke Daftar' : 'Isi Survey Baru'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {isInterview ? 'Form Wawancara (Tim Survey)' : 'Formulir Survey JKN'}
        </h1>
        <p className="text-slate-500 mt-2 text-sm max-w-2xl">
          {isInterview 
            ? 'Anda sedang dalam mode Tim Survey. Anda dapat mengedit jawaban Puskesmas dan mengisi hasil wawancara di Tahap 5.' 
            : 'Survey optimalisasi program JKN di FPKTP dalam rangka Transformasi Layanan Primer & Peran Dokter Sp.KKLP.'}
        </p>
      </div>

      {/* Enterprise Stepper */}
      <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {hasExistingData && !isInterview && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start">
            <Info className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-bold text-sm">Data Sudah Disubmit</p>
              <p className="text-sm mt-1">Anda sudah mengisi survey ini sebelumnya. Data di bawah ini adalah hasil inputan Anda. Anda tidak dapat menyimpannya ulang.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between relative min-w-[600px]">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center relative z-10 w-full">
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
        <form onSubmit={(e) => e.preventDefault()} className="animate-fade-in relative">
          
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
                    <input required type="text" name="fktpName" value={formData.fktpName} onChange={handleInputChange} readOnly={!isInterview && user?.role === 'puskesmas'} placeholder="Misal: Puskesmas Melati" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Provinsi / Kabupaten/Kota</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleInputChange} readOnly={!isInterview && user?.role === 'puskesmas'} placeholder="Misal: Kota Bandung" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 disabled:opacity-70" />
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
                            <div className="flex justify-center gap-2">
                              {['sudah', 'belum'].map(status => (
                                <label key={status} className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${formData.kompetensi[idx]?.status === status ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>
                                  <input 
                                    type="radio" 
                                    className="hidden" 
                                    name={`komp-${idx}`} 
                                    value={status}
                                    checked={formData.kompetensi[idx]?.status === status}
                                    onChange={(e) => handleNestedChange('kompetensi', idx, 'status', e.target.value)}
                                  />
                                  {status === 'sudah' ? 'Sudah' : 'Belum'}
                                </label>
                              ))}
                            </div>
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
                    Pilih <strong>Ya/Tidak</strong> apakah layanan perlu diakomodasi ke JKN. Berikan nilai <strong>Skala (1-4)</strong> kompetensi:
                    <ul className="list-decimal pl-5 mt-1 space-y-1">
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
                            <div className="flex justify-center gap-2">
                              {['Ya', 'Tidak'].map(pilihan => (
                                <label key={pilihan} className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${formData.nonOptimal[idx]?.masukJkn === pilihan ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>
                                  <input 
                                    type="radio" 
                                    className="hidden" 
                                    name={`masukJkn-${idx}`} 
                                    value={pilihan}
                                    checked={formData.nonOptimal[idx]?.masukJkn === pilihan}
                                    onChange={(e) => handleNestedChange('nonOptimal', idx, 'masukJkn', e.target.value)}
                                  />
                                  {pilihan}
                                </label>
                              ))}
                            </div>
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

            {/* Step 5: Wawancara (HANYA TIM SURVEY) */}
            {isInterview && step === 5 && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">E. Rekomendasi Pembiayaan dan Kebijakan (Khusus Tim Survey)</h2>
                </div>
                
                <div className="border border-emerald-100 bg-emerald-50/50 rounded-lg p-4 flex items-start space-x-3 mb-6">
                  <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-emerald-900">
                    <span className="font-semibold block mb-1">Panduan Pewawancara:</span>
                    Silakan gali informasi dari responden berdasarkan pertanyaan berikut. Tuliskan ringkasan jawaban/alasan dengan jelas dan komprehensif. Semua kolom wajib diisi.
                  </div>
                </div>

                <div className="space-y-6">
                  {interviewQuestions.map((question, idx) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <label className="block text-sm font-semibold text-slate-800 mb-3 leading-relaxed">
                        {question}
                      </label>
                      <textarea 
                        rows={4}
                        required
                        placeholder="Tuliskan jawaban/alasan di sini..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-y"
                        value={formData.wawancara[idx] || ''}
                        onChange={(e) => handleWawancaraChange(idx, e.target.value)}
                      ></textarea>
                    </div>
                  ))}
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
            
            {step < totalSteps ? (
              <button 
                type="button" 
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex items-center px-6 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm ${!canProceed() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                Selanjutnya <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={submitData}
                disabled={isSubmitting || !canProceed() || (hasExistingData && !isInterview)}
                className={`flex items-center px-6 py-2 text-white rounded-lg font-medium text-sm transition-all shadow-sm ${isSubmitting || !canProceed() || (hasExistingData && !isInterview) ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
              >
                {hasExistingData && !isInterview ? 'Data Sudah Disimpan' : isSubmitting ? 'Memproses...' : 'Simpan Data'}
                {!isSubmitting && !(hasExistingData && !isInterview) && <Save className="w-4 h-4 ml-2" />}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
