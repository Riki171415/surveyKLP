import React from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ExportButton({ fileName = 'chart' }) {
  const handleExport = async (e) => {
    const btn = e.currentTarget;
    const container = btn.closest('.bg-white.p-6') || btn.closest('.chart-container') || btn.closest('.bg-white');
    if (!container) return;
    
    const originalDisplay = btn.style.display;
    btn.style.display = 'none';
    try {
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName + '.png';
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Failed to export chart', err);
    } finally {
      btn.style.display = originalDisplay;
    }
  };

  return (
    <button onClick={handleExport} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors no-print" title="Simpan sebagai PNG">
      <Download className="w-4 h-4" />
    </button>
  );
}