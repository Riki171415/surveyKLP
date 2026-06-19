const fs = require('fs');
const path = './src/components/DataManagement.jsx';
let content = fs.readFileSync(path, 'utf8');

const injection = `
              {/* ── Home Care ── */}
              {selected.home_care && selected.home_care.screening === 'ya' && (
                <div>
                  <SectionHeader label="Pelayanan Home Care" />
                  <div className="space-y-2 text-xs">
                    <p><span className="font-semibold">Tenaga:</span> {selected.home_care.tenaga}</p>
                    <p><span className="font-semibold">Diagnosis:</span> {selected.home_care.diagnosis}</p>
                    <p><span className="font-semibold">Kondisi:</span> {selected.home_care.kondisi ? Object.keys(selected.home_care.kondisi).filter(k => selected.home_care.kondisi[k]).join(', ') : ''} {selected.home_care.kondisiLainnya ? \`(\${selected.home_care.kondisiLainnya})\` : ''}</p>
                    <p><span className="font-semibold">Jenis Layanan:</span> {selected.home_care.jenisLayanan ? Object.keys(selected.home_care.jenisLayanan).filter(k => selected.home_care.jenisLayanan[k]).join(', ') : ''} {selected.home_care.jenisLayananLainnya ? \`(\${selected.home_care.jenisLayananLainnya})\` : ''}</p>
                    <p><span className="font-semibold">Jumlah Kunjungan:</span> {selected.home_care.jumlahKunjungan}</p>
                    <p><span className="font-semibold">Kolaborasi:</span> {selected.home_care.kolaborasi === 'ya' ? selected.home_care.bentukKolaborasi : 'Tidak'}</p>
                    <p><span className="font-semibold">Kepatuhan:</span> {selected.home_care.kepatuhan}</p>
                    <p><span className="font-semibold">Perbaikan:</span> {selected.home_care.perbaikan === 'ya' ? selected.home_care.bentukPerbaikan : 'Tidak'}</p>
                  </div>
                </div>
              )}

              {/* ── Paliatif ── */}
              {selected.paliatif && selected.paliatif.screening === 'ya' && (
                <div>
                  <SectionHeader label="Pelayanan Paliatif" />
                  <div className="space-y-2 text-xs">
                    <p><span className="font-semibold">Tenaga:</span> {selected.paliatif.tenaga}</p>
                    <p><span className="font-semibold">Diagnosis:</span> {selected.paliatif.diagnosis}</p>
                    <p><span className="font-semibold">Kondisi:</span> {selected.paliatif.kondisi ? Object.keys(selected.paliatif.kondisi).filter(k => selected.paliatif.kondisi[k]).join(', ') : ''} {selected.paliatif.kondisiLainnya ? \`(\${selected.paliatif.kondisiLainnya})\` : ''}</p>
                    <p><span className="font-semibold">Tujuan:</span> {selected.paliatif.tujuan ? Object.keys(selected.paliatif.tujuan).filter(k => selected.paliatif.tujuan[k]).join(', ') : ''} {selected.paliatif.tujuanLainnya ? \`(\${selected.paliatif.tujuanLainnya})\` : ''}</p>
                    <p><span className="font-semibold">Terapi:</span> {selected.paliatif.terapi}</p>
                    <p><span className="font-semibold">Kolaborasi:</span> {selected.paliatif.kolaborasi === 'ya' ? selected.paliatif.bentukKolaborasi : 'Tidak'}</p>
                    <p><span className="font-semibold">Kepatuhan:</span> {selected.paliatif.kepatuhan}</p>
                    <p><span className="font-semibold">Perbaikan:</span> {selected.paliatif.perbaikan === 'ya' ? selected.paliatif.bentukPerbaikan : 'Tidak'}</p>
                  </div>
                </div>
              )}
`;

const targetAnchor = `                  </div>
                </div>
              )}

              {/* ── E. Layanan Non-Optimal ── */}`;

if (content.includes(targetAnchor)) {
    content = content.replace(targetAnchor, targetAnchor.replace('              {/* ── E. Layanan Non-Optimal ── */}', injection + '\\n              {/* ── E. Layanan Non-Optimal ── */}'));
    fs.writeFileSync(path, content, 'utf8');
    console.log('UI updated successfully!');
} else {
    console.log('Anchor not found.');
}
