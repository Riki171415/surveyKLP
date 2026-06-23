const fs = require('fs');

let content = fs.readFileSync('./src/components/DataManagement.jsx', 'utf8');

// 1. Add pagination states and lucide icons
content = content.replace(
  "import { Loader2, Search, Edit, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';",
  "import { Loader2, Search, Edit, Trash2, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';"
);

content = content.replace(
  "const [selected, setSelected] = useState(null);",
  "const [selected, setSelected] = useState(null);\n  const [currentPage, setCurrentPage] = useState(1);\n  const itemsPerPage = 20;"
);

// 2. Reset page on search
content = content.replace(
  "onChange={e => setSearchTerm(e.target.value)}",
  "onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}"
);

// 3. Pagination logic
const logicInsertionPoint = `const filtered = surveys.filter(s =>
    (s.fktp_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.provinsi || s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.kab_kota || '').toLowerCase().includes(searchTerm.toLowerCase())
  );`;

const paginationLogic = `
  const filtered = surveys.filter(s =>
    (s.fktp_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.provinsi || s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.kab_kota || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
`;

content = content.replace(logicInsertionPoint, paginationLogic);

// 4. Update the map from filtered.map to paginatedData.map
// Need to be careful. The exact match: `{filtered.map(row => (`
content = content.replace(
  "{filtered.map(row => (",
  "{paginatedData.map(row => ("
);

// 5. Add Pagination Controls after the list
const listEndAnchor = `              </div>
            )}`;

const paginationControls = `              </div>
            )}
            
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}`;

content = content.replace(listEndAnchor, paginationControls);

fs.writeFileSync('./src/components/DataManagement.jsx', content, 'utf8');
console.log('Pagination added!');
