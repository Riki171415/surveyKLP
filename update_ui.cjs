const fs = require('fs');

const path = './src/components/SurveyForm.jsx';
let content = fs.readFileSync(path, 'utf8');

const injection = `
                {/* 2. Pelayanan Home Care */}
                <div className="mt-8">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-4">
                    <h3 className="text-lg font-bold text-slate-800">2. Pelayanan Home Care</h3>
                  </div>
                  
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Apakah FKTP pernah memberikan layanan home care dalam 12 bulan terakhir?</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="hc-screening" value="ya" checked={formData.homeCare?.screening === 'ya'} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, screening: 'ya'}}))} />
                          <span className="text-sm">Ya</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="hc-screening" value="tidak" checked={formData.homeCare?.screening === 'tidak'} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, screening: 'tidak'}}))} />
                          <span className="text-sm">Tidak (berhenti ke bagian berikutnya)</span>
                        </label>
                      </div>
                    </div>

                    {formData.homeCare?.screening === 'ya' && (
                      <div className="space-y-4 mt-4 pt-4 border-t border-slate-200">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Siapa tenaga yang biasanya melakukan home care?</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={formData.homeCare?.tenaga || ''} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, tenaga: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Contoh Diagnosis utama pasien yang menerima layanan home care</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={formData.homeCare?.diagnosis || ''} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, diagnosis: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Berdasarkan pasien terakhir dilayani homecare, bagaimana kondisi terakhir pasien secara klinis : (centang, bisa pilih lebih dari 1)</label>
                          <div className="space-y-2">
                            {['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring'].map(k => (
                              <label key={k} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.homeCare?.kondisi?.[k] || false} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, kondisi: {...p.homeCare?.kondisi, [k]: e.target.checked}}}))} />
                                <span className="text-sm">{k}</span>
                              </label>
                            ))}
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Lainnya:</span>
                              <input type="text" className="flex-1 px-3 py-1 border rounded-md text-sm" value={formData.homeCare?.kondisiLainnya || ''} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, kondisiLainnya: e.target.value}}))} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis layanan yang biasanya diberikan: (centang, bisa pilih lebih dari 1)</label>
                          <div className="space-y-2">
                            {['Pemeriksaan kesehatan', 'Pemantauan penyakit kronis', 'Perawatan luka', 'Rehabilitasi sederhana', 'Edukasi keluarga'].map(k => (
                              <label key={k} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.homeCare?.jenisLayanan?.[k] || false} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, jenisLayanan: {...p.homeCare?.jenisLayanan, [k]: e.target.checked}}}))} />
                                <span className="text-sm">{k}</span>
                              </label>
                            ))}
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Lainnya:</span>
                              <input type="text" className="flex-1 px-3 py-1 border rounded-md text-sm" value={formData.homeCare?.jenisLayananLainnya || ''} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, jenisLayananLainnya: e.target.value}}))} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Berapa jumlah kunjungan home care pada pasien dalam satu bulan</label>
                          <input type="number" className="w-full px-3 py-2 border rounded-md text-sm" value={formData.homeCare?.jumlahKunjungan || ''} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, jumlahKunjungan: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Apakah terdapat kolaborasi dengan tenaga kesehatan lain?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="hc-kolab" value="ya" checked={formData.homeCare?.kolaborasi === 'ya'} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, kolaborasi: 'ya'}}))} />
                              <span className="text-sm">Ya</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="hc-kolab" value="tidak" checked={formData.homeCare?.kolaborasi === 'tidak'} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, kolaborasi: 'tidak'}}))} />
                              <span className="text-sm">Tidak</span>
                            </label>
                          </div>
                          {formData.homeCare?.kolaborasi === 'ya' && (
                            <input type="text" placeholder="Sebutkan tenaga yang terlibat dan bentuk kolaborasinya" className="w-full mt-2 px-3 py-2 border rounded-md text-sm" value={formData.homeCare?.bentukKolaborasi || ''} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, bentukKolaborasi: e.target.value}}))} />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Bagaimana tingkat kepatuhan pasien terhadap rencana terapi?</label>
                          <div className="flex flex-col gap-2">
                            {['Tinggi (>80%)', 'Sedang (50–80%)', 'Rendah (<50%)'].map(k => (
                              <label key={k} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="hc-patuh" value={k} checked={formData.homeCare?.kepatuhan === k} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, kepatuhan: k}}))} />
                                <span className="text-sm">{k}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Apakah terdapat perbaikan kondisi pasien?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="hc-baik" value="ya" checked={formData.homeCare?.perbaikan === 'ya'} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, perbaikan: 'ya'}}))} />
                              <span className="text-sm">Ya</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="hc-baik" value="tidak" checked={formData.homeCare?.perbaikan === 'tidak'} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, perbaikan: 'tidak'}}))} />
                              <span className="text-sm">Tidak</span>
                            </label>
                          </div>
                          {formData.homeCare?.perbaikan === 'ya' && (
                            <input type="text" placeholder="Jelaskan bentuk perbaikannya secara singkat" className="w-full mt-2 px-3 py-2 border rounded-md text-sm" value={formData.homeCare?.bentukPerbaikan || ''} onChange={(e) => setFormData(p => ({...p, homeCare: {...p.homeCare, bentukPerbaikan: e.target.value}}))} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Pelayanan Paliatif */}
                <div className="mt-8">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-4">
                    <h3 className="text-lg font-bold text-slate-800">3. Pelayanan Paliatif</h3>
                  </div>
                  
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Apakah FKTP pernah memberikan layanan paliatif dalam 12 bulan terakhir?</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="pl-screening" value="ya" checked={formData.paliatif?.screening === 'ya'} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, screening: 'ya'}}))} />
                          <span className="text-sm">Ya</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="pl-screening" value="tidak" checked={formData.paliatif?.screening === 'tidak'} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, screening: 'tidak'}}))} />
                          <span className="text-sm">Tidak (berhenti ke bagian berikutnya)</span>
                        </label>
                      </div>
                    </div>

                    {formData.paliatif?.screening === 'ya' && (
                      <div className="space-y-4 mt-4 pt-4 border-t border-slate-200">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Siapa tenaga yang biasanya melakukan pelayanan paliatif?</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={formData.paliatif?.tenaga || ''} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, tenaga: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Contoh Diagnosis utama pasien yang menerima layanan paliatif</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={formData.paliatif?.diagnosis || ''} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, diagnosis: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Berdasarkan pasien terakhir dilayani pelayanan paliatif, bagaimana kondisi terakhir pasien secara klinis :</label>
                          <div className="space-y-2">
                            {['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring'].map(k => (
                              <label key={k} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.paliatif?.kondisi?.[k] || false} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, kondisi: {...p.paliatif?.kondisi, [k]: e.target.checked}}}))} />
                                <span className="text-sm">{k}</span>
                              </label>
                            ))}
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Lainnya:</span>
                              <input type="text" className="flex-1 px-3 py-1 border rounded-md text-sm" value={formData.paliatif?.kondisiLainnya || ''} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, kondisiLainnya: e.target.value}}))} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Tujuan utama pelayanan paliatif yang diberikan: (centang bisa pilih maksimal 3)</label>
                          <div className="space-y-2">
                            {['Pengendalian nyeri', 'Pengendalian gejala', 'Dukungan psikososial', 'Edukasi keluarga/caregiver', 'Perawatan akhir kehidupan'].map(k => (
                              <label key={k} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.paliatif?.tujuan?.[k] || false} onChange={(e) => {
                                  const obj = {...(formData.paliatif?.tujuan || {})};
                                  if (e.target.checked) {
                                    if (Object.values(obj).filter(Boolean).length >= 3 && !obj[k]) return; // max 3
                                  }
                                  setFormData(p => ({...p, paliatif: {...p.paliatif, tujuan: {...p.paliatif?.tujuan, [k]: e.target.checked}}}));
                                }} />
                                <span className="text-sm">{k}</span>
                              </label>
                            ))}
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Lainnya:</span>
                              <input type="text" className="flex-1 px-3 py-1 border rounded-md text-sm" value={formData.paliatif?.tujuanLainnya || ''} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, tujuanLainnya: e.target.value}}))} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Terapi atau intervensi yang diberikan</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" value={formData.paliatif?.terapi || ''} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, terapi: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Apakah terdapat kolaborasi dengan tenaga kesehatan lain?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="pl-kolab" value="ya" checked={formData.paliatif?.kolaborasi === 'ya'} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, kolaborasi: 'ya'}}))} />
                              <span className="text-sm">Ya</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="pl-kolab" value="tidak" checked={formData.paliatif?.kolaborasi === 'tidak'} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, kolaborasi: 'tidak'}}))} />
                              <span className="text-sm">Tidak</span>
                            </label>
                          </div>
                          {formData.paliatif?.kolaborasi === 'ya' && (
                            <input type="text" placeholder="Jelaskan bentuk kolaborasi yang dilakukan" className="w-full mt-2 px-3 py-2 border rounded-md text-sm" value={formData.paliatif?.bentukKolaborasi || ''} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, bentukKolaborasi: e.target.value}}))} />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Bagaimana tingkat kepatuhan pasien/keluarga terhadap rencana terapi?</label>
                          <div className="flex flex-col gap-2">
                            {['Tinggi', 'Sedang', 'Rendah'].map(k => (
                              <label key={k} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="pl-patuh" value={k} checked={formData.paliatif?.kepatuhan === k} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, kepatuhan: k}}))} />
                                <span className="text-sm">{k}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Apakah terdapat perbaikan kualitas hidup pasien menurut penilaian FKTP?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="pl-baik" value="ya" checked={formData.paliatif?.perbaikan === 'ya'} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, perbaikan: 'ya'}}))} />
                              <span className="text-sm">Ya</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="pl-baik" value="tidak" checked={formData.paliatif?.perbaikan === 'tidak'} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, perbaikan: 'tidak'}}))} />
                              <span className="text-sm">Tidak</span>
                            </label>
                          </div>
                          {formData.paliatif?.perbaikan === 'ya' && (
                            <input type="text" placeholder="Jelaskan bentuk perbaikan yang terjadi" className="w-full mt-2 px-3 py-2 border rounded-md text-sm" value={formData.paliatif?.bentukPerbaikan || ''} onChange={(e) => setFormData(p => ({...p, paliatif: {...p.paliatif, bentukPerbaikan: e.target.value}}))} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
`;

const targetAnchor = `                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}`;

content = content.replace(targetAnchor, targetAnchor.replace('</div>\\n              </div>\\n            )}', '</div>\\n              </div>' + injection));

fs.writeFileSync(path, content, 'utf8');
console.log('UI updated successfully!');
