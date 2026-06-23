import React, { useState, useEffect } from 'react';

const MEDICAL_DATA = {
  faskes_tingkat_pertama: {
    deskripsi: "Daftar Diagnosa dan Tindakan di PPK 1 (Puskesmas / Klinik Pratama)",
    daftar_diagnosa: [
      {
        kategori: "Penyakit Infeksi dan Sistem Pernapasan",
        penyakit: [
          { nama_diagnosa: "Tuberkulosis (TB) Paru tanpa komplikasi", kode_icd_10: "A15.0, A16.0" },
          { nama_diagnosa: "Infeksi Saluran Pernapasan Akut (ISPA) / Nasofaringitis Akut", kode_icd_10: "J00" },
          { nama_diagnosa: "Asma Bronkial (Asthma)", kode_icd_10: "J45" },
          { nama_diagnosa: "Demam Dengue / DHF", kode_icd_10: "A91" },
          { nama_diagnosa: "Demam Tifoid / Typhus", kode_icd_10: "A01" }
        ]
      },
      {
        kategori: "Penyakit Sistem Pencernaan dan Metabolik",
        penyakit: [
          { nama_diagnosa: "Gastroenteritis / Diare", kode_icd_10: "A09" },
          { nama_diagnosa: "Diabetes Melitus Tipe 2 Tanpa Komplikasi", kode_icd_10: "E11" },
          { nama_diagnosa: "Hipertensi Esensial", kode_icd_10: "I10" },
          { nama_diagnosa: "Obesitas", kode_icd_10: "E66" }
        ]
      },
      {
        kategori: "Penyakit Mata, Telinga, dan Saraf",
        penyakit: [
          { nama_diagnosa: "Konjungtivitis", kode_icd_10: "H10" },
          { nama_diagnosa: "Otitis Eksterna", kode_icd_10: "H60" },
          { nama_diagnosa: "Tension Headache", kode_icd_10: "G44.8" },
          { nama_diagnosa: "Migrain", kode_icd_10: "G43.9" }
        ]
      },
      {
        kategori: "Penyakit Kulit dan Kelamin",
        penyakit: [
          { nama_diagnosa: "Scabies / Kudis", kode_icd_10: "B86" },
          { nama_diagnosa: "Kusta Tipe Kering/Basah", kode_icd_10: "A30.1, A30.5" }
        ]
      }
    ],
    daftar_tindakan: [
      {
        kategori: "Tindakan Medik Umum & Kegawatdaruratan",
        tindakan: [
          { nama_tindakan: "Injeksi per tindakan" },
          { nama_tindakan: "Pemasangan dan pelepasan infus" },
          { nama_tindakan: "Pemasangan dan pelepasan kateter urin" },
          { nama_tindakan: "Jahit luka (Hecting) dan angkat jahitan" },
          { nama_tindakan: "Insisi / Eksisi" },
          { nama_tindakan: "Sirkumsisi (Circumsisi)" },
          { nama_tindakan: "Bilas lambung" },
          { nama_tindakan: "Pemeriksaan EKG" }
        ]
      },
      {
        kategori: "Tindakan Kebidanan dan Keluarga Berencana (KB)",
        tindakan: [
          { nama_tindakan: "Persalinan Normal (Partus Normal)" },
          { nama_tindakan: "Pemasangan dan pencabutan IUD (AKDR)" },
          { nama_tindakan: "Pemasangan dan pencabutan Implan" },
          { nama_tindakan: "Suntik KB" },
          { nama_tindakan: "Vasektomi (KBMOP)" },
          { nama_tindakan: "Pemeriksaan IVA (Inspeksi Visual Asam Asetat)" },
          { nama_tindakan: "Pemeriksaan Pap Smear" }
        ]
      },
      {
        kategori: "Tindakan Kesehatan Gigi dan Mulut",
        tindakan: [
          { nama_tindakan: "Pembersihan Karang Gigi (Scaling gigi pada gingivitis akut)" },
          { nama_tindakan: "Tumpatan gigi (GIC / Komposit)" },
          { nama_tindakan: "Pencabutan gigi sulung dan permanen tanpa penyulit" }
        ]
      },
      {
        kategori: "Pelayanan Skrining Kesehatan",
        tindakan: [
          { nama_tindakan: "Pemeriksaan Gula Darah" },
          { nama_tindakan: "Pemeriksaan Asam Urat / Kolesterol" },
          { nama_tindakan: "Pemeriksaan Hemoglobin (Hb)" },
          { nama_tindakan: "Skrining Penyakit Tidak Menular (PTM)" }
        ]
      }
    ]
  }
};

const ListSelectorModal = ({ isOpen, onClose, onSelect, type = 'diagnosa' }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
      setSearchTerm('');
      
      // Auto-expand first category by default
      const initialExpanded = {};
      const list = type === 'diagnosa' 
        ? MEDICAL_DATA.faskes_tingkat_pertama.daftar_diagnosa 
        : MEDICAL_DATA.faskes_tingkat_pertama.daftar_tindakan;
      
      if (list && list.length > 0) {
        initialExpanded[0] = true;
      }
      setExpandedCategories(initialExpanded);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const dataList = type === 'diagnosa' 
    ? MEDICAL_DATA.faskes_tingkat_pertama.daftar_diagnosa 
    : MEDICAL_DATA.faskes_tingkat_pertama.daftar_tindakan;

  const title = type === 'diagnosa' ? 'Pilih Diagnosa' : 'Pilih Tindakan';

  const toggleCategory = (index) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleToggleItem = (itemText) => {
    setSelectedItems(prev => {
      if (prev.includes(itemText)) {
        return prev.filter(i => i !== itemText);
      } else {
        return [...prev, itemText];
      }
    });
  };

  const handleSave = () => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems.join(', '));
    }
    onClose();
  };

  const formatItemLabel = (item) => {
    if (type === 'diagnosa') {
      return `${item.nama_diagnosa} (${item.kode_icd_10})`;
    }
    return item.nama_tindakan;
  };

  const filteredDataList = dataList.map((category, index) => {
    const items = type === 'diagnosa' ? category.penyakit : category.tindakan;
    const filteredItems = items.filter(item => {
      const label = formatItemLabel(item).toLowerCase();
      return label.includes(searchTerm.toLowerCase());
    });

    return {
      ...category,
      originalIndex: index,
      filteredItems
    };
  }).filter(category => category.filteredItems.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 transition-all">
      <div className="bg-white w-full sm:w-full sm:max-w-xl h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl animate-slide-up sm:animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder={`Cari ${type}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedItems.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center mr-1">Terpilih:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {selectedItems.length} item
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {filteredDataList.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Pencarian tidak ditemukan.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDataList.map((category) => {
                const isExpanded = searchTerm !== '' || expandedCategories[category.originalIndex];
                
                return (
                  <div key={category.kategori} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <button 
                      onClick={() => toggleCategory(category.originalIndex)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="font-semibold text-sm text-slate-800">{category.kategori}</span>
                      <svg 
                        className={`h-5 w-5 text-slate-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-2 py-2">
                        {category.filteredItems.map((item, idx) => {
                          const itemLabel = formatItemLabel(item);
                          const isChecked = selectedItems.includes(itemLabel);
                          
                          return (
                            <label 
                              key={idx} 
                              className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-primary-50/50' : 'hover:bg-slate-50'}`}
                            >
                              <div className="flex items-center h-5 mt-0.5">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                                  checked={isChecked}
                                  onChange={() => handleToggleItem(itemLabel)}
                                />
                              </div>
                              <div className="ml-3 flex-1 text-sm">
                                {type === 'diagnosa' ? (
                                  <>
                                    <span className="font-medium text-slate-800">{item.nama_diagnosa}</span>
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                      {item.kode_icd_10}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-800">{item.nama_tindakan}</span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white sm:rounded-b-2xl">
          <button
            onClick={handleSave}
            disabled={selectedItems.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-center transition-all ${
              selectedItems.length === 0 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {selectedItems.length > 0 
              ? `Tambahkan ${selectedItems.length} Pilihan ke Form` 
              : 'Pilih minimal satu item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListSelectorModal;
