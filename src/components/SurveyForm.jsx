import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, Save, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import wilayahMapping from '../data/wilayahMapping.json';
import logoKemenkes from '../assets/logo-kemenkes.png';
import SearchableSelect from './SearchableSelect';
import SurveiDPM from './SurveiDPM';

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

const relevansiItems = [
  "Pengelolaan pasien dengan kondisi kronis dan multimorbiditas",
  "Pendampingan pasien kronis melalui home care",
  "Pelayanan paliatif di tingkat primer",
  "Edukasi kelompok pasien kronis",
  "Pendampingan keluarga pasien kronis",
  "Pemantauan berkelanjutan pasien kronis di komunitas",
  "Monitoring komunitas risiko tinggi penyakit kronis",
  "Penguatan Program Rujuk Balik (PRB)",
  "Koordinasi pelayanan lintas profesi dan kader kesehatan",
  "Pembinaan Posbindu PTM",
  "Pengelolaan pasien geriatri dengan kebutuhan pelayanan jangka panjang",
  "Apakah keberadaan Sp.KKLP berpengaruh terhadap penurunan rujukan?"
];

const layananDirujukItems = [
  "Manajemen pasien dengan multimorbiditas kompleks (misalnya DM, hipertensi, penyakit jantung, dan kondisi kronis lainnya secara bersamaan)",
  "Home care dengan intervensi medis komprehensif untuk pasien kronis",
  "Pelayanan paliatif primer/komunitas",
  "Family conference atau konsultasi keluarga untuk penyelesaian masalah klinis dan psikososial",
  "Monitoring pasien kronis secara terintegrasi dan berkelanjutan",
  "Deprescribing atau evaluasi rasionalisasi obat pada pasien polifarmasi",
  "Konseling dan tata laksana pasien geriatri frailty",
  "Discharge planning dan tindak lanjut pasien pasca rawat inap",
  "Koordinasi rujuk balik FKRTL\u2013Puskesmas / Klinik untuk pasien kronis"
];

const layananBelumBerjalanItems = [
  "Manajemen pasien dengan multimorbiditas kompleks",
  "Home care dengan intervensi medis komprehensif",
  "Pelayanan paliatif primer/komunitas",
  "Family conference atau konsultasi keluarga",
  "Monitoring pasien kronis secara terintegrasi",
  "Deprescribing atau evaluasi penggunaan obat pada pasien polifarmasi",
  "Konseling dan tata laksana pasien geriatri frailty",
  "Edukasi kelompok pasien penyakit kronis (DM, hipertensi, dll.)",
  "Monitoring komunitas risiko tinggi penyakit kronis",
  "Koordinasi lintas profesi dan kader kesehatan",
  "Discharge planning dan tindak lanjut pasien pasca rawat inap",
  "Koordinasi rujuk balik FKRTL\u2013Puskesmas / Klinik"
];

const interviewQuestions = [
  "1. Bagaimana pelaksanaan layanan penyakit kronik di Puskesmas / Klinik saat ini dan bagaimana peran Sp.KKLP dalam mendukungnya? (adakah aspek yang masih perlu diperkuat?)",
  "2. Bagaimana pelaksanaan home visit dan home care saat ini, serta dukungan yang diperlukan untuk optimalisasi layanan tersebut?",
  "3. Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN? Atau ada opsi fund channeling lain? (bisa berikan contoh aktivitasnya apa saja yang biasanya dilakukan saat implementasi komunitas dan edukasi kelompok)",
  "4. Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN Puskesmas / Klinik?",
  "5. Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB dengan adanya sp.KKLP?",
  "6. Bagaimana pengalaman atau perubahan yang dirasakan setelah adanya dokter Sp.KKLP di Puskesmas / Klinik?",
  "7. Menurut Anda, bentuk dukungan apa yang diperlukan agar Puskesmas / Klinik yang memiliki dokter Sp.KKLP dapat menjalankan perannya secara optimal?"
];

export default function SurveyForm({ isEdit = false, isInterview = false }) {
  const [step, setStep] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [formData, setFormData] = useState({
    id: null,
    jenisFaskes: '', fktpName: '', provinsi: '', kabKota: '', city: '', role: '',
    kodeFaskes: '', namaResponden: '',
    docUmum: '', docGigi: '', docKklp: '',
    timeInPoli: '', timeHomeVisit: '', propInFktp: '', propOutFktp: '',
    kompetensi: {}, jkn: {}, nonOptimal: {}, wawancara: {},
    homeCare: {}, paliatif: {},
    // Step 2 SpKKLP extra
    spkklpBerpraktik: '', spkklpPoli: {}, spkklpKendala: {},
    // Step 3 Perspektif
    relevansiSpkklp: {}, layananDirujuk: {}, layananBelumBerjalan: {},
    prb: {},
    dpm: {}
  });

  const isRoleDpm = formData?.role === 'Dokter Praktik Mandiri';

  const STEPS = isRoleDpm ? [
    { id: 1, title: 'Identitas' },
    { id: 2, title: 'Survei DPM' }
  ] : [
    { id: 1, title: 'Identitas' },
    { id: 2, title: 'Kompetensi' },
    { id: 3, title: 'Perspektif' },
    { id: 4, title: 'Manfaat JKN' },
    { id: 5, title: 'Non-Optimal' },
    { id: 6, title: 'Pendalaman' }
  ];

  const totalSteps = STEPS.length;

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPanduan, setShowPanduan] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const combinedProvinsi = new Set([
    ...Object.keys(wilayahMapping.fktp || {}),
    ...Object.keys(wilayahMapping.dpm || {})
  ]);
  const provinsiList = Array.from(combinedProvinsi).sort();

  const kabKotaList = formData.provinsi ? Array.from(new Set([
    ...Object.keys(wilayahMapping.fktp?.[formData.provinsi] || {}),
    ...Object.keys(wilayahMapping.dpm?.[formData.provinsi] || {})
  ])).sort() : [];

  const sourceMap = formData.jenisFaskes === 'Dokter Praktik Mandiri' ? wilayahMapping.dpm : wilayahMapping.fktp;

  const faskesListRaw = formData.provinsi && formData.kabKota && sourceMap[formData.provinsi]?.[formData.kabKota]
    ? sourceMap[formData.provinsi][formData.kabKota]
    : [];
    
  const faskesList = formData.jenisFaskes === 'Dokter Praktik Mandiri' 
    ? [...faskesListRaw].sort()
    : [...faskesListRaw].sort((a, b) => {
        const isAPusk = a.toLowerCase().startsWith('puskesmas');
        const isBPusk = b.toLowerCase().startsWith('puskesmas');
        if (isAPusk && !isBPusk) return -1;
        if (!isAPusk && isBPusk) return 1;
        return a.localeCompare(b);
      });

  useEffect(() => {
    if (isInterview && location.state?.surveyData) {
      const data = location.state.surveyData;
      let resolvedProvinsi = data.provinsi || '';
      let resolvedKabKota = data.kab_kota || '';
      if (!resolvedProvinsi && data.city) {
        if (wilayahMapping[data.city]) resolvedProvinsi = data.city;
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
        namaResponden: data.nama_responden || '',
        spkklpBerpraktik: data.spkklp_berpraktik || '',
        spkklpPoli: data.spkklp_poli || {},
        spkklpKendala: data.spkklp_kendala || {},
        relevansiSpkklp: data.relevansi_spkklp || {},
        layananDirujuk: data.layanan_dirujuk || {},
        layananBelumBerjalan: data.layanan_belum_berjalan || {},
        prb: data.prb || {}
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

  const handleCheckboxGroup = (category, key, checked) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: checked }
    }));
  };

  const handleWawancaraChange = (idx, value) => {
    setFormData(prev => ({
      ...prev,
      wawancara: { ...prev.wawancara, [idx]: value }
    }));
  };

  const isRoleDoctor = formData.role === 'Dokter Umum' || formData.role === 'Dokter Sp.KKLP';
  const isRoleSpKklp = formData.role === 'Dokter Sp.KKLP';

  // Validasi per Step
  const isStep1Valid = (() => {
    if (formData.fktpName.trim() === '' || formData.provinsi.trim() === '' || formData.kabKota.trim() === '' || formData.role === '' || formData.kodeFaskes.trim() === '' || formData.namaResponden.trim() === '') return false;
    if (!isRoleDpm && formData.docKklp === '') return false;
    if (formData.role === 'Dokter Sp.KKLP') {
      if (!formData.spkklpBerpraktik) return false;
      if (!formData.spkklpPoli?.hasPoli) return false;
      if (formData.spkklpPoli.hasPoli === 'Ya') {
        if (!formData.spkklpPoli.sejak?.trim() || !formData.spkklpPoli.kunjungan || !formData.spkklpPoli.pembiayaan?.trim()) return false;
      }
      if (formData.spkklpPoli.hasPoli === 'Tidak') {
        if (!formData.spkklpPoli.diagnosis?.trim() || !formData.spkklpPoli.tindakan?.trim()) return false;
      }
      if (!formData.spkklpKendala?.hasKendala) return false;
      if (formData.spkklpKendala.hasKendala === 'Ya') {
        if (!formData.spkklpKendala.diagnosis?.trim() || !formData.spkklpKendala.tindakan?.trim()) return false;
      }
    }
    return true;
  })();
  const propTotal = Number(formData.propInFktp || 0) + Number(formData.propOutFktp || 0);
  const isPropValid = formData.propInFktp !== '' && formData.propOutFktp !== '' && propTotal === 100;
  const isStep2Valid = isRoleDpm ? (() => {
    const dpm = formData.dpm;
    if (!dpm) return false;
    // A
    if (!dpm.karakteristik?.lamaPraktik || !dpm.karakteristik?.jumlahKunjungan || !dpm.karakteristik?.kelompokUmur || !dpm.karakteristik?.statusPeserta) return false;
    // B
    if (!dpm.kasus?.masalahKesehatan || dpm.kasus.masalahKesehatan.length === 0 || !dpm.kasus?.persenKronis || !dpm.kasus?.persenKontrol) return false;
    // C
    if (!dpm.pendekatan?.tahuKeluargaInti || !dpm.pendekatan?.menanganiKeluargaSama || !dpm.pendekatan?.tanyaKondisiKeluargaLain) return false;
    if (!dpm.pendekatan?.aspekDigali || dpm.pendekatan.aspekDigali.length === 0) return false;
    if (!dpm.pendekatan?.pengaruhKeluargaKasus || !dpm.pendekatan?.contohMasalahKeluarga) return false;
    // D
    if (!dpm.kontinuitas?.sistemPencatatan || !dpm.kontinuitas?.jadwalkanKunjunganUlang || !dpm.kontinuitas?.tindakLanjutTidakDatang) return false;
    // E
    if (!dpm.gambaran?.kegiatanDilakukan || dpm.gambaran.kegiatanDilakukan.length === 0) return false;
    if (!dpm.gambaran?.bentukPelayananKeluarga?.trim() || !dpm.gambaran?.contohKasusKeluarga?.trim() || !dpm.gambaran?.contohLayananHolistik?.trim()) return false;
    return true;
  })() : isRoleDoctor
    ? (formData.timeInPoli !== '' && formData.timeHomeVisit !== '' &&
       isPropValid &&
       kompetensiLayanan.every((_, idx) => formData.kompetensi[idx]?.status))
    : true;

  const isStep3Valid = relevansiItems.every((_, idx) => formData.relevansiSpkklp[idx]) &&
    formData.prb?.jumlah && formData.prb?.peserta_dm && formData.prb?.peserta_ht &&
    formData.prb?.mekanisme && formData.prb?.rataRujukan;

  const isStep4Valid = (() => {
    if (!jknBenefits.every((_, idx) => formData.jkn[idx]?.skala)) return false;
    
    if (formData.homeCare?.screening === 'Ya') {
      const hc = formData.homeCare;
      if (!hc.tenaga?.trim() || !hc.diagnosis?.trim() || !hc.jumlahKunjungan || !hc.kolaborasi || !hc.kepatuhan || !hc.perbaikan) return false;
      if (hc.kolaborasi === 'Ya' && !hc.bentukKolaborasi?.trim()) return false;
      if (hc.perbaikan === 'Ya' && !hc.bentukPerbaikan?.trim()) return false;
      const hasKondisi = ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].some(k => hc[`kondisi_${k}`]);
      if (!hasKondisi) return false;
      const hasJenis = ['Pemeriksaan kesehatan', 'Pemantauan penyakit kronis', 'Perawatan luka', 'Rehabilitasi sederhana', 'Edukasi keluarga', 'Lainnya'].some(j => hc[`jenis_${j}`]);
      if (!hasJenis) return false;
    }

    if (formData.paliatif?.screening === 'Ya') {
      const pl = formData.paliatif;
      if (!pl.tenaga?.trim() || !pl.diagnosis?.trim() || !pl.terapi?.trim() || !pl.kolaborasi || !pl.kepatuhan || !pl.perbaikan) return false;
      if (pl.kolaborasi === 'Ya' && !pl.bentukKolaborasi?.trim()) return false;
      if (pl.perbaikan === 'Ya' && !pl.bentukPerbaikan?.trim()) return false;
      const hasKondisiPl = ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].some(k => pl[`kondisi_${k}`]);
      if (!hasKondisiPl) return false;
      const hasTujuan = ['Pengendalian nyeri', 'Pengendalian gejala', 'Dukungan psikososial', 'Edukasi keluarga/caregiver', 'Perawatan akhir kehidupan', 'Lainnya'].some(t => pl[`tujuan_${t}`]);
      if (!hasTujuan) return false;
    }

    return true;
  })();

  const isStep5Valid = nonOptimalServices.every((_, idx) => formData.nonOptimal[idx]?.masukJkn && formData.nonOptimal[idx]?.skala);
  const isStep6Valid = interviewQuestions.every((_, idx) => formData.wawancara[idx]?.trim() !== '');

  const canProceed = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (isRoleDpm) return false; // DPM only has 2 steps!
    if (step === 3) return isStep3Valid;
    if (step === 4) return isStep4Valid;
    if (step === 5) return isStep5Valid;
    if (step === 6) return isStep6Valid;
    return false;
  };

  const nextStep = () => {
    if (canProceed()) {
      setShowErrors(false);
      setStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const submitData = async (isIntermediate = false) => {
    if (isRoleDpm) {
      if (!isStep2Valid) {
        setShowErrors(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else {
      if (isIntermediate && !isStep5Valid) {
        setShowErrors(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!isIntermediate && !isStep6Valid) {
        setShowErrors(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        fktp_name: formData.fktpName,
        provinsi: formData.provinsi,
        kab_kota: formData.kabKota,
        city: formData.provinsi,
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
        wawancara: user ? { ...formData.wawancara, pewawancara: user.username } : formData.wawancara,
        spkklp_berpraktik: formData.spkklpBerpraktik,
        spkklp_poli: formData.spkklpPoli,
        spkklp_kendala: formData.spkklpKendala,
        relevansi_spkklp: formData.relevansiSpkklp,
        layanan_dirujuk: formData.layananDirujuk,
        layanan_belum_berjalan: formData.layananBelumBerjalan,
        prb: formData.prb,
        dpm: formData.dpm
      };
      let error;
      if (formData.id) {
        const { error: updateError } = await supabase.from('surveys').update(payload).eq('id', formData.id);
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase.from('surveys').insert([payload]).select();
        error = insertError;
        if (data && data.length > 0) setFormData(prev => ({ ...prev, id: data[0].id }));
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

  // Radio helper component
  const RadioOption = ({ name, value, checked, onChange, label, color = 'primary' }) => (
    <label className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
      checked ? `bg-${color}-600 text-white border-${color}-600 shadow-sm` : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
    }`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
      {label}
    </label>
  );

  if (showTransition) {
    return (
      <div className="max-w-3xl mx-auto p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-soft-lg border border-emerald-100 text-center animate-fade-in mt-10">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Info className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Pendalaman Kualitatif</h2>
        <p className="text-slate-600 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
          Selanjutnya adalah sesi pertanyaan terbuka. Silakan diisi dengan <strong>jujur</strong> dan <strong>sesuai kondisi nyata di lapangan</strong>. Ceritakan secara komprehensif dan organik.
        </p>
        <button
          onClick={() => { setShowTransition(false); setStep(6); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-1 active:scale-95"
        >
          Lanjutkan ke Pendalaman Kualitatif
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
          onClick={() => { setIsSubmitted(false); if (isInterview) navigate('/wawancara'); else window.location.reload(); }}
          className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          {isInterview ? 'Kembali ke Daftar' : 'Isi Survey Baru'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
          <div className="hidden md:flex h-16 md:h-20 shrink-0 bg-white rounded-2xl items-center justify-center px-4 py-2.5 shadow-sm border border-slate-100 mt-1">
            <img src={logoKemenkes} alt="Logo Kemenkes" className="h-full w-auto object-contain max-w-[200px]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight leading-tight">
              {isInterview ? 'Form Wawancara (Tim Survey)' : 'Survey Optimalisasi Program JKN di Puskesmas / Klinik'}
            </h1>
            {isInterview ? (
              <p className="text-slate-500 mt-2 text-sm max-w-2xl">Anda sedang dalam mode Tim Survey. Anda dapat mengedit jawaban Puskesmas dan mengisi hasil wawancara di Tahap 6.</p>
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
            <button onClick={() => setShowPanduan(true)} className="bg-primary-600 border border-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm">📖 Panduan Pengisian</button>
            <button onClick={() => navigate('/login')} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm">Login Petugas</button>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="mb-10 bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-soft border border-white overflow-x-auto relative z-10">
        <div className="flex items-center justify-between relative min-w-[700px] px-4">
          <div className="absolute left-10 right-10 top-5 transform -translate-y-1/2 h-1 bg-slate-100 rounded-full -z-10"></div>
          <div className="absolute left-10 top-5 transform -translate-y-1/2 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full -z-10 transition-all duration-500 ease-in-out" style={{ width: `calc(${Math.max(0, (step - 1) / (totalSteps - 1)) * 100}% - 2.5rem)` }}></div>
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center relative z-10 w-full group">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-500 shadow-sm ${
                step > s.id ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/40 scale-100'
                  : step === s.id ? 'bg-primary-600 text-white ring-4 ring-primary-100 scale-110 shadow-xl'
                  : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.id}
              </div>
              <span className={`mt-3 text-xs font-semibold transition-colors duration-300 ${step === s.id ? 'text-primary-600' : step > s.id ? 'text-slate-800' : 'text-slate-400'}`}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft-lg border border-white relative z-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/50 rounded-full blur-[80px] pointer-events-none"></div>
        <form onSubmit={(e) => e.preventDefault()} className="animate-fade-in relative z-10">
          <div className="p-8 sm:p-12">

            {/* ===== STEP 1: IDENTITAS ===== */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">A. Identitas Responden</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isInterview && user?.role !== 'admin' ? (
                    <>
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Puskesmas / Klinik</label><input type="text" value={formData.fktpName} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 outline-none" /></div>
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Provinsi</label><input type="text" value={formData.provinsi} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 outline-none" /></div>
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Kabupaten/Kota</label><input type="text" value={formData.kabKota} readOnly className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 outline-none" /></div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Provinsi</label>
                        <div className={showErrors && !formData.provinsi ? 'ring-2 ring-rose-500 rounded-lg shadow-sm' : ''}>
                          <SearchableSelect name="provinsi" options={provinsiList} value={formData.provinsi} onChange={(val) => { setFormData(prev => ({ ...prev, provinsi: val, kabKota: '', fktpName: '' })); }} placeholder="-- Pilih Provinsi --" />
                        </div>
                        {showErrors && !formData.provinsi && <p className="text-xs text-rose-500 mt-1">Provinsi wajib dipilih</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Kabupaten/Kota</label>
                        <div className={showErrors && !formData.kabKota ? 'ring-2 ring-rose-500 rounded-lg shadow-sm' : ''}>
                          <SearchableSelect name="kabKota" options={kabKotaList} value={formData.kabKota} onChange={(val) => { setFormData(prev => ({ ...prev, kabKota: val, fktpName: '' })); }} disabled={!formData.provinsi} placeholder="-- Pilih Kab/Kota --" allowManual={true} />
                        </div>
                        {!formData.provinsi ? <p className="text-xs text-amber-600 mt-1">Pilih provinsi terlebih dahulu</p> : showErrors && !formData.kabKota ? <p className="text-xs text-rose-500 mt-1">Kab/Kota wajib diisi</p> : null}
                      </div>

                      {formData.kabKota && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-3">Jenis Faskes / Responden</label>
                          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${showErrors && !formData.jenisFaskes ? 'p-2 ring-2 ring-rose-500 rounded-xl bg-rose-50/50' : ''}`}>
                            {['Puskesmas / Klinik', 'Dokter Praktik Mandiri'].map(jf => (
                              <label key={jf} className={`relative flex items-center justify-center px-4 py-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 text-center leading-tight group ${
                                formData.jenisFaskes === jf ? 'border-primary-500 bg-primary-50/50 text-primary-700 font-bold shadow-md shadow-primary-500/10 scale-[1.02]' : 'border-slate-100 bg-white hover:border-primary-300 hover:bg-slate-50 text-slate-600'
                              }`}>
                                <input type="radio" name="jenisFaskes" value={jf} checked={formData.jenisFaskes === jf} onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({ ...prev, jenisFaskes: val, role: val === 'Dokter Praktik Mandiri' ? 'Dokter Praktik Mandiri' : '', fktpName: '' }));
                                }} className="hidden" />
                                <span className="text-sm font-medium">{jf}</span>
                              </label>
                            ))}
                          </div>
                          {showErrors && !formData.jenisFaskes && <p className="text-xs text-rose-500 mt-1">Jenis Faskes wajib dipilih</p>}
                        </div>
                      )}

                      {formData.jenisFaskes && (
                      <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">
                          {isRoleDpm ? 'Nama Praktik Dokter Mandiri' : 'Nama Puskesmas / Klinik'}
                        </label>
                        <div className={showErrors && !formData.fktpName && formData.kabKota ? 'ring-2 ring-rose-500 rounded-lg' : ''}>
                          <SearchableSelect 
                            name="fktpName" 
                            options={faskesList} 
                            value={formData.fktpName} 
                            onChange={(val) => handleInputChange({ target: { name: 'fktpName', value: val } })} 
                            disabled={!formData.kabKota} 
                            placeholder={isRoleDpm ? "-- Pilih atau Ketik Nama DPM --" : "-- Pilih atau Ketik Puskesmas / Klinik --"} 
                            allowManual={true} 
                          />
                        </div>
                        {!formData.kabKota ? <p className="text-xs text-amber-600 mt-1">Pilih Kab/Kota terlebih dahulu</p> : showErrors && !formData.fktpName ? <p className="text-xs text-rose-500 mt-1">Nama Faskes wajib diisi</p> : null}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Kode Faskes BPJS</label>
                        <input type="text" name="kodeFaskes" value={formData.kodeFaskes} onChange={handleInputChange} placeholder="Contoh: 0101G00001" className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300 ${showErrors && !formData.kodeFaskes ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} />
                        {showErrors && !formData.kodeFaskes && <p className="text-xs text-rose-500 mt-1">Kode Faskes wajib diisi</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 mt-1 sm:mt-0">Nama Responden</label>
                        <input type="text" name="namaResponden" value={formData.namaResponden} onChange={handleInputChange} placeholder="Nama lengkap responden" className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300 ${showErrors && !formData.namaResponden ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} />
                        {showErrors && !formData.namaResponden && <p className="text-xs text-rose-500 mt-1">Nama Responden wajib diisi</p>}
                      </div>
                      </>
                      )}
                    </>
                  )}
                  {formData.jenisFaskes === 'Puskesmas / Klinik' && (
                  <>
                  <div className="md:col-span-2">
                    <div className="mb-3"><label className="block text-sm font-semibold text-slate-700 mb-1">Jabatan <span className="text-xs text-slate-400 font-normal ml-1">(Pilih salah satu)</span></label></div>
                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-2 rounded-2xl ${showErrors && !formData.role ? 'ring-2 ring-rose-500 bg-rose-50/50' : ''}`}>
                      {['Kepala Puskesmas', 'Dokter Umum', 'Dokter Sp.KKLP', 'Tenaga Kesehatan Fungsional (Dokter Gigi, Bidan, Perawat, Farmasi)'].map(role => (
                        <label key={role} className={`relative flex items-center justify-center px-4 py-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 text-center leading-tight group ${
                          formData.role === role ? 'border-primary-500 bg-primary-50/50 text-primary-700 font-bold shadow-md shadow-primary-500/10 scale-[1.02]' : 'border-slate-100 bg-white hover:border-primary-300 hover:bg-slate-50 text-slate-600'
                        }`}>
                          {formData.role === role && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>}
                          <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleInputChange} className="hidden" required />
                          <span className="text-xs sm:text-sm">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Apakah Puskesmas / Klinik memiliki Dokter Sp.KKLP?
                      <span className="block text-xs text-slate-400 font-normal mt-0.5">(baik Berpraktik maupun tidak berpraktik sebagai Sp.KKLP)</span>
                    </label>
                    <div className={`flex gap-4 ${showErrors && !formData.docKklp ? 'p-2 ring-2 ring-rose-500 rounded-xl bg-rose-50/50' : ''}`}>
                      {['Ya', 'Tidak'].map(opt => (
                        <label key={opt} className={`flex items-center gap-3 px-6 py-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                          formData.docKklp === opt ? 'border-primary-500 bg-primary-50/50 text-primary-700 font-bold shadow-md shadow-primary-500/10' : 'border-slate-100 bg-white hover:border-primary-300 hover:bg-slate-50 text-slate-600'
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
                  </>
                  )}
                </div>
              </div>
            )}

            {/* ===== STEP 2: SURVEI DPM ===== */}
            {step === 2 && isRoleDpm && (
              <SurveiDPM formData={formData} setFormData={setFormData} showErrors={showErrors} />
            )}

            {/* ===== STEP 2: KOMPETENSI DOKTER ===== */}
            {step === 2 && !isRoleDpm && (
              <div className="space-y-8">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">B. Kompetensi Dokter &amp; Beban Kerja</h2>
                </div>

                {!isRoleDoctor ? (
                  <div className="text-center py-16 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Info className="w-8 h-8" /></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Bagian Khusus Dokter</h3>
                    <p className="text-slate-500 max-w-md mx-auto">Bagian ini hanya diperuntukkan bagi responden <strong>Dokter Umum</strong> dan <strong>Dokter Sp.KKLP</strong>.</p>
                    <p className="text-slate-500 mt-4 font-medium">Silakan klik "Selanjutnya" di bawah untuk melewati bagian ini.</p>
                  </div>
                ) : (
                  <>
                    {/* Beban Kerja */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Rata-rata waktu Poli (mnt/pasien)</label><input type="number" name="timeInPoli" value={formData.timeInPoli} onChange={handleInputChange} placeholder="Contoh: 10" className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300 ${showErrors && !formData.timeInPoli ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} /></div>
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Rata-rata waktu Home Visit (mnt/pasien)</label><input type="number" name="timeHomeVisit" value={formData.timeHomeVisit} onChange={handleInputChange} placeholder="Contoh: 45" className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300 ${showErrors && !formData.timeHomeVisit ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} /></div>
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Beban Dalam Gedung (%)</label><input type="number" name="propInFktp" value={formData.propInFktp} onChange={handleInputChange} placeholder="Contoh: 70" min="0" max="100" className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300 ${showErrors && !formData.propInFktp ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} /></div>
                      <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Beban Luar Gedung (%)</label><input type="number" name="propOutFktp" value={formData.propOutFktp} onChange={handleInputChange} placeholder="Contoh: 30" min="0" max="100" className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-300 ${showErrors && !formData.propOutFktp ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} /></div>
                      {(formData.propInFktp !== '' || formData.propOutFktp !== '') && (
                        <div className="md:col-span-2">
                          {propTotal === 100 ? <p className="text-xs text-emerald-600 font-medium">✅ Total beban: {propTotal}% — sudah proporsional.</p>
                            : propTotal > 100 ? <p className="text-xs text-rose-600 font-medium">⚠️ Total melebihi 100% ({propTotal}%). Harap kurangi salah satu nilai.</p>
                            : <p className="text-xs text-amber-600 font-medium">⚠️ Total beban: {propTotal}% — harus berjumlah tepat 100%.</p>}
                        </div>
                      )}
                    </div>

                    {/* Tabel Kompetensi */}
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-3">
                        {isRoleSpKklp ? '🩺 Kompetensi Layanan — Diisi oleh Dokter Sp.KKLP' : '🩺 Kompetensi Layanan — Diisi oleh Dokter Umum'}
                      </p>
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
                                        <input type="radio" className="hidden" name={`komp-${idx}`} value={status} checked={formData.kompetensi[idx]?.status === status} onChange={(e) => handleNestedChange('kompetensi', idx, 'status', e.target.value)} />
                                        {status === 'sudah' ? 'Sudah' : 'Belum'}
                                      </label>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input type="text" placeholder="Kendala (jika belum)..." className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300" disabled={formData.kompetensi[idx]?.status === 'sudah'} value={formData.kompetensi[idx]?.kendala || ''} onChange={(e) => handleNestedChange('kompetensi', idx, 'kendala', e.target.value)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(() => {
                        const belumDipilih = kompetensiLayanan.filter((_, idx) => !formData.kompetensi[idx]?.status).length;
                        return belumDipilih > 0 ? <p className="text-xs text-amber-600 font-medium mt-3">⚠️ Masih ada <strong>{belumDipilih} layanan</strong> yang belum dipilih status-nya.</p> : <p className="text-xs text-emerald-600 font-medium mt-3">✅ Semua status kompetensi sudah diisi.</p>;
                      })()}
                    </div>

                    {/* Bagian Khusus Sp.KKLP */}
                    {isRoleSpKklp && (
                      <div className="space-y-6 border-t border-blue-100 pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                          <h3 className="text-base font-bold text-blue-800">Bagian Khusus Dokter Sp.KKLP</h3>
                        </div>

                        {/* Apakah berpraktik */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">Apakah Anda berpraktik sebagai dokter Sp.KKLP? <span className="text-rose-500">*</span></label>
                          <div className={`flex gap-4 ${showErrors && !formData.spkklpBerpraktik ? 'p-2 ring-2 ring-rose-500 rounded-xl bg-rose-50/50' : ''}`}>
                            {['Ya', 'Tidak'].map(opt => (
                              <label key={opt} className={`flex items-center gap-3 px-5 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                                formData.spkklpBerpraktik === opt ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                              }`}>
                                <input type="radio" name="spkklpBerpraktik" value={opt} checked={formData.spkklpBerpraktik === opt} onChange={handleInputChange} className="hidden" />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.spkklpBerpraktik === opt ? 'border-blue-500' : 'border-slate-300'}`}>
                                  {formData.spkklpBerpraktik === opt && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                </div>
                                <span className="text-sm">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Apakah punya poli SpKKLP */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">Apakah Sp.KKLP memiliki Poli Sp.KKLP? <span className="text-rose-500">*</span></label>
                          <div className={`flex gap-4 ${showErrors && !formData.spkklpPoli?.hasPoli ? 'p-2 ring-2 ring-rose-500 rounded-xl bg-rose-50/50' : ''}`}>
                            {['Ya', 'Tidak'].map(opt => (
                              <label key={opt} className={`flex items-center gap-3 px-5 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                                formData.spkklpPoli?.hasPoli === opt ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                              }`}>
                                <input type="radio" name="spkklpPoli-hasPoli" value={opt} checked={formData.spkklpPoli?.hasPoli === opt} onChange={(e) => setFormData(prev => ({ ...prev, spkklpPoli: { ...prev.spkklpPoli, hasPoli: e.target.value } }))} className="hidden" />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.spkklpPoli?.hasPoli === opt ? 'border-blue-500' : 'border-slate-300'}`}>
                                  {formData.spkklpPoli?.hasPoli === opt && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                </div>
                                <span className="text-sm">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {formData.spkklpPoli?.hasPoli === 'Ya' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Sejak kapan poli KKLP beroperasi? <span className="text-rose-500">*</span></label><input type="text" placeholder="Contoh: Januari 2024" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${showErrors && !formData.spkklpPoli?.sejak?.trim() ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.spkklpPoli?.sejak || ''} onChange={(e) => setFormData(prev => ({ ...prev, spkklpPoli: { ...prev.spkklpPoli, sejak: e.target.value } }))} /></div>
                            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Rata-rata jumlah kunjungan per bulan <span className="text-rose-500">*</span></label><input type="number" placeholder="Jumlah" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${showErrors && !formData.spkklpPoli?.kunjungan ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.spkklpPoli?.kunjungan || ''} onChange={(e) => setFormData(prev => ({ ...prev, spkklpPoli: { ...prev.spkklpPoli, kunjungan: e.target.value } }))} /></div>
                            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Mekanisme pasien masuk ke Poli KKLP</label>
                              <div className="flex flex-col gap-1">{['Dari poli umum', 'Rujukan internal', 'Langsung datang', 'Lainnya'].map(m => (
                                <label key={m} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={formData.spkklpPoli?.[`mek_${m}`] || false} onChange={(e) => setFormData(prev => ({ ...prev, spkklpPoli: { ...prev.spkklpPoli, [`mek_${m}`]: e.target.checked } }))} className="rounded" />{m}</label>
                              ))}</div>
                            </div>
                            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Mekanisme pembiayaan layanan Poli KKLP <span className="text-rose-500">*</span></label><input type="text" placeholder="Jelaskan..." className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${showErrors && !formData.spkklpPoli?.pembiayaan?.trim() ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.spkklpPoli?.pembiayaan || ''} onChange={(e) => setFormData(prev => ({ ...prev, spkklpPoli: { ...prev.spkklpPoli, pembiayaan: e.target.value } }))} /></div>
                          </div>
                        )}

                        {formData.spkklpPoli?.hasPoli === 'Tidak' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nama diagnosis yang ditangani Sp.KKLP (cantumkan Kode ICD-10) <span className="text-rose-500">*</span></label><textarea rows={2} placeholder="Contoh: DM tipe 2 (E11), Hipertensi esensial (I10)" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none ${showErrors && !formData.spkklpPoli?.diagnosis?.trim() ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.spkklpPoli?.diagnosis || ''} onChange={(e) => setFormData(prev => ({ ...prev, spkklpPoli: { ...prev.spkklpPoli, diagnosis: e.target.value } }))} /></div>
                            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tindakan/Prosedur yang dilakukan <span className="text-rose-500">*</span></label><textarea rows={2} placeholder="Jelaskan..." className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none ${showErrors && !formData.spkklpPoli?.tindakan?.trim() ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.spkklpPoli?.tindakan || ''} onChange={(e) => setFormData(prev => ({ ...prev, spkklpPoli: { ...prev.spkklpPoli, tindakan: e.target.value } }))} /></div>
                            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Luaran pelayanan (centang semua yang sesuai)</label>
                              <div className="flex flex-col gap-1">{['Selesai di Puskesmas / Klinik', 'Kontrol berkala di Puskesmas / Klinik', 'Home care', 'Paliatif', 'PRB', 'Rujukan ke FKRTL', 'Lainnya'].map(l => (
                                <label key={l} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={formData.spkklpPoli?.[`luaran_${l}`] || false} onChange={(e) => setFormData(prev => ({ ...prev, spkklpPoli: { ...prev.spkklpPoli, [`luaran_${l}`]: e.target.checked } }))} className="rounded" />{l}</label>
                              ))}</div>
                            </div>
                          </div>
                        )}

                        {/* Apakah ada kasus yang belum bisa dilakukan */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-3">Apakah terdapat kasus yang secara kompetensi dapat ditangani Sp.KKLP namun belum dapat dilaksanakan di Puskesmas / Klinik? <span className="text-rose-500">*</span></label>
                          <div className={`flex gap-4 ${showErrors && !formData.spkklpKendala?.hasKendala ? 'p-2 ring-2 ring-rose-500 rounded-xl bg-rose-50/50' : ''}`}>
                            {['Ya', 'Tidak'].map(opt => (
                              <label key={opt} className={`flex items-center gap-3 px-5 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                                formData.spkklpKendala?.hasKendala === opt ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                              }`}>
                                <input type="radio" value={opt} checked={formData.spkklpKendala?.hasKendala === opt} onChange={(e) => setFormData(prev => ({ ...prev, spkklpKendala: { ...prev.spkklpKendala, hasKendala: e.target.value } }))} className="hidden" />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.spkklpKendala?.hasKendala === opt ? 'border-blue-500' : 'border-slate-300'}`}>
                                  {formData.spkklpKendala?.hasKendala === opt && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                </div>
                                <span className="text-sm">{opt}</span>
                              </label>
                            ))}
                          </div>
                          {formData.spkklpKendala?.hasKendala === 'Ya' && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Sebutkan diagnosisnya <span className="text-rose-500">*</span></label><textarea rows={2} placeholder="Tulis diagnosis..." className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none ${showErrors && !formData.spkklpKendala?.diagnosis?.trim() ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.spkklpKendala?.diagnosis || ''} onChange={(e) => setFormData(prev => ({ ...prev, spkklpKendala: { ...prev.spkklpKendala, diagnosis: e.target.value } }))} /></div>
                              <div><label className="block text-xs font-semibold text-slate-700 mb-1">Sebutkan tindakan/prosedur yang diperlukan <span className="text-rose-500">*</span></label><textarea rows={2} placeholder="Tulis tindakan..." className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none ${showErrors && !formData.spkklpKendala?.tindakan?.trim() ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.spkklpKendala?.tindakan || ''} onChange={(e) => setFormData(prev => ({ ...prev, spkklpKendala: { ...prev.spkklpKendala, tindakan: e.target.value } }))} /></div>
                              <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-2">Kendala utama (centang semua yang sesuai)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{['SDM', 'Sarana prasarana', 'Alat kesehatan', 'Obat', 'Pembiayaan', 'Regulasi', 'Lainnya'].map(k => (
                                  <label key={k} className="flex items-center gap-2 text-xs cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><input type="checkbox" checked={formData.spkklpKendala?.[`kendala_${k}`] || false} onChange={(e) => setFormData(prev => ({ ...prev, spkklpKendala: { ...prev.spkklpKendala, [`kendala_${k}`]: e.target.checked } }))} className="rounded" />{k}</label>
                                ))}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===== STEP 3: PERSPEKTIF SPKKLP (SEMUA RESPONDEN) ===== */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">C. Perspektif terhadap Sp.KKLP di Puskesmas / Klinik</h2>
                </div>

                {/* Relevansi SpKKLP */}
                <div>
                  <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4 flex items-start space-x-3 mb-4">
                    <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-indigo-900">
                      <span className="font-semibold block mb-1">Panduan Penilaian Skala (1-4):</span>
                      <ul className="list-decimal pl-5 space-y-0.5">
                        <li>Sangat Tidak Setuju</li><li>Tidak Setuju</li><li>Setuju</li><li>Sangat Setuju</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mb-3">Menurut Anda, seberapa relevan kegiatan berikut untuk didukung oleh kompetensi dokter Sp.KKLP di Puskesmas / Klinik?</p>
                  <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-700 w-3/5">Kegiatan</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">Skala (1-4)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {relevansiItems.map((item, idx) => (
                          <tr key={idx} className={`transition-colors ${showErrors && !formData.relevansiSpkklp[idx] ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="px-4 py-3 text-slate-800 text-xs md:text-sm">{item}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                {[
                                  { val: 1, label: 'Sangat Tidak Setuju' },
                                  { val: 2, label: 'Tidak Setuju' },
                                  { val: 3, label: 'Setuju' },
                                  { val: 4, label: 'Sangat Setuju' }
                                ].map(opt => {
                                  const isSelected = formData.relevansiSpkklp[idx] === opt.val.toString();
                                  return (
                                    <label key={opt.val} className={`flex items-center gap-2 cursor-pointer transition-all ${isSelected ? 'text-indigo-700 font-semibold' : 'text-slate-600 hover:text-indigo-600'}`}>
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-600' : 'border-slate-300'}`}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                                      </div>
                                      <input type="radio" className="hidden" name={`rel-${idx}`} value={opt.val} checked={isSelected} onChange={(e) => setFormData(prev => ({ ...prev, relevansiSpkklp: { ...prev.relevansiSpkklp, [idx]: e.target.value } }))} />
                                      <span className="text-xs whitespace-nowrap">{opt.val} - {opt.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Layanan yang masih sering dirujuk */}
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-3">Menurut Anda, layanan apa yang masih sering dirujuk ke FKRTL tetapi seharusnya dapat ditangani di Puskesmas / Klinik? <span className="font-normal text-slate-500">(centang semua yang sesuai)</span></p>
                  <div className="grid grid-cols-1 gap-2">
                    {layananDirujukItems.map((item, idx) => (
                      <label key={idx} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.layananDirujuk[idx] ? 'border-indigo-400 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                        <input type="checkbox" checked={formData.layananDirujuk[idx] || false} onChange={(e) => handleCheckboxGroup('layananDirujuk', idx, e.target.checked)} className="mt-0.5 rounded" />
                        <span className="text-xs md:text-sm">{item}</span>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg">
                      <span className="text-xs text-slate-600 font-medium shrink-0">Lainnya:</span>
                      <input type="text" placeholder="Sebutkan..." className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none" value={formData.layananDirujuk?.lainnya || ''} onChange={(e) => setFormData(prev => ({ ...prev, layananDirujuk: { ...prev.layananDirujuk, lainnya: e.target.value } }))} />
                    </div>
                  </div>
                </div>

                {/* Layanan SpKKLP yang belum berjalan */}
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-3">Menurut Anda, layanan apa yang seharusnya dapat dilakukan oleh dokter Sp.KKLP tetapi saat ini belum berjalan atau belum optimal di Puskesmas / Klinik Anda? <span className="font-normal text-slate-500">(centang semua yang sesuai)</span></p>
                  <div className="grid grid-cols-1 gap-2">
                    {layananBelumBerjalanItems.map((item, idx) => (
                      <label key={idx} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.layananBelumBerjalan[idx] ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                        <input type="checkbox" checked={formData.layananBelumBerjalan[idx] || false} onChange={(e) => handleCheckboxGroup('layananBelumBerjalan', idx, e.target.checked)} className="mt-0.5 rounded" />
                        <span className="text-xs md:text-sm">{item}</span>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg">
                      <span className="text-xs text-slate-600 font-medium shrink-0">Lainnya:</span>
                      <input type="text" placeholder="Sebutkan..." className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none" value={formData.layananBelumBerjalan?.lainnya || ''} onChange={(e) => setFormData(prev => ({ ...prev, layananBelumBerjalan: { ...prev.layananBelumBerjalan, lainnya: e.target.value } }))} />
                    </div>
                  </div>
                </div>

                {/* PRB Section */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-base font-bold text-slate-800">Program Rujuk Balik (PRB)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah peserta PRB saat ini <span className="text-rose-500">*</span></label><input type="number" placeholder="Jumlah" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${showErrors && !formData.prb?.jumlah ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.prb?.jumlah || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, jumlah: e.target.value } }))} /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Peserta PRB rutin kunjungan ≥1x/bulan (3 bln terakhir) <span className="font-normal text-slate-400">(tidak wajib)</span></label><input type="number" placeholder="Jumlah" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.rutinKunjungan || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, rutinKunjungan: e.target.value } }))} /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Peserta PRB tidak berkunjung 3 bulan terakhir <span className="font-normal text-slate-400">(tidak wajib)</span></label><input type="number" placeholder="Jumlah" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.tidakBerkunjung || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, tidakBerkunjung: e.target.value } }))} /></div>

                    <div className="md:col-span-2 mt-2">
                      <label className="block text-xs font-bold text-slate-800 mb-2 border-b pb-1">Jumlah peserta PRB berdasarkan diagnosis (isian angka):</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div><label className="block text-xs text-slate-700 mb-1">DM <span className="text-rose-500">*</span></label><input type="number" placeholder="0" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${showErrors && !formData.prb?.peserta_dm ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.prb?.peserta_dm || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_dm: e.target.value } }))} /></div>
                        <div><label className="block text-xs text-slate-700 mb-1">Hipertensi <span className="text-rose-500">*</span></label><input type="number" placeholder="0" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${showErrors && !formData.prb?.peserta_ht ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.prb?.peserta_ht || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_ht: e.target.value } }))} /></div>
                        <div><label className="block text-xs text-slate-700 mb-1">Jantung</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.peserta_jantung || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_jantung: e.target.value } }))} /></div>
                        <div><label className="block text-xs text-slate-700 mb-1">PPOK</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.peserta_ppok || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_ppok: e.target.value } }))} /></div>
                        <div><label className="block text-xs text-slate-700 mb-1">Asma</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.peserta_asma || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_asma: e.target.value } }))} /></div>
                        <div><label className="block text-xs text-slate-700 mb-1">Stroke</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.peserta_stroke || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_stroke: e.target.value } }))} /></div>
                        <div><label className="block text-xs text-slate-700 mb-1">Epilepsi</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.peserta_epilepsi || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_epilepsi: e.target.value } }))} /></div>
                        <div><label className="block text-xs text-slate-700 mb-1">Skizofrenia</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.peserta_skizofrenia || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_skizofrenia: e.target.value } }))} /></div>
                        <div><label className="block text-xs text-slate-700 mb-1">SLE</label><input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.prb?.peserta_sle || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, peserta_sle: e.target.value } }))} /></div>
                      </div>
                    </div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Rata-rata jumlah rujukan ke FKRTL per bulan <span className="text-rose-500">*</span></label><input type="number" placeholder="Jumlah" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${showErrors && !formData.prb?.rataRujukan ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`} value={formData.prb?.rataRujukan || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, rataRujukan: e.target.value } }))} /></div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Mekanisme pemantauan peserta PRB di Puskesmas / Klinik <span className="text-rose-500">*</span> <span className="font-normal text-slate-400">(centang bisa lebih dari 1)</span></label>
                      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${showErrors && !formData.prb?.mekanisme ? 'p-2 ring-2 ring-rose-500 rounded-lg bg-rose-50/50' : ''}`}>
                        {['Pengingat kunjungan', 'Telepon/WA', 'Kunjungan rumah', 'Tidak ada mekanisme khusus', 'Lainnya'].map(m => (
                          <label key={m} className="flex items-center gap-2 text-xs cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white">
                            <input type="checkbox" checked={formData.prb?.[`mek_${m}`] || false} onChange={(e) => {
                              const hasAny = ['Pengingat kunjungan', 'Telepon/WA', 'Kunjungan rumah', 'Tidak ada mekanisme khusus', 'Lainnya'].some(x => x !== m && formData.prb?.[`mek_${x}`]) || e.target.checked;
                              setFormData(prev => ({ ...prev, prb: { ...prev.prb, [`mek_${m}`]: e.target.checked, mekanisme: hasAny ? 'filled' : '' } }));
                            }} className="rounded" />{m}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Kendala utama dalam pelaksanaan PRB <span className="font-normal text-slate-400">(tidak wajib)</span></label><textarea rows={2} placeholder="Jelaskan kendala..." className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" value={formData.prb?.kendala || ''} onChange={(e) => setFormData(prev => ({ ...prev, prb: { ...prev.prb, kendala: e.target.value } }))} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 4: MANFAAT JKN ===== */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">D. Paket Manfaat JKN Saat Ini</h2>
                </div>
                <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-4 flex items-start space-x-3 mb-6">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <span className="font-semibold block mb-1">Panduan Penilaian Skala (1-4):</span>
                    <ul className="list-decimal pl-5 space-y-0.5"><li>Sangat Tidak Setuju</li><li>Tidak Setuju</li><li>Setuju</li><li>Sangat Setuju</li></ul>
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
                            <div className="flex flex-col gap-2">
                              {[
                                { val: 1, label: 'Sangat Tidak Setuju' },
                                { val: 2, label: 'Tidak Setuju' },
                                { val: 3, label: 'Setuju' },
                                { val: 4, label: 'Sangat Setuju' }
                              ].map(opt => {
                                const isSelected = formData.jkn[idx]?.skala === opt.val.toString();
                                return (
                                  <label key={opt.val} className={`flex items-center gap-2 cursor-pointer transition-all ${isSelected ? 'text-primary-700 font-semibold' : 'text-slate-600 hover:text-primary-600'}`}>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary-600' : 'border-slate-300'}`}>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary-600"></div>}
                                    </div>
                                    <input type="radio" className="hidden" name={`jkn-${idx}`} value={opt.val} checked={isSelected} onChange={(e) => handleNestedChange('jkn', idx, 'skala', e.target.value)} />
                                    <span className="text-xs whitespace-nowrap">{opt.val} - {opt.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3"><input type="text" placeholder="Catatan (opsional)..." className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300" value={formData.jkn[idx]?.catatan || ''} onChange={(e) => handleNestedChange('jkn', idx, 'catatan', e.target.value)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Home Care */}
                <div className="border-t border-slate-100 pt-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                    <h3 className="text-base font-bold text-slate-800">Pelayanan Home Care</h3>
                    <span className="text-xs text-slate-400">(diisi semua responden)</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">Apakah Puskesmas / Klinik pernah memberikan layanan home care dalam 12 bulan terakhir?</p>
                    <div className="flex gap-4">
                      {['Ya', 'Tidak'].map(opt => (
                        <label key={opt} className={`flex items-center gap-3 px-5 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.homeCare?.screening === opt ? 'border-teal-500 bg-teal-50 text-teal-700 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                        }`}>
                          <input type="radio" value={opt} checked={formData.homeCare?.screening === opt} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, screening: e.target.value } }))} className="hidden" />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.homeCare?.screening === opt ? 'border-teal-500' : 'border-slate-300'}`}>{formData.homeCare?.screening === opt && <div className="w-2 h-2 rounded-full bg-teal-500"></div>}</div>
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {formData.homeCare?.screening === 'Ya' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-teal-50/50 border border-teal-100 rounded-xl">
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Siapa tenaga yang biasanya melakukan home care?</label><input type="text" placeholder="Contoh: Dokter, Perawat" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" value={formData.homeCare?.tenaga || ''} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, tenaga: e.target.value } }))} /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Contoh Diagnosis utama pasien home care</label><input type="text" placeholder="Contoh: Stroke, DM" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" value={formData.homeCare?.diagnosis || ''} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, diagnosis: e.target.value } }))} /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-2">Kondisi terakhir pasien (centang semua yang sesuai)</label>
                        <div className="flex flex-col gap-1">{['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].map(k => (
                          <label key={k} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={formData.homeCare?.[`kondisi_${k}`] || false} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, [`kondisi_${k}`]: e.target.checked } }))} className="rounded" />{k}</label>
                        ))}</div>
                      </div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-2">Jenis layanan yang biasanya diberikan (centang semua)</label>
                        <div className="flex flex-col gap-1">{['Pemeriksaan kesehatan', 'Pemantauan penyakit kronis', 'Perawatan luka', 'Rehabilitasi sederhana', 'Edukasi keluarga', 'Lainnya'].map(j => (
                          <label key={j} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={formData.homeCare?.[`jenis_${j}`] || false} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, [`jenis_${j}`]: e.target.checked } }))} className="rounded" />{j}</label>
                        ))}</div>
                      </div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah kunjungan home care per bulan</label><input type="number" placeholder="Jumlah" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" value={formData.homeCare?.jumlahKunjungan || ''} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, jumlahKunjungan: e.target.value } }))} /></div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Apakah terdapat kolaborasi dengan tenaga kesehatan lain?</label>
                        <div className="flex gap-3">{['Ya', 'Tidak'].map(opt => (
                          <label key={opt} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-xs ${formData.homeCare?.kolaborasi === opt ? 'border-teal-500 bg-teal-50 font-semibold text-teal-700' : 'border-slate-200 text-slate-600'}`}><input type="radio" value={opt} checked={formData.homeCare?.kolaborasi === opt} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, kolaborasi: e.target.value } }))} className="hidden" />{opt}</label>
                        ))}</div>
                        {formData.homeCare?.kolaborasi === 'Ya' && <textarea rows={2} placeholder="Sebutkan tenaga dan bentuk kolaborasinya" className="w-full mt-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" value={formData.homeCare?.bentukKolaborasi || ''} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, bentukKolaborasi: e.target.value } }))} />}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Tingkat kepatuhan pasien terhadap rencana terapi</label>
                        <div className="flex gap-2">{['Tinggi (>80%)', 'Sedang (50–80%)', 'Rendah (<50%)'].map(k => (
                          <label key={k} className={`flex-1 text-center px-2 py-2 border rounded-lg cursor-pointer text-xs ${formData.homeCare?.kepatuhan === k ? 'border-teal-500 bg-teal-50 font-semibold text-teal-700' : 'border-slate-200 text-slate-600'}`}><input type="radio" value={k} checked={formData.homeCare?.kepatuhan === k} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, kepatuhan: e.target.value } }))} className="hidden" />{k}</label>
                        ))}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Apakah terdapat perbaikan kondisi pasien?</label>
                        <div className="flex gap-3">{['Ya', 'Tidak'].map(opt => (
                          <label key={opt} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-xs ${formData.homeCare?.perbaikan === opt ? 'border-teal-500 bg-teal-50 font-semibold text-teal-700' : 'border-slate-200 text-slate-600'}`}><input type="radio" value={opt} checked={formData.homeCare?.perbaikan === opt} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, perbaikan: e.target.value } }))} className="hidden" />{opt}</label>
                        ))}</div>
                        {formData.homeCare?.perbaikan === 'Ya' && <textarea rows={2} placeholder="Jelaskan bentuk perbaikannya" className="w-full mt-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" value={formData.homeCare?.bentukPerbaikan || ''} onChange={(e) => setFormData(prev => ({ ...prev, homeCare: { ...prev.homeCare, bentukPerbaikan: e.target.value } }))} />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Paliatif */}
                <div className="border-t border-slate-100 pt-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                    <h3 className="text-base font-bold text-slate-800">Pelayanan Paliatif</h3>
                    <span className="text-xs text-slate-400">(diisi semua responden)</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">Apakah Puskesmas / Klinik pernah memberikan layanan paliatif dalam 12 bulan terakhir?</p>
                    <div className="flex gap-4">
                      {['Ya', 'Tidak'].map(opt => (
                        <label key={opt} className={`flex items-center gap-3 px-5 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.paliatif?.screening === opt ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'
                        }`}>
                          <input type="radio" value={opt} checked={formData.paliatif?.screening === opt} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, screening: e.target.value } }))} className="hidden" />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.paliatif?.screening === opt ? 'border-purple-500' : 'border-slate-300'}`}>{formData.paliatif?.screening === opt && <div className="w-2 h-2 rounded-full bg-purple-500"></div>}</div>
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {formData.paliatif?.screening === 'Ya' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Siapa tenaga yang biasanya melakukan pelayanan paliatif?</label><input type="text" placeholder="Contoh: Dokter, Perawat" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" value={formData.paliatif?.tenaga || ''} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, tenaga: e.target.value } }))} /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Contoh Diagnosis utama pasien paliatif</label><input type="text" placeholder="Contoh: Ca Paru, Stroke lanjut" className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" value={formData.paliatif?.diagnosis || ''} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, diagnosis: e.target.value } }))} /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-2">Kondisi terakhir pasien (centang semua)</label>
                        <div className="flex flex-col gap-1">{['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].map(k => (
                          <label key={k} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={formData.paliatif?.[`kondisi_${k}`] || false} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, [`kondisi_${k}`]: e.target.checked } }))} className="rounded" />{k}</label>
                        ))}</div>
                      </div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-2">Tujuan utama pelayanan paliatif (centang maks 3)</label>
                        <div className="flex flex-col gap-1">{['Pengendalian nyeri', 'Pengendalian gejala', 'Dukungan psikososial', 'Edukasi keluarga/caregiver', 'Perawatan akhir kehidupan', 'Lainnya'].map(t => (
                          <label key={t} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={formData.paliatif?.[`tujuan_${t}`] || false} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, [`tujuan_${t}`]: e.target.checked } }))} className="rounded" />{t}</label>
                        ))}</div>
                      </div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Terapi atau intervensi yang diberikan</label><textarea rows={2} placeholder="Jelaskan..." className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none" value={formData.paliatif?.terapi || ''} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, terapi: e.target.value } }))} /></div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Apakah terdapat kolaborasi dengan tenaga kesehatan lain?</label>
                        <div className="flex gap-3">{['Ya', 'Tidak'].map(opt => (
                          <label key={opt} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-xs ${formData.paliatif?.kolaborasi === opt ? 'border-purple-500 bg-purple-50 font-semibold text-purple-700' : 'border-slate-200 text-slate-600'}`}><input type="radio" value={opt} checked={formData.paliatif?.kolaborasi === opt} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, kolaborasi: e.target.value } }))} className="hidden" />{opt}</label>
                        ))}</div>
                        {formData.paliatif?.kolaborasi === 'Ya' && <textarea rows={2} placeholder="Jelaskan bentuk kolaborasi" className="w-full mt-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none" value={formData.paliatif?.bentukKolaborasi || ''} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, bentukKolaborasi: e.target.value } }))} />}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Tingkat kepatuhan pasien/keluarga terhadap rencana terapi</label>
                        <div className="flex gap-2">{['Tinggi', 'Sedang', 'Rendah'].map(k => (
                          <label key={k} className={`flex-1 text-center px-2 py-2 border rounded-lg cursor-pointer text-xs ${formData.paliatif?.kepatuhan === k ? 'border-purple-500 bg-purple-50 font-semibold text-purple-700' : 'border-slate-200 text-slate-600'}`}><input type="radio" value={k} checked={formData.paliatif?.kepatuhan === k} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, kepatuhan: e.target.value } }))} className="hidden" />{k}</label>
                        ))}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Apakah terdapat perbaikan kualitas hidup pasien?</label>
                        <div className="flex gap-3">{['Ya', 'Tidak'].map(opt => (
                          <label key={opt} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-xs ${formData.paliatif?.perbaikan === opt ? 'border-purple-500 bg-purple-50 font-semibold text-purple-700' : 'border-slate-200 text-slate-600'}`}><input type="radio" value={opt} checked={formData.paliatif?.perbaikan === opt} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, perbaikan: e.target.value } }))} className="hidden" />{opt}</label>
                        ))}</div>
                        {formData.paliatif?.perbaikan === 'Ya' && <textarea rows={2} placeholder="Jelaskan bentuk perbaikan" className="w-full mt-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none" value={formData.paliatif?.bentukPerbaikan || ''} onChange={(e) => setFormData(prev => ({ ...prev, paliatif: { ...prev.paliatif, bentukPerbaikan: e.target.value } }))} />}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== STEP 5: LAYANAN NON-OPTIMAL ===== */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">E. Layanan yang Belum Optimal / Tidak Terakomodasi</h2>
                </div>
                <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-4 flex items-start space-x-3 mb-6">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <span className="font-semibold block mb-1">Panduan Penilaian:</span>
                    Pilih <strong>Ya/Tidak</strong> apakah layanan perlu diakomodasi ke JKN. Berikan nilai <strong>Skala (1-4)</strong>:
                    <ul className="list-decimal pl-5 mt-1 space-y-0.5"><li>Sangat Tidak Setuju</li><li>Tidak Setuju</li><li>Setuju</li><li>Sangat Setuju</li></ul>
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
                                  <input type="radio" className="hidden" name={`masukJkn-${idx}`} value={pilihan} checked={formData.nonOptimal[idx]?.masukJkn === pilihan} onChange={(e) => handleNestedChange('nonOptimal', idx, 'masukJkn', e.target.value)} />
                                  {pilihan}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              {[
                                { val: 1, label: 'Sangat Tidak Setuju' },
                                { val: 2, label: 'Tidak Setuju' },
                                { val: 3, label: 'Setuju' },
                                { val: 4, label: 'Sangat Setuju' }
                              ].map(opt => {
                                const isSelected = formData.nonOptimal[idx]?.skala === opt.val.toString();
                                return (
                                  <label key={opt.val} className={`flex items-center gap-2 cursor-pointer transition-all ${isSelected ? 'text-primary-700 font-semibold' : 'text-slate-600 hover:text-primary-600'}`}>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary-600' : 'border-slate-300'}`}>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary-600"></div>}
                                    </div>
                                    <input type="radio" className="hidden" name={`nonopt-${idx}`} value={opt.val} checked={isSelected} onChange={(e) => handleNestedChange('nonOptimal', idx, 'skala', e.target.value)} />
                                    <span className="text-xs whitespace-nowrap">{opt.val} - {opt.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3"><input type="text" placeholder="Penjelasan..." className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-primary-500 outline-none text-sm placeholder:text-slate-300" value={formData.nonOptimal[idx]?.catatan || ''} onChange={(e) => handleNestedChange('nonOptimal', idx, 'catatan', e.target.value)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== STEP 6: PENDALAMAN KUALITATIF ===== */}
            {step === 6 && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                  <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">F. Pendalaman Kualitatif</h2>
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
                      <label className="block text-sm font-semibold text-slate-800 mb-3 leading-relaxed">{question}</label>
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
            {showErrors && !canProceed() && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-sm font-bold text-rose-700 mb-2">⚠️ Harap lengkapi isian berikut sebelum melanjutkan:</p>
                <ul className="text-sm text-rose-600 space-y-1 list-disc pl-5">
                  {step === 1 && (<>
                    {!formData.provinsi && <li>Provinsi belum dipilih</li>}
                    {!formData.fktpName && <li>Nama Puskesmas / Klinik belum dipilih</li>}
                    {!formData.kodeFaskes && <li>Kode Faskes belum diisi</li>}
                    {!formData.namaResponden && <li>Nama Responden belum diisi</li>}
                    {!formData.role && <li>Jabatan belum dipilih</li>}
                    {!formData.docKklp && <li>Status kepemilikan Sp.KKLP belum dipilih</li>}
                  </>)}
                  {step === 2 && isRoleDpm && (
                    <>
                      {!isStep2Valid && <li>Pastikan semua field pada Survei DPM (A-E) terisi lengkap.</li>}
                    </>
                  )}
                  {step === 2 && !isRoleDpm && isRoleDoctor && (<>
                    {!formData.timeInPoli && <li>Waktu rata-rata poli belum diisi</li>}
                    {!formData.timeHomeVisit && <li>Waktu rata-rata home visit belum diisi</li>}
                    {(!formData.propInFktp || !formData.propOutFktp) && <li>Beban dalam/luar gedung belum diisi</li>}
                    {formData.propInFktp && formData.propOutFktp && propTotal !== 100 && <li>Total beban dalam + luar gedung harus 100% (saat ini: {propTotal}%)</li>}
                    {(() => { const b = kompetensiLayanan.filter((_, i) => !formData.kompetensi[i]?.status).length; return b > 0 ? <li>{b} layanan kompetensi belum dipilih status-nya</li> : null; })()}
                  </>)}
                  {step === 3 && (<>
                    {(() => { const b = relevansiItems.filter((_, i) => !formData.relevansiSpkklp[i]).length; return b > 0 ? <li>{b} item relevansi Sp.KKLP belum diberi nilai</li> : null; })()}
                    {!formData.prb?.mekanisme && <li>Mekanisme pemantauan PRB wajib dipilih minimal 1</li>}
                    {!formData.prb?.rataRujukan && <li>Rata-rata jumlah rujukan ke FKRTL belum diisi</li>}
                  </>)}
                  {step === 4 && (<>
                    {(() => { const b = jknBenefits.filter((_, i) => !formData.jkn[i]?.skala).length; return b > 0 ? <li>{b} layanan JKN belum diberi nilai skala</li> : null; })()}
                    {!isStep4Valid && formData.homeCare?.screening === 'Ya' && <li>Ada isian Pelayanan Home Care yang belum lengkap</li>}
                    {!isStep4Valid && formData.paliatif?.screening === 'Ya' && <li>Ada isian Pelayanan Paliatif yang belum lengkap</li>}
                  </>)}
                  {step === 5 && (<>
                    {(() => { const b = nonOptimalServices.filter((_, i) => !formData.nonOptimal[i]?.masukJkn || !formData.nonOptimal[i]?.skala).length; return b > 0 ? <li>{b} layanan non-optimal belum diisi lengkap</li> : null; })()}
                  </>)}
                  {step === 6 && (<>
                    {(() => { const b = interviewQuestions.filter((_, i) => !formData.wawancara[i]?.trim()).length; return b > 0 ? <li>Ada {b} pertanyaan pendalaman kualitatif yang belum dijawab</li> : null; })()}
                  </>)}
                </ul>
              </div>
            )}
            <div className="flex justify-between items-center">
              <button type="button" onClick={prevStep} disabled={step === 1} className={`flex items-center px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm hover:shadow active:scale-95'}`}>
                <ChevronLeft className="w-5 h-5 mr-1.5" /> Sebelumnya
              </button>
              {step === totalSteps ? (
                <button type="button" onClick={() => submitData(false)} disabled={isSubmitting} className={`flex items-center px-8 py-3 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-emerald-500/40 active:scale-95'}`}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Selesai'}
                  {!isSubmitting && <Save className="w-5 h-5 ml-2" />}
                </button>
              ) : step === totalSteps - 1 && !isRoleDpm ? (
                <button type="button" onClick={() => submitData(true)} disabled={isSubmitting} className={`flex items-center px-8 py-3 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 hover:-translate-y-0.5 hover:shadow-amber-500/40 active:scale-95'}`}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjut Pendalaman'}
                  {!isSubmitting && <ChevronRight className="w-5 h-5 ml-2" />}
                </button>
              ) : (
                <button type="button" onClick={nextStep} className="flex items-center px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-600/30 active:scale-95">
                  Selanjutnya <ChevronRight className="w-5 h-5 ml-1.5" />
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
              <button onClick={() => setShowPanduan(false)} className="text-slate-400 hover:text-red-500 transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="p-6 overflow-y-auto text-slate-700 space-y-6">
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-800"><span className="font-bold block mb-1">ℹ️ Tentang Survey Ini</span>Survey ini bertujuan mengidentifikasi layanan JKN yang sudah berjalan dan yang belum optimal di Puskesmas / Klinik, serta menilai peran dokter Sp.KKLP berdasarkan kondisi nyata di lapangan.</div>
              <section><h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">📍 Tahap 1 — Identitas</h3><ul className="list-disc pl-5 space-y-1 text-sm"><li>Pilih <strong>Provinsi</strong> terlebih dahulu, lalu pilih <strong>Nama Puskesmas / Klinik</strong>.</li><li>Pilih <strong>Jabatan</strong> Anda saat ini.</li><li>Pilih apakah Puskesmas / Klinik memiliki dokter Sp.KKLP.</li></ul></section>
              <section><h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">⏱️ Tahap 2 — Kompetensi Dokter</h3><ul className="list-disc pl-5 space-y-1 text-sm"><li><strong>Khusus Dokter Umum &amp; Sp.KKLP:</strong> isi beban kerja dan tabel kompetensi.</li><li><strong>Khusus Sp.KKLP:</strong> isi tambahan bagian praktik dan poli KKLP.</li><li>Kepala Puskesmas dan Nakes lainnya dapat melewati tahap ini.</li></ul></section>
              <section><h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">🏥 Tahap 3 — Perspektif Sp.KKLP</h3><ul className="list-disc pl-5 space-y-1 text-sm"><li>Nilai relevansi 12 kegiatan Sp.KKLP menggunakan skala 1–4 (Sangat Tidak Setuju s/d Sangat Setuju).</li><li>Centang layanan yang masih sering dirujuk ke RS dan layanan yang belum berjalan di Puskesmas / Klinik.</li><li>Isi informasi Program Rujuk Balik (PRB).</li></ul></section>
              <section><h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">💊 Tahap 4 — Manfaat JKN</h3><ul className="list-disc pl-5 space-y-1 text-sm"><li>Beri nilai skala 1–4 untuk 8 layanan JKN.</li><li>Isi bagian Home Care dan Paliatif jika Puskesmas / Klinik pernah memberikan layanan tersebut.</li></ul></section>
              <section><h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">🔧 Tahap 5 — Layanan Non-Optimal</h3><ul className="list-disc pl-5 space-y-1 text-sm"><li>Untuk setiap layanan, pilih <strong>Masuk JKN</strong> (Ya/Tidak/Tidak Tahu) dan berikan <strong>nilai skala 1–4</strong>.</li></ul></section>
              <section><h3 className="font-bold text-lg text-primary-700 mb-2 border-b pb-2">💬 Tahap 6 — Pendalaman Kualitatif</h3><ul className="list-disc pl-5 space-y-1 text-sm"><li>Jawab 7 pertanyaan terbuka sesuai kondisi nyata di Puskesmas / Klinik Anda.</li><li>Semua pertanyaan wajib diisi sebelum mengirimkan survey.</li></ul></section>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right"><button onClick={() => setShowPanduan(false)} className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-sm">Saya Mengerti, Tutup Panduan</button></div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
