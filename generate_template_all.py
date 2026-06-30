import xlsxwriter
import os

os.makedirs('public/templates', exist_ok=True)
workbook = xlsxwriter.Workbook('public/templates/dashboard_template_all.xlsx')

title_format = workbook.add_format({'bold': True, 'font_size': 18, 'bg_color': '#f3f4f6', 'font_color': '#1f2937', 'align': 'center', 'valign': 'vcenter'})
header_format = workbook.add_format({'bold': True, 'bg_color': '#e5e7eb'})

def create_chart_sheet(name, title, chart_type='pie'):
    sheet = workbook.add_worksheet(name)
    sheet.set_column('A:B', 30)
    sheet.merge_range('A1:L2', title, title_format)
    return sheet

# 1. Profil
s1 = create_chart_sheet('Dashboard Profil', 'DASHBOARD PROFIL RESPONDEN')
s1.write('A4', 'Total Responden', header_format); s1.write_number('B4', 0)
s1.write('A5', 'Total Institusi FKTP', header_format); s1.write_number('B5', 0)
s1.write('A6', 'Provinsi Terjangkau', header_format); s1.write_number('B6', 0)
s1.write('A7', 'FKTP dgn Sp.KKLP', header_format); s1.write_number('B7', 0)

s1.write('A10', 'Tipe FKTP', header_format); s1.write('B10', 'Jumlah', header_format)
fktp_types = ['Puskesmas', 'Klinik', 'Dokter Praktik Mandiri']
for i, t in enumerate(fktp_types): s1.write(f'A{11+i}', t); s1.write_number(f'B{11+i}', 0)
c1 = workbook.add_chart({'type': 'pie'}); c1.add_series({'categories': "='Dashboard Profil'!$A$11:$A$13", 'values': "='Dashboard Profil'!$B$11:$B$13"}); s1.insert_chart('D10', c1)

s1.write('A26', 'Tipe FKTP Unik', header_format); s1.write('B26', 'Jumlah', header_format)
for i, t in enumerate(fktp_types): s1.write(f'A{27+i}', t); s1.write_number(f'B{27+i}', 0)
c2 = workbook.add_chart({'type': 'pie'}); c2.add_series({'categories': "='Dashboard Profil'!$A$27:$A$29", 'values': "='Dashboard Profil'!$B$27:$B$29"}); s1.insert_chart('D26', c2)

s1.write('A42', 'Jabatan', header_format); s1.write('B42', 'Jumlah', header_format)
for i in range(15): s1.write(f'A{43+i}', f'Jabatan {i+1}'); s1.write_number(f'B{43+i}', 0)
c3 = workbook.add_chart({'type': 'pie'}); c3.add_series({'categories': "='Dashboard Profil'!$A$43:$A$57", 'values': "='Dashboard Profil'!$B$43:$B$57"}); s1.insert_chart('D42', c3)

s1.write('A60', 'Provinsi', header_format); s1.write('B60', 'Jumlah', header_format)
for i in range(10): s1.write(f'A{61+i}', f'Provinsi {i+1}'); s1.write_number(f'B{61+i}', 0)
c4 = workbook.add_chart({'type': 'column'}); c4.add_series({'categories': "='Dashboard Profil'!$A$61:$A$70", 'values': "='Dashboard Profil'!$B$61:$B$70"}); s1.insert_chart('D60', c4)

# 2. PRB
s2 = create_chart_sheet('Dashboard PRB', 'DASHBOARD PRB')
s2.write('A4', 'Total Pasien PRB', header_format); s2.write_number('B4', 0)
s2.write('A5', 'Rutin', header_format); s2.write_number('B5', 0)
s2.write('A6', 'Tidak Berkunjung', header_format); s2.write_number('B6', 0)

s2.write('A10', 'Status', header_format); s2.write('B10', 'Persentase', header_format)
s2.write('A11', 'Rutin'); s2.write_number('B11', 0)
s2.write('A12', 'Tidak Berkunjung'); s2.write_number('B12', 0)
c2_1 = workbook.add_chart({'type': 'pie'}); c2_1.add_series({'categories': "='Dashboard PRB'!$A$11:$A$12", 'values': "='Dashboard PRB'!$B$11:$B$12"}); s2.insert_chart('D10', c2_1)

s2.write('A26', 'Diagnosis', header_format); s2.write('B26', 'Jumlah', header_format)
for i in range(10): s2.write(f'A{27+i}', f'Penyakit {i+1}'); s2.write_number(f'B{27+i}', 0)
c2_2 = workbook.add_chart({'type': 'bar'}); c2_2.add_series({'categories': "='Dashboard PRB'!$A$27:$A$36", 'values': "='Dashboard PRB'!$B$27:$B$36"}); s2.insert_chart('D26', c2_2)

# 3. Mon PRB
s3 = create_chart_sheet('Dashboard Monitoring PRB', 'MONITORING PRB')
s3.write('A4', 'Mekanisme PRB (%)', header_format); s3.write_number('B4', 0)
s3.write('A8', 'Mekanisme', header_format); s3.write('B8', 'Jumlah', header_format)
for i in range(5): s3.write(f'A{9+i}', f'Mek {i+1}'); s3.write_number(f'B{9+i}', 0)
c3_1 = workbook.add_chart({'type': 'pie'}); c3_1.add_series({'categories': "='Dashboard Monitoring PRB'!$A$9:$A$13", 'values': "='Dashboard Monitoring PRB'!$B$9:$B$13"}); s3.insert_chart('D8', c3_1)

# 4. Home Care
s4 = create_chart_sheet('Dashboard Home Care', 'HOME CARE')
s4.write('A4', 'Proporsi HC (%)', header_format); s4.write_number('B4', 0)
s4.write('A9', 'Kondisi', header_format); s4.write('B9', 'Jumlah', header_format)
for i in range(6): s4.write(f'A{10+i}', f'Kondisi {i+1}'); s4.write_number(f'B{10+i}', 0)
c4_1 = workbook.add_chart({'type': 'pie'}); c4_1.add_series({'categories': "='Dashboard Home Care'!$A$10:$A$15", 'values': "='Dashboard Home Care'!$B$10:$B$15"}); s4.insert_chart('D9', c4_1)

# 5. Paliatif
s5 = create_chart_sheet('Dashboard Paliatif', 'PALIATIF')
s5.write('A4', 'Proporsi Paliatif (%)', header_format); s5.write_number('B4', 0)
s5.write('A8', 'Tujuan', header_format); s5.write('B8', 'Jumlah', header_format)
for i in range(6): s5.write(f'A{9+i}', f'Tujuan {i+1}'); s5.write_number(f'B{9+i}', 0)
c5_1 = workbook.add_chart({'type': 'pie'}); c5_1.add_series({'categories': "='Dashboard Paliatif'!$A$9:$A$14", 'values': "='Dashboard Paliatif'!$B$9:$B$14"}); s5.insert_chart('D8', c5_1)

# 6. Non-Optimal
s6 = create_chart_sheet('Dashboard Non-Optimal', 'NON-OPTIMAL')
s6.write('A4', 'Identifikasi', header_format); s6.write_number('B4', 0)
s6.write('A8', 'JKN', header_format); s6.write('B8', 'Jumlah', header_format)
s6.write('A9', 'Diusulkan Masuk JKN'); s6.write_number('B9', 0)
s6.write('A10', 'Tidak Diusulkan'); s6.write_number('B10', 0)
c6_1 = workbook.add_chart({'type': 'pie'}); c6_1.add_series({'categories': "='Dashboard Non-Optimal'!$A$9:$A$10", 'values': "='Dashboard Non-Optimal'!$B$9:$B$10"}); s6.insert_chart('D8', c6_1)

# 7. SpKKLP
s7 = create_chart_sheet('Dashboard Sp.KKLP', 'PERAN SP.KKLP')
s7.write('A4', 'Punya SpKKLP', header_format); s7.write_number('B4', 0)
s7.write('A8', 'Rujukan', header_format); s7.write('B8', 'Jumlah', header_format)
for i in range(5): s7.write(f'A{9+i}', f'Rujukan {i+1}'); s7.write_number(f'B{9+i}', 0)
c7_1 = workbook.add_chart({'type': 'pie'}); c7_1.add_series({'categories': "='Dashboard Sp.KKLP'!$A$9:$A$13", 'values': "='Dashboard Sp.KKLP'!$B$9:$B$13"}); s7.insert_chart('D8', c7_1)
s7.write('A26', 'Diagnosis', header_format); s7.write('B26', 'Jumlah', header_format)
for i in range(10): s7.write(f'A{27+i}', f'Penyakit {i+1}'); s7.write_number(f'B{27+i}', 0)
c7_2 = workbook.add_chart({'type': 'bar'}); c7_2.add_series({'categories': "='Dashboard Sp.KKLP'!$A$27:$A$36", 'values': "='Dashboard Sp.KKLP'!$B$27:$B$36"}); s7.insert_chart('D26', c7_2)

# 8. Kendala
s8 = create_chart_sheet('Dashboard Kendala', 'KENDALA JKN')
s8.write('A4', 'Total Kendala', header_format); s8.write_number('B4', 0)
s8.write('A8', 'Kendala', header_format); s8.write('B8', 'Jumlah', header_format)
for i in range(7): s8.write(f'A{9+i}', f'Kendala {i+1}'); s8.write_number(f'B{9+i}', 0)
c8_1 = workbook.add_chart({'type': 'bar'}); c8_1.add_series({'categories': "='Dashboard Kendala'!$A$9:$A$15", 'values': "='Dashboard Kendala'!$B$9:$B$15"}); s8.insert_chart('D8', c8_1)

# 9. Kualitatif (Text Data)
s9 = workbook.add_worksheet('Kualitatif')
s9.write('A1', 'Nama Responden', header_format)
s9.write('B1', 'Faskes', header_format)
for i in range(8): s9.write(0, i+2, f'W{i+1}', header_format)
s9.set_column('C:J', 50)

# 10. Keluhan (Text Data)
s10 = workbook.add_worksheet('Keluhan')
s10.write('A1', 'Nama Responden', header_format)
s10.write('B1', 'Faskes', header_format)
s10.write('C1', 'Keluhan', header_format)
s10.write('D1', 'Solusi', header_format)
s10.set_column('C:D', 60)

# 11. DPM (Charts)
s11 = create_chart_sheet('Dashboard DPM', 'DASHBOARD DPM')
s11.write('A4', 'Lama Praktik', header_format); s11.write('B4', 'Jumlah', header_format)
for i in range(5): s11.write(f'A{5+i}', f'Durasi {i+1}'); s11.write_number(f'B{5+i}', 0)
c11_1 = workbook.add_chart({'type': 'pie'}); c11_1.add_series({'categories': "='Dashboard DPM'!$A$5:$A$9", 'values': "='Dashboard DPM'!$B$5:$B$9"}); s11.insert_chart('D4', c11_1)
s11.write('A26', 'Kunjungan Harian', header_format); s11.write('B26', 'Jumlah', header_format)
for i in range(5): s11.write(f'A{27+i}', f'Range {i+1}'); s11.write_number(f'B{27+i}', 0)
c11_2 = workbook.add_chart({'type': 'pie'}); c11_2.add_series({'categories': "='Dashboard DPM'!$A$27:$A$31", 'values': "='Dashboard DPM'!$B$27:$B$31"}); s11.insert_chart('D26', c11_2)

# 12. Pasien Bulanan
s12 = create_chart_sheet('Pasien Bulanan', 'PASIEN BULANAN')
s12.write('A4', 'Penyakit', header_format); s12.write('B4', 'Jumlah', header_format)
for i in range(16): s12.write(f'A{5+i}', f'Penyakit {i+1}'); s12.write_number(f'B{5+i}', 0)
c12_1 = workbook.add_chart({'type': 'bar'}); c12_1.add_series({'categories': "='Pasien Bulanan'!$A$5:$A$20", 'values': "='Pasien Bulanan'!$B$5:$B$20"}); s12.insert_chart('D4', c12_1)

# 13. Raw Data
s13 = workbook.add_worksheet('Raw Data')
s13.write('A1', 'Waktu Submit', header_format)
s13.write('B1', 'Nama Responden', header_format)
s13.write('C1', 'Faskes', header_format)
s13.write('D1', 'Provinsi', header_format)
s13.write('E1', 'Kab/Kota', header_format)
s13.write('F1', 'Jabatan', header_format)
s13.set_column('A:F', 30)

workbook.close()
print("All 13 templates generated at public/templates/dashboard_template_all.xlsx")
