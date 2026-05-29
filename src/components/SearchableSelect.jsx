import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder, disabled, name }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
      <div 
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer flex justify-between items-center hover:bg-white transition-all"
        onClick={() => { if (!disabled) setIsOpen(!isOpen); setSearchTerm(''); }}
      >
        <span className={`block truncate ${value ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Hidden input to ensure HTML5 validation still somewhat works if we rely on it, though we mostly rely on our custom state validation */}
      <input type="hidden" name={name} value={value || ''} />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-white p-2 border-b border-slate-100 flex items-center shrink-0 shadow-sm z-10">
            <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
            <input 
              type="text" 
              className="w-full px-3 py-1.5 outline-none text-sm bg-slate-50 rounded-md ml-2"
              placeholder="Ketik untuk mencari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div 
                  key={idx} 
                  className={`px-4 py-2.5 hover:bg-primary-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 ${value === opt ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-slate-700'}`}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-slate-500 text-center italic">Data tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
