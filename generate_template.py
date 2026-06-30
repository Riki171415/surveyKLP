import xlsxwriter
import os

# Pastikan folder templates ada
os.makedirs('public/templates', exist_ok=True)

# Buat workbook
workbook = xlsxwriter.Workbook('public/templates/dashboard_template.xlsx')

# Buat worksheet Data dan Dashboard
sheet_data = workbook.add_worksheet('Data_Profil')
sheet_dash = workbook.add_worksheet('Dashboard')

# --- DATA SHEET ---
# Kita siapkan struktur data dummy yang nanti akan ditimpa oleh aplikasi web
# Proporsi Responden per FKTP (Data di A1:B4)
sheet_data.write_string('A1', 'Tipe FKTP')
sheet_data.write_string('B1', 'Jumlah Responden')
sheet_data.write_string('A2', 'Puskesmas')
sheet_data.write_number('B2', 10)
sheet_data.write_string('A3', 'Klinik')
sheet_data.write_number('B3', 5)
sheet_data.write_string('A4', 'Dokter Praktik Mandiri')
sheet_data.write_number('B4', 3)

# Proporsi FKTP Unik (Data di D1:E4)
sheet_data.write_string('D1', 'Tipe FKTP')
sheet_data.write_string('E1', 'Jumlah FKTP Unik')
sheet_data.write_string('D2', 'Puskesmas')
sheet_data.write_number('E2', 8)
sheet_data.write_string('D3', 'Klinik')
sheet_data.write_number('E3', 4)
sheet_data.write_string('D4', 'Dokter Praktik Mandiri')
sheet_data.write_number('E4', 3)

# Proporsi Jabatan Responden (Data di G1:H15)
sheet_data.write_string('G1', 'Jabatan')
sheet_data.write_string('H1', 'Jumlah')
# Dummy roles, we should allocate enough rows because there might be more roles.
# 15 rows
for i in range(1, 16):
    sheet_data.write_string(f'G{i+1}', f'Jabatan {i}')
    sheet_data.write_number(f'H{i+1}', 10)

# 10 Provinsi Terbanyak (Data di J1:K11)
sheet_data.write_string('J1', 'Provinsi')
sheet_data.write_string('K1', 'Jumlah')
for i in range(1, 11):
    sheet_data.write_string(f'J{i+1}', f'Prov {i}')
    sheet_data.write_number(f'K{i+1}', 10)


# --- DASHBOARD SHEET ---
sheet_dash.set_column('A:Z', 20)

# Format Title
title_format = workbook.add_format({'bold': True, 'font_size': 20, 'bg_color': '#f3f4f6', 'font_color': '#1f2937', 'align': 'center', 'valign': 'vcenter'})
sheet_dash.merge_range('A1:L2', 'DASHBOARD PROFIL RESPONDEN (NATIVE EXCEL CHARTS)', title_format)

# 1. Chart: Proporsi Responden per FKTP
chart1 = workbook.add_chart({'type': 'pie'})
chart1.add_series({
    'name': 'Proporsi Responden',
    'categories': '=Data_Profil!$A$2:$A$4',
    'values':     '=Data_Profil!$B$2:$B$4',
    'data_labels': {'value': True, 'percentage': True, 'separator': '\n', 'position': 'outside_end'},
})
chart1.set_title({'name': 'Proporsi Responden per FKTP'})
chart1.set_style(10)
sheet_dash.insert_chart('A4', chart1, {'x_scale': 1.2, 'y_scale': 1.2})

# 2. Chart: Proporsi FKTP Unik
chart2 = workbook.add_chart({'type': 'pie'})
chart2.add_series({
    'name': 'Proporsi FKTP Unik',
    'categories': '=Data_Profil!$D$2:$D$4',
    'values':     '=Data_Profil!$E$2:$E$4',
    'data_labels': {'value': True, 'percentage': True, 'separator': '\n', 'position': 'outside_end'},
})
chart2.set_title({'name': 'Proporsi FKTP Unik'})
chart2.set_style(11)
sheet_dash.insert_chart('E4', chart2, {'x_scale': 1.2, 'y_scale': 1.2})

# 3. Chart: Proporsi Jabatan Responden
chart3 = workbook.add_chart({'type': 'pie'})
chart3.add_series({
    'name': 'Proporsi Jabatan',
    'categories': '=Data_Profil!$G$2:$G$15',
    'values':     '=Data_Profil!$H$2:$H$15',
    'data_labels': {'value': True, 'percentage': True, 'separator': '\n', 'position': 'outside_end'},
})
chart3.set_title({'name': 'Proporsi Jabatan Responden'})
chart3.set_style(12)
sheet_dash.insert_chart('I4', chart3, {'x_scale': 1.2, 'y_scale': 1.2})

# 4. Chart: 10 Provinsi Terbanyak
chart4 = workbook.add_chart({'type': 'column'})
chart4.add_series({
    'name': 'Jumlah Responden',
    'categories': '=Data_Profil!$J$2:$J$11',
    'values':     '=Data_Profil!$K$2:$K$11',
    'data_labels': {'value': True},
    'fill': {'color': '#00857A'}
})
chart4.set_title({'name': '10 Provinsi Terbanyak'})
chart4.set_x_axis({'name': 'Provinsi', 'num_font': {'rotation': -45}})
chart4.set_y_axis({'name': 'Jumlah'})
chart4.set_legend({'none': True})
sheet_dash.insert_chart('A20', chart4, {'x_scale': 2.8, 'y_scale': 1.5})


# Hide Data Sheet so user only sees dashboard
sheet_data.hide()

workbook.close()
print("Template created at public/templates/dashboard_template.xlsx")
