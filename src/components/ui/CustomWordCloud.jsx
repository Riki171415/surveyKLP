import React from 'react';

export default function CustomWordCloud({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-400 text-sm italic py-4 text-center">Data tidak tersedia</div>;
  }

  const minFreq = Math.min(...data.map(d => d.value));
  const maxFreq = Math.max(...data.map(d => d.value));
  
  const minSize = 12;
  const maxSize = 36;
  
  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6', '#f43f5e'];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 p-4 min-h-[200px] content-center text-center">
      {data.map((item, i) => {
        let fontSize = minSize;
        if (maxFreq > minFreq) {
          fontSize = minSize + ((item.value - minFreq) / (maxFreq - minFreq)) * (maxSize - minSize);
        }
        
        const color = colors[i % colors.length];
        
        return (
          <span 
            key={i}
            className="inline-block transition-transform hover:scale-110 cursor-default"
            style={{ 
              fontSize: `${fontSize}px`, 
              color: color,
              fontWeight: fontSize > 20 ? 'bold' : fontSize > 16 ? '600' : '500',
              opacity: fontSize < 16 ? 0.7 : 1
            }}
            title={`Frekuensi: ${item.value}`}
          >
            {item.text}
          </span>
        );
      })}
    </div>
  );
}
