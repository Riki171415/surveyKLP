import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, PenLine } from 'lucide-react';

/**
 * SearchableSelect with optional manual input fallback.
 * Props:
 *   options        - string[]  : dropdown options
 *   value          - string    : current selected/typed value
 *   onChange       - fn(val)   : called when value changes
 *   placeholder    - string
 *   disabled       - bool
 *   name           - string    : hidden input name
 *   allowManual    - bool      : if true, show "Ketik manual" option when no match
 */
export default function SearchableSelect({ options = [], value, onChange, placeholder, disabled, name, allowManual = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isManual, setIsManual] = useState(false);
  const wrapperRef = useRef(null);
  const manualInputRef = useRef(null);

  // Detect if current value is a manual entry (not in options list)
  useEffect(() => {
    if (value && options.length > 0 && !options.includes(value)) {
      setIsManual(true);
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isManual && manualInputRef.current) {
      manualInputRef.current.focus();
    }
  }, [isManual]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleManualMode = () => {
    setIsOpen(false);
    setIsManual(true);
    onChange('');
  };

  const handleBackToDropdown = () => {
    setIsManual(false);
    onChange('');
    setSearchTerm('');
  };

  if (isManual && allowManual) {
    return (
      <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <PenLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
            <input
              ref={manualInputRef}
              type="text"
              className="w-full pl-9 pr-4 py-2.5 bg-primary-50 border border-primary-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-primary-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
              placeholder={`Ketik nama ${placeholder?.replace('-- Ketik atau Pilih ', '').replace(' --', '') || 'manual'}...`}
              value={value}
              onChange={e => onChange(e.target.value)}
              name={name}
            />
          </div>
          <button
            type="button"
            onClick={handleBackToDropdown}
            className="flex-shrink-0 px-3 py-2.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition-all whitespace-nowrap"
            title="Kembali ke dropdown"
          >
            ← Pilih dari daftar
          </button>
        </div>
        <input type="hidden" name={name} value={value || ''} />
      </div>
    );
  }

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
              <div className="px-4 py-3 text-sm text-slate-500 text-center flex flex-col items-center">
                <span className="italic">Data tidak ditemukan</span>
                {allowManual && searchTerm && (
                  <button 
                    type="button" 
                    className="mt-3 px-4 py-2 bg-primary-100 text-primary-700 font-semibold rounded-lg hover:bg-primary-200 text-xs w-full transition-colors flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(searchTerm);
                      setIsOpen(false);
                      setIsManual(true);
                    }}
                  >
                    <PenLine className="w-3.5 h-3.5" /> Input manual: "{searchTerm}"
                  </button>
                )}
              </div>
            )}
            {allowManual && (
              <div
                className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer text-sm border-t border-slate-200 text-amber-700 font-medium flex items-center gap-2 sticky bottom-0 bg-white"
                onClick={handleManualMode}
              >
                <PenLine className="w-4 h-4" />
                Ketik nama manual...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
