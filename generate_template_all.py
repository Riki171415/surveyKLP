import xlsxwriter
import os

os.makedirs('public/templates', exist_ok=True)
workbook = xlsxwriter.Workbook('public/templates/dashboard_template_all.xlsx')

title_format = workbook.add_format({'bold': True, 'font_size': 18, 'bg_color': '#f3f4f6', 'font_color': '#1f2937', 'align': 'center', 'valign': 'vcenter'})
header_format = workbook.add_format({'bold': True, 'bg_color': '#e5e7eb'})

# ==========================================
# 1. SHEET DASHBOARD PROFIL
# ==========================================
sheet_prof = workbook.add_worksheet('Dashboard Profil')
sheet_prof.set_column('A:B', 25)
sheet_prof.set_column('D:K', 15)

sheet_prof.merge_range('A1:L2', 'DASHBOARD PROFIL RESPONDEN', title_format)

# Stat Cards Data
sheet_prof.write('A4', 'Total Responden', header_format); sheet_prof.write_number('B4', 0)
sheet_prof.write('A5', 'Total Institusi FKTP', header_format); sheet_prof.write_number('B5', 0)
sheet_prof.write('A6', 'Provinsi Terjangkau', header_format); sheet_prof.write_number('B6', 0)
sheet_prof.write('A7', 'FKTP dgn Sp.KKLP', header_format); sheet_prof.write_number('B7', 0)

# Proporsi Responden per FKTP
sheet_prof.write('A10', 'Tipe FKTP', header_format); sheet_prof.write('B10', 'Jumlah', header_format)
sheet_prof.write('A11', 'Puskesmas'); sheet_prof.write_number('B11', 0)
sheet_prof.write('A12', 'Klinik'); sheet_prof.write_number('B12', 0)
sheet_prof.write('A13', 'Dokter Praktik Mandiri'); sheet_prof.write_number('B13', 0)
chart1 = workbook.add_chart({'type': 'pie'})
chart1.add_series({'categories': "='Dashboard Profil'!$A$11:$A$13", 'values': "='Dashboard Profil'!$B$11:$B$13", 'data_labels': {'percentage': True}})
chart1.set_title({'name': 'Proporsi Responden per FKTP'})
sheet_prof.insert_chart('D10', chart1)

# Proporsi FKTP Unik
sheet_prof.write('A26', 'Tipe FKTP', header_format); sheet_prof.write('B26', 'Unik', header_format)
sheet_prof.write('A27', 'Puskesmas'); sheet_prof.write_number('B27', 0)
sheet_prof.write('A28', 'Klinik'); sheet_prof.write_number('B28', 0)
sheet_prof.write('A29', 'Dokter Praktik Mandiri'); sheet_prof.write_number('B29', 0)
chart2 = workbook.add_chart({'type': 'pie'})
chart2.add_series({'categories': "='Dashboard Profil'!$A$27:$A$29", 'values': "='Dashboard Profil'!$B$27:$B$29", 'data_labels': {'percentage': True}})
chart2.set_title({'name': 'Proporsi FKTP Unik'})
sheet_prof.insert_chart('D26', chart2)

# Jabatan Responden
sheet_prof.write('A42', 'Jabatan', header_format); sheet_prof.write('B42', 'Jumlah', header_format)
for i in range(15):
    sheet_prof.write(f'A{43+i}', f'Jabatan {i}')
    sheet_prof.write_number(f'B{43+i}', 0)
chart3 = workbook.add_chart({'type': 'pie'})
chart3.add_series({'categories': "='Dashboard Profil'!$A$43:$A$57", 'values': "='Dashboard Profil'!$B$43:$B$57"})
chart3.set_title({'name': 'Proporsi Jabatan'})
sheet_prof.insert_chart('D42', chart3)

# Provinsi Terbanyak
sheet_prof.write('A60', 'Provinsi', header_format); sheet_prof.write('B60', 'Jumlah', header_format)
for i in range(10):
    sheet_prof.write(f'A{61+i}', f'Provinsi {i}')
    sheet_prof.write_number(f'B{61+i}', 0)
chart4 = workbook.add_chart({'type': 'column'})
chart4.add_series({'categories': "='Dashboard Profil'!$A$61:$A$70", 'values': "='Dashboard Profil'!$B$61:$B$70"})
chart4.set_title({'name': '10 Provinsi Terbanyak'})
chart4.set_legend({'none': True})
sheet_prof.insert_chart('D60', chart4, {'x_scale': 1.5})

# ==========================================
# 2. SHEET DASHBOARD PRB
# ==========================================
sheet_prb = workbook.add_worksheet('Dashboard PRB')
sheet_prb.set_column('A:B', 25)
sheet_prb.merge_range('A1:L2', 'DASHBOARD PROGRAM RUJUK BALIK (PRB)', title_format)

sheet_prb.write('A4', 'Total Estimasi Pasien PRB', header_format); sheet_prb.write_number('B4', 0)
sheet_prb.write('A5', 'Pasien PRB Rutin (Patuh)', header_format); sheet_prb.write_number('B5', 0)
sheet_prb.write('A6', 'Pasien PRB Tidak Berkunjung', header_format); sheet_prb.write_number('B6', 0)

sheet_prb.write('A10', 'Status', header_format); sheet_prb.write('B10', 'Persentase (%)', header_format)
sheet_prb.write('A11', 'Patuh Kunjungan'); sheet_prb.write_number('B11', 0)
sheet_prb.write('A12', 'Tidak Patuh'); sheet_prb.write_number('B12', 0)
chart_prb1 = workbook.add_chart({'type': 'pie'})
chart_prb1.add_series({'categories': "='Dashboard PRB'!$A$11:$A$12", 'values': "='Dashboard PRB'!$B$11:$B$12", 'data_labels': {'percentage': True}})
chart_prb1.set_title({'name': 'Kepatuhan Kunjungan PRB'})
sheet_prb.insert_chart('D10', chart_prb1)

sheet_prb.write('A26', 'Diagnosis', header_format); sheet_prb.write('B26', 'Jumlah FKTP', header_format)
for i in range(10):
    sheet_prb.write(f'A{27+i}', f'Penyakit {i}'); sheet_prb.write_number(f'B{27+i}', 0)
chart_prb2 = workbook.add_chart({'type': 'bar'})
chart_prb2.add_series({'categories': "='Dashboard PRB'!$A$27:$A$36", 'values': "='Dashboard PRB'!$B$27:$B$36"})
chart_prb2.set_title({'name': 'Diagnosis PRB Terbanyak'})
chart_prb2.set_legend({'none': True})
sheet_prb.insert_chart('D26', chart_prb2)

# ==========================================
# 3. SHEET DASHBOARD MONITORING PRB
# ==========================================
sheet_mon = workbook.add_worksheet('Dashboard Monitoring PRB')
sheet_mon.set_column('A:B', 30)
sheet_mon.merge_range('A1:L2', 'DASHBOARD MONITORING PRB', title_format)

sheet_mon.write('A4', 'FKTP dengan Mekanisme (%)', header_format); sheet_mon.write_number('B4', 0)

sheet_mon.write('A8', 'Mekanisme', header_format); sheet_mon.write('B8', 'Jumlah', header_format)
for i in range(5):
    sheet_mon.write(f'A{9+i}', ''); sheet_mon.write_number(f'B{9+i}', 0)
chart_mon1 = workbook.add_chart({'type': 'pie'})
chart_mon1.add_series({'categories': "='Dashboard Monitoring PRB'!$A$9:$A$13", 'values': "='Dashboard Monitoring PRB'!$B$9:$B$13"})
chart_mon1.set_title({'name': 'Mekanisme Utama PRB'})
sheet_mon.insert_chart('D8', chart_mon1)

# ==========================================
# 4. SHEET DASHBOARD HOME CARE
# ==========================================
sheet_hc = workbook.add_worksheet('Dashboard Home Care')
sheet_hc.set_column('A:B', 30)
sheet_hc.merge_range('A1:L2', 'DASHBOARD HOME CARE', title_format)

sheet_hc.write('A4', 'Proporsi FKTP dgn Home Care (%)', header_format); sheet_hc.write_number('B4', 0)
sheet_hc.write('A9', 'Kondisi Pasien', header_format); sheet_hc.write('B9', 'Jumlah', header_format)
for i in range(6):
    sheet_hc.write(f'A{10+i}', ''); sheet_hc.write_number(f'B{10+i}', 0)
chart_hc1 = workbook.add_chart({'type': 'pie'})
chart_hc1.add_series({'categories': "='Dashboard Home Care'!$A$10:$A$15", 'values': "='Dashboard Home Care'!$B$10:$B$15"})
chart_hc1.set_title({'name': 'Kondisi Pasien Home Care'})
sheet_hc.insert_chart('D9', chart_hc1)

# ==========================================
# 5. SHEET DASHBOARD PALIATIF
# ==========================================
sheet_pal = workbook.add_worksheet('Dashboard Paliatif')
sheet_pal.set_column('A:B', 30)
sheet_pal.merge_range('A1:L2', 'DASHBOARD PALIATIF', title_format)

sheet_pal.write('A4', 'Proporsi FKTP dgn Layanan Paliatif (%)', header_format); sheet_pal.write_number('B4', 0)
sheet_pal.write('A8', 'Tujuan Layanan', header_format); sheet_pal.write('B8', 'Jumlah', header_format)
for i in range(6):
    sheet_pal.write(f'A{9+i}', ''); sheet_pal.write_number(f'B{9+i}', 0)
chart_pal1 = workbook.add_chart({'type': 'pie'})
chart_pal1.add_series({'categories': "='Dashboard Paliatif'!$A$9:$A$14", 'values': "='Dashboard Paliatif'!$B$9:$B$14"})
chart_pal1.set_title({'name': 'Tujuan Layanan Paliatif'})
sheet_pal.insert_chart('D8', chart_pal1)

# ==========================================
# 6. SHEET DASHBOARD NON-OPTIMAL
# ==========================================
sheet_no = workbook.add_worksheet('Dashboard Non-Optimal')
sheet_no.set_column('A:B', 30)
sheet_no.merge_range('A1:L2', 'DASHBOARD NON-OPTIMAL', title_format)

sheet_no.write('A4', 'Total Identifikasi Non-Optimal', header_format); sheet_no.write_number('B4', 0)
sheet_no.write('A8', 'Status JKN', header_format); sheet_no.write('B8', 'Jumlah', header_format)
for i in range(2):
    sheet_no.write(f'A{9+i}', ''); sheet_no.write_number(f'B{9+i}', 0)
chart_no1 = workbook.add_chart({'type': 'pie'})
chart_no1.add_series({'categories': "='Dashboard Non-Optimal'!$A$9:$A$10", 'values': "='Dashboard Non-Optimal'!$B$9:$B$10"})
chart_no1.set_title({'name': 'Proporsi Masuk JKN'})
sheet_no.insert_chart('D8', chart_no1)

# ==========================================
# 7. SHEET DASHBOARD SP.KKLP
# ==========================================
sheet_sp = workbook.add_worksheet('Dashboard Sp.KKLP')
sheet_sp.set_column('A:B', 30)
sheet_sp.merge_range('A1:L2', 'DASHBOARD PERAN SP.KKLP', title_format)

sheet_sp.write('A4', 'Punya Dokter Sp.KKLP', header_format); sheet_sp.write_number('B4', 0)
sheet_sp.write('A8', 'Layanan Dirujuk', header_format); sheet_sp.write('B8', 'Jumlah', header_format)
for i in range(5):
    sheet_sp.write(f'A{9+i}', ''); sheet_sp.write_number(f'B{9+i}', 0)
chart_sp1 = workbook.add_chart({'type': 'pie'})
chart_sp1.add_series({'categories': "='Dashboard Sp.KKLP'!$A$9:$A$13", 'values': "='Dashboard Sp.KKLP'!$B$9:$B$13"})
chart_sp1.set_title({'name': 'Top 5 Layanan Dirujuk'})
sheet_sp.insert_chart('D8', chart_sp1)

sheet_sp.write('A26', 'Diagnosis Sp.KKLP', header_format); sheet_sp.write('B26', 'Jumlah', header_format)
for i in range(10):
    sheet_sp.write(f'A{27+i}', ''); sheet_sp.write_number(f'B{27+i}', 0)
chart_sp2 = workbook.add_chart({'type': 'bar'})
chart_sp2.add_series({'categories': "='Dashboard Sp.KKLP'!$A$27:$A$36", 'values': "='Dashboard Sp.KKLP'!$B$27:$B$36"})
chart_sp2.set_title({'name': 'Diagnosis Sp.KKLP'})
chart_sp2.set_legend({'none': True})
sheet_sp.insert_chart('D26', chart_sp2)

# ==========================================
# 8. SHEET DASHBOARD KENDALA
# ==========================================
sheet_kd = workbook.add_worksheet('Dashboard Kendala')
sheet_kd.set_column('A:B', 30)
sheet_kd.merge_range('A1:L2', 'DASHBOARD KENDALA JKN', title_format)

sheet_kd.write('A4', 'FKTP dgn Kendala', header_format); sheet_kd.write_number('B4', 0)
sheet_kd.write('A8', 'Kendala', header_format); sheet_kd.write('B8', 'Jumlah', header_format)
for i in range(7):
    sheet_kd.write(f'A{9+i}', ''); sheet_kd.write_number(f'B{9+i}', 0)
chart_kd1 = workbook.add_chart({'type': 'bar'})
chart_kd1.add_series({'categories': "='Dashboard Kendala'!$A$9:$A$15", 'values': "='Dashboard Kendala'!$B$9:$B$15"})
chart_kd1.set_title({'name': 'Distribusi Kendala'})
chart_kd1.set_legend({'none': True})
sheet_kd.insert_chart('D8', chart_kd1)

workbook.close()
print("All templates generated at public/templates/dashboard_template_all.xlsx")
