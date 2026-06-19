import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, Save, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import wilayahMapping from '../data/wilayahMapping.json';
import logoKemenkes from '../assets/logo-kemenkes.png';
import SearchableSelect from './SearchableSelect';

const jknBenefits = [
  "Pengelolaan Diabetes Melitus tanpa komplikasi", "Penyusunan care plan jangka panjang pasien kronik",
  "Manajemen pasien dengan multimorbiditas (DM + hipertensi + dislipidemia)", "Pemantauan kepatuhan terapi pasien kronik (penyakit tidak menular)",
  "Pemantauan kepatuhan terapi pasien AIDS, TB, Malaria", "Pelaksanaan Program Rujuk Balik (PRB)",
  "Pengelolaan Hipertensi tanpa komplikasi", "Deprescribing/pengurangan obat pada pasien polifarmasi"
];

const nonOptimalServices = [
  "Pelayanan lifestyle medicine", "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine", "Manajemen pasien geriatri frailty", 
  "Precision medicine/konseling genetik dasar", "Layanan promotif berbasis keluarga"
];

const kompetensiLayanan = [
  "Pemeriksaan USG Dasar untuk penegakan diagnosis",
  "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)",
  "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
  "Pemeriksaan Xray untuk penegakan diagnosis"
];

const interviewQuestions = [
  "1. Bagaimana pelaksanaan layanan penyakit kronik di FKTP saat ini dan bagaimana peran Sp.KKLP dalam mendukungnya? (adakah aspek yang masih perlu diperkuat?)",
  "2. Bagaimana pelaksanaan home visit dan home care saat ini, serta dukungan yang diperlukan untuk optimalisasi layanan tersebut?",
  "3. Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN? Atau ada opsi fund channeling lain? (bisa berikan contoh aktivitasnya apa saja yang biasanya dilakukan saat implementasi komunitas dan edukasi kelompok)",
  "4. Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN FKTP?",
  "5. Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB dengan adanya sp.KKLP?",
  "6. Bagaimana pengalaman atau perubahan yang dirasakan setelah adanya dokter Sp.KKLP di FKTP?",
  "7. Menurut Anda, bentuk dukungan apa yang diperlukan agar FKTP yang memiliki dokter Sp.KKLP dapat menjalankan perannya secara optimal?"
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
    { id: 5, title: 'Pendalaman' }
  ];

  const totalSteps = 5;

  const { user } = useAuth();
  const [formData, setFormData] = useState({
    id: null,
    fktpName: '', provinsi: '', kabKota: '', city: '', role: '',
    kodeFaskes: '', namaResponden: '',
    docUmum: '', docGigi: '', docKklp: '',
    timeInPoli: '', timeHomeVisit: '', propInFktp: '', propOutFktp: '',
    kompetensi: {}, jkn: {}, nonOptimal: {}, wawancara: {},
    homeCare: {}, paliatif: {}
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPanduan, setShowPanduan] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const provinsiList = Object.keys(wilayahMapping).sort();
  const kabKotaList = formData.provinsi && wilayahMapping[formData.provinsi]
    ? Object.keys(wilayahMapping[formData.provinsi]).sort()
    : [];
  const puskesmasList = formData.provinsi && formData.kabKota && wilayahMapping[formData.provinsi]?.[formData.kabKota]
    ? wilayahMapping[formData.provinsi][formData.kabKota]
    : [];

  useEffect(() => {
    // 1. Mode Wawancara (Tim Survey dari Halaman List)
    if (isInterview && location.state?.surveyData) {
      const data = location.state.surveyData;
      // Try to resolve provinsi & kabKota from stored city field (for backward compat)
      let resolvedProvinsi = data.provinsi || '';
      let resolvedKabKota = data.kab_kota || '';
      // If old data only has city (which was provinsi before), try to match
      if (!resolvedProvinsi && data.city) {
        if (wilayahMapping[data.city]) {
          resolvedProvinsi = data.city;
        }
      }
      setFormData({
        id: data.id,
        fktpName: data.fktp_name || '',
        provinsi: resolvedProvinsi,
        kabKota: resolvedKabKota,
        city: data.city || '',
        role: data.role || '',
        docUmum: data.doc_umum || '',
        docGigi: data.doc_gigi || '',
        docKklp: data.doc_kklp || '',
        timeInPoli: data.time_in_poli || '',
        timeHomeVisit: data.time_home_visit || '',
        propInFktp: data.prop_in_fktp || '',
        propOutFktp: data.prop_out_fktp || '',
        kompetensi: data.kompetensi || {},
        jkn: data.jkn || {},
        nonOptimal: data.non_optimal || {},
        wawancara: data.wawancara || {},
        homeCare: data.home_care || {},
        paliatif: data.paliatif || {},
        kodeFaskes: data.kode_faskes || '',
        namaResponden: data.nama_responden || ''
      });
      return;
    }
  }, [isInterview, location.state]);



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

  const isRoleDoctor = formData.role === 'Dokter Umum' || formData.role === 'Dokter Sp.KKLP';

  // Validasi Step
  const isStep1Valid = formData.fktpName.trim() !== '' && formData.provinsi.trim() !== '' && formData.kabKota.trim() !== '' && formData.role !== '' && formData.docKklp !== '';
  const propTotal = Number(formData.propInFktp || 0) + Number(formData.propOutFktp || 0);
  const isPropValid = formData.propInFktp !== '' && formData.propOutFktp !== '' && propTotal === 100;
  const isStep2Valid = isRoleDoctor 
    ? (formData.timeInPoli !== '' && formData.timeHomeVisit !== '' && 
       isPropValid &&
       kompetensiLayanan.every((_, idx) => formData.kompetensi[idx]?.status))
    : true;
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
    if (canProceed()) {
      setShowErrors(false);
      setStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      setShowErrors(true);
      // scroll ke atas form agar error terlihat
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const submitData = async (isIntermediate = false) => {
    if (isIntermediate && !isStep4Valid) {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!isIntermediate && !isStep5Valid) {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        fktp_name: formData.fktpName,
        provinsi: formData.provinsi,
        kab_kota: formData.kabKota,
        city: formData.provinsi, // keep city for backward compat, store provinsi
        role: formData.role,
        doc_umum: formData.docUmum,
        doc_gigi: formData.docGigi,
        doc_kklp: formData.docKklp,
        time_in_poli: formData.timeInPoli === '' ? null : Number(formData.timeInPoli),
        time_home_visit: formData.timeHomeVisit === '' ? null : Number(formData.timeHomeVisit),
        prop_in_fktp: formData.propInFktp === '' ? null : Number(formData.propInFktp),
        prop_out_fktp: formData.propOutFktp === '' ? null : Number(formData.propOutFktp),
        kode_faskes: formData.kodeFaskes,
        nama_responden: formData.namaResponden,
        kompetensi: formData.kompetensi,
        jkn: formData.jkn,
        non_optimal: formData.nonOptimal,
        home_care: formData.homeCare,
        paliatif: formData.paliatif,
        wawancara: user ? { ...formData.wawancara, pewawancara: user.username } : formData.wawancara
      };

      let error;
      if (formData.id) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('surveys')
          .update(payload)
          .eq('id', formData.id);
        error = updateError;
      } else {
        // Insert new record and select to get ID
        const { data, error: insertError } = await supabase
          .from('surveys')
          .insert([payload])
          .select();
        error = insertError;
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, id: data[0].id }));
        }
      }

      if (error) throw error;
      
      if (isIntermediate) {
        setShowTransition(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setIsSubmitted(true);
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan saat menyimpan data ke Supabase. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };



  if (showTransition) {
    return (
      <div className="max-w-3xl mx-auto p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-soft-lg border border-emerald-100 text-center animate-fade-in mt-10">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Info className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Sesi Wawancara Mendalam</h2>
        <p className="text-slate-600 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
          Selanjutnya adalah sesi pertanyaan terbuka. Silakan diisi dengan <strong>jujur</strong> dan <strong>sesuai kondisi nyata di lapangan</strong>. Kami menyediakan <strong>5 Jawaban Tersering Berdasarkan Survey Sebelumnya</strong> sebagai referensi — Anda bisa memilih salah satunya atau menulis jawaban sendiri.
        </p>
        <button 
          onClick={() => {
            setShowTransition(false);
            setStep(5);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-1 active:scale-95"
        >
          Lanjutkan ke Wawancara
        </button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white rounded-xl shadow-sm border border-slate-200 text-center animate-fade-in mt-10">
        <CheckCircle className="w-16 h-16 text-primary-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Data Berhasil Disimpan</h2>
        <p className="text-slate-500 mb-8 text-lg">Terima kasih atas partisipasi Anda.</p>
        <button 
          onClick={() => {
            setIsSubmitted(false);
            if (isInterview) navigate('/wawancara');
            else window.location.reload();
          }}
          className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          {isInterview ? 'Kembali ke Daftar' : 'Isi Survey Baru'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
          <div className="hidden md:flex h-16 md:h-20 shrink-0 bg-white rounded-2xl items-center justify-center px-4 py-2.5 shadow-sm border border-slate-100 mt-1">
            <img src={logoKemenkes} alt="Logo Kemenkes" className="h-full w-auto object-contain max-w-[200px]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight leading-tight">
              {isInterview ? 'Form Wawancara (Tim Survey)' : 'Survey Optimalisasi Program JKN di FKTP'}
            </h1>
            {isInterview ? (
            <p className="text-slate-500 mt-2 text-sm max-w-2xl">
              Anda sedang dalam mode Tim Survey. Anda dapat mengedit jawaban Puskesmas dan mengisi hasil wawancara di Tahap 5.
            </p>
          ) : (
            <div className="mt-4 text-sm text-slate-600 max-w-4xl text-justify">
              <span className="font-bold text-slate-800 mb-1 block">Latar Belakang:</span>
              Survey ini bertujuan mengidentifikasi jenis layanan dalam paket manfaat JKN yang saat ini sudah tersedia maupun layanan yang belum terakomodasi dalam JKN, serta menilai apakah layanan tersebut lebih optimal dengan adanya PMK 19 tahun 2024 terkait penambahan jenis tenaga baru termasuk salah satunya dokter Spesialis Kedokteran Keluarga Layanan Primer (Sp.KKLP)
            </div>
          )}
          </div>
        </div>
        {!isInterview && (
          <div className="flex flex-col gap-2 shrink-0">
            <button 
              onClick={() => setShowPanduan(true)} 
              className="bg-primary-600 border border-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm"
            >
              📖 Panduan Pengisian
            </button>
            <button 
              onClick={() => navigate('/login')} 
              className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm"
            >
              Login Petugas
            </button>
          </div>
        )}
      </div>

      {/* Enterprise Stepper */}
      <div className="mb-10 bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-soft border border-white overflow-x-auto relative z-10">
        <div className="flex items-center justify-between relative min-w-[600px] px-4">
          <div className="absolute left-10 right-10 top-5 transform -translate-y-1/2 h-1 bg-slate-100 rounded-full -z-10"></div>
          {/* Active Progress Line */}
          <div 
            className="absolute left-10 top-5 transform -translate-y-1/2 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full -z-10 transition-all duration-500 ease-in-out" 
            style={{ width: `calc(${Math.max(0, (step - 1) / (totalSteps - 1)) * 100}% - 2.5rem)` }}
          ></div>

          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center relative z-10 w-full group">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-500 shadow-sm ${
                step > s.id 
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/40 scale-100' 
                  : step === s.id 
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 scale-110 shadow-xl'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.id}
              </div>
              <span className={`mt-3 text-sm font-semibold transition-colors duration-300 ${step === s.id ? 'text-primary-600' : step > s.id ? 'text-slate-800' : 'text-slate-400'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft-lg border border-white overflow-hidden relative z-0">
        {/* Subtle decorative glow inside card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/50 rounded-full blur-[80px] pointer-events-none"></div>
        <form onSubmit={(e) => e.preventDefault()} className="animate-fade-in relative z-10">
          
          <div className="p-8 sm:p-12">
            {/* Step 1: Identitas */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">A. Identitas Responden</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isInterview && user?.role !== 'admin' ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Puskesmas / Klinik</label>
                        <input type="text" value={formData.fktpName} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Provinsi</label>
                        <input type="text" value={formData.provinsi} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kabupaten/Kota</label>
                        <input type="text" value={formData.kabKota} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 outline-none" />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Provinsi */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Provinsi</label>
                        <div className={showErrors && !formData.provinsi ? 'ring-2 ring-rose-500 rounded-lg shadow-sm' : ''}>
                          <SearchableSelect
                            name="provinsi"
                            options={provinsiList}
                            value={formData.provinsi}
                            onChange={(val) => {
                              setFormData(prev => ({ ...prev, provinsi: val, kabKota: '', fktpName: '' }));
                            }}
                            placeholder="-- Pilih Provinsi --"
                          />
                        </div>
                        {showErrors && !formData.provinsi && <p className="text-xs text-rose-500 mt-1">Provinsi wajib dipilih</p>}
                      </div>

                      {/* Kabupaten/Kota */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Kabupaten/Kota</label>
                        <div className={showErrors && !formData.kabKota ? 'ring-2 ring-rose-500 rounded-lg shadow-sm' : ''}>
                          <SearchableSelect
                            name="kabKota"
                            options={kabKotaList}
                            value={formData.kabKota}
                            onChange={(val) => {
                              setFormData(prev => ({ ...prev, kabKota: val, fktpName: '' }));
                            }}
                            disabled={!formData.provinsi}
                            placeholder="-- Pilih Kab/Kota --"
                            allowManual={true}
                          />
                        </div>
                        {!formData.provinsi
                          ? <p className="text-xs text-amber-600 mt-1">Pilih provinsi terlebih dahulu</p>
                          : showErrors && !formData.kabKota
                            ? <p className="text-xs text-rose-500 mt-1">Kab/Kota wajib diisi</p>
                            : null
                        }
                      </div>

                      {/* Nama Puskesmas */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Nama Puskesmas / Klinik</label>
                        <div className={showErrors && !formData.fktpName ? 'ring-2 ring-rose-500 rounded-lg shadow-sm' : ''}>
                          <SearchableSelect
                            name="fktpName"
                            options={puskesmasList}
                            value={formData.fktpName}
                            onChange={(val) => handleInputChange({ target: { name: 'fktpName', value: val } })}
                            disabled={!formData.kabKota}
                            placeholder="-- Pilih atau Ketik Puskesmas --"
                            allowManual={true}
                          />
                        </div>
                        {!formData.kabKota
                          ? <p className="text-xs text-amber-600 mt-1">Pilih Kab/Kota terlebih dahulu</p>
                          : showErrors && !formData.fktpName
                            ? <p className="text-xs text-rose-500 mt-1">Nama Puskesmas wajib diisi</p>
                            : null
                        }
                      </div>

                      {/* Kode Faskes BPJS */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Kode Faskes BPJS <span className="text-xs text-slate-400 font-normal">(opsional)</span></label>
                        <input
                          type="text"
                          name="kodeFaskes"
                          value={formData.kodeFaskes}
                          onChange={handleInputChange}
                          placeholder="Contoh: 0101G00001"
                          className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300"
                        />
                      </div>

                      {/* Nama Responden */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Nama Responden <span className="text-xs text-slate-400 font-normal">(opsional)</span></label>
                        <input
                          type="text"
                          name="namaResponden"
                          value={formData.namaResponden}
                          onChange={handleInputChange}
                          placeholder="Nama lengkap responden"
                          className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300"
                        />
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <div className="mb-3">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Jabatan <span className="text-xs text-slate-400 font-normal ml-1">(Pilih salah satu)</span></label>
                    </div>
                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-2 rounded-2xl ${showErrors && !formData.role ? 'ring-2 ring-rose-500 bg-rose-50/50' : ''}`}>
                      {['Kepala Puskesmas', 'Dokter Umum', 'Dokter Sp.KKLP', 'Tenaga Kesehatan Fungsional (Dokter Gigi, Bidan, Perawat, Farmasi)'].map(role => (
                        <label key={role} className={`relative flex items-center justify-center px-4 py-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 text-center leading-tight group ${
                          formData.role === role 
                            ? 'border-primary-500 bg-primary-50/50 text-primary-700 font-bold shadow-md shadow-primary-500/10 scale-[1.02]' 
                            : 'border-slate-100 bg-white hover:border-primary-300 hover:bg-slate-50 text-slate-600'
                        }`}>
                          {formData.role === role && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                          )}
                          <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleInputChange} className="hidden" required />
                          <span className="text-xs sm:text-sm">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Apakah FKTP memiliki Dokter Sp.KKLP?
                      <span className="block text-xs text-slate-400 font-normal mt-0.5">(baik Berpraktik maupun tidak berpraktik sebagai Sp.KKLP)</span>
                    </label>
                    <div className={`flex gap-4 ${showErrors && !formData.docKklp ? 'p-2 ring-2 ring-rose-500 rounded-xl bg-rose-50/50' : ''}`}>
                      {['Ya', 'Tidak'].map(opt => (
                        <label key={opt} className={`flex items-center gap-3 px-6 py-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                          formData.docKklp === opt
                            ? 'border-primary-500 bg-primary-50/50 text-primary-700 font-bold shadow-md shadow-primary-500/10'
                            : 'border-slate-100 bg-white hover:border-primary-300 hover:bg-slate-50 text-slate-600'
                        }`}>
                          <input type="radio" name="docKklp" value={opt} checked={formData.docKklp === opt} onChange={handleInputChange} className="hidden" />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData.docKklp === opt ? 'border-primary-500' : 'border-slate-300'}`}>
                            {formData.docKklp === opt && <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>}
                          </div>
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {showErrors && !formData.docKklp && <p className="text-xs text-rose-500 mt-1">Wajib dipilih</p>}
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
                
                {!isRoleDoctor ? (
                  <div className="text-center py-16 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Bagian Khusus Dokter</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Bagian Kompetensi Dokter dan Beban Kerja ini hanya diperuntukkan bagi responden <strong>Dokter Umum</strong> dan <strong>Dokter Sp.KKLP</strong>.
                    </p>
                    <p className="text-slate-500 mt-4 font-medium">Silakan klik "Selanjutnya" di bawah untuk melewati bagian ini.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50 border border-slate-100 rounded-xl mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rata-rata waktu Poli (mnt/pasien)</label>
                        <input type="number" name="timeInPoli" value={formData.timeInPoli} onChange={handleInputChange} placeholder="Contoh: 10" className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300 ${showErrors && !formData.timeInPoli ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rata-rata waktu Home Visit (mnt/pasien)</label>
                        <input type="number" name="timeHomeVisit" value={formData.timeHomeVisit} onChange={handleInputChange} placeholder="Contoh: 45" className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300 ${showErrors && !formData.timeHomeVisit ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Beban Dalam Gedung (%)</label>
                        <input type="number" name="propInFktp" value={formData.propInFktp} onChange={handleInputChange} placeholder="Contoh: 70" min="0" max="100" className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300 ${showErrors && !formData.propInFktp ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Beban Luar Gedung (%)</label>
                        <input type="number" name="propOutFktp" value={formData.propOutFktp} onChange={handleInputChange} placeholder="Contoh: 30" min="0" max="100" className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300 ${showErrors && !formData.propOutFktp ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} />
                      </div>
                      {(formData.propInFktp !== '' || formData.propOutFktp !== '') && (
                        <div className="md:col-span-2">
                          {propTotal === 100 ? (
                            <p className="text-xs text-emerald-600 font-medium">✅ Total beban: {propTotal}% — sudah proporsional.</p>
                          ) : propTotal > 100 ? (
                            <p className="text-xs text-rose-600 font-medium">⚠️ Total melebihi 100% ({propTotal}%). Harap kurangi salah satu nilai.</p>
                          ) : (
                            <p className="text-xs text-amber-600 font-medium">⚠️ Total beban: {propTotal}% — harus berjumlah tepat 100%.</p>
                          )}
                        </div>
                      )}
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
                            <tr key={idx} className={`transition-colors group ${showErrors && !formData.kompetensi[idx]?.status ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
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

                    {/* Helper: tampilkan berapa item kompetensi yang belum dipilih */}
                    {(() => {
                      const belumDipilih = kompetensiLayanan.filter((_, idx) => !formData.kompetensi[idx]?.status).length;
                      return belumDipilih > 0 ? (
                        <p className="text-xs text-amber-600 font-medium mt-3">
                          ⚠️ Masih ada <strong>{belumDipilih} layanan</strong> yang belum dipilih status-nya (Sudah/Belum).
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-600 font-medium mt-3">✅ Semua status kompetensi sudah diisi.</p>
                      );
                    })()}
                  </>
                )}
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
                    <span className="font-semibold block mb-1">Panduan Penilaian Skala (1-4):</span>
                    Pilih nilai sesuai tingkat kebutuhan kompetensi Sp.KKLP pada layanan tersebut.
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
                        <th className="px-4 py-3 font-semibold text-slate-700 w-1/2">Jenis Layanan JKN</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center w-1/4">Skala (1-4)</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 w-1/4">Catatan Opsional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jknBenefits.map((item, idx) => (
                        <tr key={idx} className={`transition-colors ${showErrors && !formData.jkn[idx]?.skala ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
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
                        <tr key={idx} className={`transition-colors ${showErrors && (!formData.nonOptimal[idx]?.masukJkn || !formData.nonOptimal[idx]?.skala) ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-3 text-slate-800 text-xs md:text-sm">{item}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              {['Ya', 'Tidak', 'Tidak Tahu'].map(pilihan => (
                                <label key={pilihan} className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold border transition-all text-center flex-1 ${formData.nonOptimal[idx]?.masukJkn === pilihan ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}>
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

            {/* Step 5: Wawancara */}
            {step === 5 && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">E. Pendalaman Kualitatif</h2>
                </div>
                
                <div className="border border-emerald-100 bg-emerald-50/50 rounded-lg p-4 flex items-start space-x-3 mb-6">
                  <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-emerald-900">
                    <span className="font-semibold block mb-1">Panduan Pengisian:</span>
                    Ceritakan dan tuliskan komponen-komponen yang relevan secara komprehensif agar jawabannya lebih organik dan merepresentasikan kondisi di fasilitas kesehatan Bapak/Ibu.
                  </div>
                </div>

                <div className="space-y-6">
                  {interviewQuestions.map((question, idx) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <label className="block text-sm font-semibold text-slate-800 mb-3 leading-relaxed">
                        {question}
                      </label>
                      <textarea 
                        rows={6}
                        required
                        placeholder="Tuliskan jawaban/alasan di sini..."
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-y ${showErrors && !formData.wawancara[idx]?.trim() ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`}
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
          <div className="px-8 py-5 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 rounded-b-3xl">

            {/* Error Summary — muncul setelah klik Selanjutnya jika ada yang belum diisi */}
            {showErrors && !canProceed() && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-sm font-bold text-rose-700 mb-2">⚠️ Harap lengkapi isian berikut sebelum melanjutkan:</p>
                <ul className="text-sm text-rose-600 space-y-1 list-disc pl-5">
                  {step === 1 && (
                    <>
                      {!formData.city && <li>Provinsi belum dipilih</li>}
                      {!formData.fktpName && <li>Nama Puskesmas / Klinik belum dipilih</li>}
                      {!formData.role && <li>Jabatan belum dipilih</li>}
                    </>
                  )}
                  {step === 2 && isRoleDoctor && (
                    <>
                      {!formData.timeInPoli && <li>Waktu rata-rata poli belum diisi</li>}
                      {!formData.timeHomeVisit && <li>Waktu rata-rata home visit belum diisi</li>}
                      {(!formData.propInFktp || !formData.propOutFktp) && <li>Beban dalam/luar gedung belum diisi</li>}
                      {formData.propInFktp && formData.propOutFktp && propTotal !== 100 && (
                        <li>Total beban dalam + luar gedung harus 100% (saat ini: {propTotal}%)</li>
                      )}
                      {(() => {
                        const belum = kompetensiLayanan.filter((_, idx) => !formData.kompetensi[idx]?.status).length;
                        return belum > 0 ? <li>{belum} layanan kompetensi belum dipilih status-nya (Sudah/Belum) — scroll ke bawah untuk melihat tabel</li> : null;
                      })()}
                    </>
                  )}
                  {step === 3 && (
                    <>
                      {(() => {
                        const belum = jknBenefits.filter((_, idx) => !formData.jkn[idx]?.skala).length;
                        return belum > 0 ? <li>{belum} layanan JKN belum diberi nilai skala (1-4)</li> : null;
                      })()}
                    </>
                  )}
                  {step === 4 && (
                    <>
                      {(() => {
                        const belum = nonOptimalServices.filter((_, idx) => !formData.nonOptimal[idx]?.masukJkn || !formData.nonOptimal[idx]?.skala).length;
                        return belum > 0 ? <li>{belum} layanan belum diisi (Masuk JKN dan/atau Skala)</li> : null;
                      })()}
                    </>
                  )}
                  {step === 5 && (
                    <>
                      {(() => {
                        const belum = interviewQuestions.filter((_, idx) => !formData.wawancara[idx]?.trim()).length;
                        return belum > 0 ? <li>Ada {belum} pertanyaan wawancara yang belum dijawab</li> : null;
                      })()}
                    </>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button 
                type="button" 
                onClick={prevStep}
                disabled={step === 1}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm hover:shadow active:scale-95'}`}
              >
                <ChevronLeft className="w-5 h-5 mr-1.5" /> Sebelumnya
              </button>
              
              {step < 4 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="flex items-center px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-600/30 active:scale-95"
                >
                  Selanjutnya <ChevronRight className="w-5 h-5 ml-1.5" />
                </button>
              ) : step === 4 ? (
                <button 
                  type="button" 
                  onClick={() => submitData(true)}
                  disabled={isSubmitting}
                  className={`flex items-center px-8 py-3 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 hover:-translate-y-0.5 hover:shadow-amber-500/40 active:scale-95'}`}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjut Wawancara'}
                  {!isSubmitting && <ChevronRight className="w-5 h-5 ml-2" />}
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => submitData(false)}
                  disabled={isSubmitting}
                  className={`flex items-center px-8 py-3 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-emerald-500/40 active:scale-95'}`}
                >
                  {isSubmitting ? 'Memproses...' : 'Simpan Selesai'}
                  {!isSubmitting && <Save className="w-5 h-5 ml-2" />}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Panduan Modal */}
      {showPanduan && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">📖 Panduan Pengisian Survey</h2>
              <button onClick={() => setShowPanduan(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-slate-700 space-y-6">

              {/* Alur Umum */}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-800">
                <span className="font-bold block mb-1">ℹ️ Tentang Survey Ini</span>
                Survey ini bertujuan mengidentifikasi layanan JKN yang sudah berjalan dan yang belum optimal di FKTP, serta menilai peran dokter Spesialis Kedokteran Keluarga Layanan Primer (Sp.KKLP) berdasarkan kondisi nyata di lapangan. Pengisian dilakukan secara mandiri oleh Anda selaku responden.
              </div>

              {/* Step 1 */}
              <section>
                <h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">📍 Tahap 1 — Identitas</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Pilih <strong>Provinsi</strong> terlebih dahulu, lalu pilih <strong>Nama Puskesmas / Klinik</strong> dari daftar yang tersedia.</li>
                  <li>Pilih <strong>Jabatan</strong> Anda saat ini (Kepala Puskesmas, Dokter Umum, Dokter Sp.KKLP, dll.).</li>
                  <li>Isikan jumlah <strong>Dokter Umum, Dokter Gigi, dan Dokter Sp.KKLP</strong> yang bertugas di FKTP Anda.</li>
                </ul>
              </section>

              {/* Step 2 */}
              <section>
                <h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">⏱️ Tahap 2 — Beban Kerja Dokter</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Isikan estimasi <strong>waktu rata-rata konsultasi</strong> per pasien di poli (dalam menit).</li>
                  <li>Isikan estimasi <strong>waktu rata-rata home visit</strong> per pasien (dalam menit).</li>
                  <li>Isikan <strong>proporsi beban kerja</strong> dalam gedung dan luar gedung — totalnya harus <strong>100%</strong>.</li>
                  <li>Jika Anda adalah Dokter Umum atau Sp.KKLP, nilai juga <strong>kompetensi layanan</strong> Sp.KKLP menggunakan skala 1–4.</li>
                </ul>
              </section>

              {/* Skala */}
              <section className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                <h3 className="font-bold text-lg text-amber-800 mb-3">📊 Panduan Penilaian Skala (1–4)</h3>
                <p className="mb-4 text-amber-700 text-sm font-medium">Pilih nilai sesuai kebutuhan kompetensi Sp.KKLP pada layanan tersebut:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex items-start gap-4">
                    <div className="bg-red-100 text-red-700 w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl shrink-0">1</div>
                    <div><h4 className="font-bold text-slate-800">Skala 1</h4><p className="text-sm text-slate-600 mt-1">Dapat optimal dilakukan dokter umum</p></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex items-start gap-4">
                    <div className="bg-orange-100 text-orange-700 w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl shrink-0">2</div>
                    <div><h4 className="font-bold text-slate-800">Skala 2</h4><p className="text-sm text-slate-600 mt-1">Dokter umum perlu pelatihan tambahan</p></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex items-start gap-4">
                    <div className="bg-blue-100 text-blue-700 w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl shrink-0">3</div>
                    <div><h4 className="font-bold text-slate-800">Skala 3</h4><p className="text-sm text-slate-600 mt-1">Lebih baik dengan supervisi/kolaborasi Sp.KKLP</p></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm flex items-start gap-4">
                    <div className="bg-emerald-100 text-emerald-700 w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl shrink-0">4</div>
                    <div><h4 className="font-bold text-slate-800">Skala 4</h4><p className="text-sm text-slate-600 mt-1">Kompetensi utama Sp.KKLP</p></div>
                  </div>
                </div>
              </section>

              {/* Step 3 */}
              <section>
                <h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">🏥 Tahap 3 — Manfaat JKN</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Baca daftar layanan JKN yang ditampilkan dan berikan penilaian <strong>skala 1–4</strong> untuk setiap layanan.</li>
                  <li>Nilai menggambarkan seberapa optimal layanan tersebut dilaksanakan dengan keterlibatan Sp.KKLP di FKTP Anda.</li>
                </ul>
              </section>

              {/* Step 4 */}
              <section>
                <h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">🔧 Tahap 4 — Layanan Ekstra (Belum Optimal)</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Untuk setiap layanan yang belum optimal, pilih apakah layanan ini sebaiknya <strong>Masuk JKN</strong> (Ya / Tidak / Tidak Tahu).</li>
                  <li>Kemudian berikan penilaian <strong>skala 1–4</strong> sesuai kebutuhan kompetensi Sp.KKLP.</li>
                </ul>
              </section>

              {/* Step 5 */}
              <section>
                <h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">💬 Tahap 5 — Pendalaman Kualitatif</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Jawab <strong>7 pertanyaan terbuka</strong> sesuai kondisi nyata di FKTP Anda.</li>
                  <li>Anda tetap bisa <strong>mengedit atau menulis jawaban sendiri</strong> di kolom teks yang tersedia.</li>
                  <li>Semua pertanyaan wajib diisi sebelum dapat mengirimkan survey.</li>
                </ul>
              </section>

              {/* Kirim */}
              <section>
                <h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">✅ Pengiriman Data</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Pastikan semua tahap sudah terisi (ditandai ikon ✓ hijau di progress bar).</li>
                  <li>Klik tombol <strong>"Kirim Survey"</strong> di akhir Tahap 5 untuk menyimpan data Anda.</li>
                  <li>Data akan langsung tersimpan ke sistem dan tidak dapat diubah oleh responden setelah dikirim.</li>
                </ul>
              </section>

            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button 
                onClick={() => setShowPanduan(false)}
                className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-sm"
              >
                Saya Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
