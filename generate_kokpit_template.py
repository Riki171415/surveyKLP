import xlsxwriter
import os

os.makedirs('public/templates', exist_ok=True)
workbook = xlsxwriter.Workbook('public/templates/kokpit_template.xlsx')

title_format = workbook.add_format({'bold': True, 'font_size': 18, 'bg_color': '#f3f4f6', 'font_color': '#1f2937', 'align': 'center', 'valign': 'vcenter'})
header_format = workbook.add_format({'bold': True, 'bg_color': '#e5e7eb'})

def create_chart_sheet(name, title):
    sheet = workbook.add_worksheet(name)
    sheet.set_column('A:B', 40)
    sheet.merge_range('A1:L2', title, title_format)
    return sheet

# 1. Ringkasan Kesiapan
s1 = create_chart_sheet('Ringkasan Kesiapan', 'RINGKASAN KESIAPAN NASIONAL')
s1.write('A4', 'Indeks Kesiapan Sp.KKLP', header_format); s1.write_number('B4', 0)
s1.write('A5', 'Rata-rata Skor Relevansi', header_format); s1.write_number('B5', 0)

s1.write('A9', 'Provinsi', header_format); s1.write('B9', 'Skor Kesiapan (%)', header_format)
for i in range(35): s1.write(f'A{10+i}', ''); s1.write_number(f'B{10+i}', 0)
c1 = workbook.add_chart({'type': 'bar'})
c1.add_series({'categories': "='Ringkasan Kesiapan'!$A$10:$A$44", 'values': "='Ringkasan Kesiapan'!$B$10:$B$44"})
c1.set_title({'name': 'Peta Kesiapan per Provinsi'})
c1.set_legend({'none': True})
c1.set_size({'width': 800, 'height': 600})
s1.insert_chart('D9', c1)

# 2. Relevansi SpKKLP (Gap Analysis)
s2 = create_chart_sheet('Relevansi Lintas Profesi', 'RELEVANSI PERAN SP.KKLP (GAP ANALYSIS)')
s2.write('A4', 'Elemen Peran', header_format)
s2.write('B4', 'Kepala Puskesmas/Klinik', header_format)
s2.write('C4', 'Dokter Umum', header_format)
s2.write('D4', 'Sp.KKLP', header_format)
s2.set_column('C:D', 20)

for i in range(11): 
    s2.write(f'A{5+i}', '')
    s2.write_number(f'B{5+i}', 0)
    s2.write_number(f'C{5+i}', 0)
    s2.write_number(f'D{5+i}', 0)

c2 = workbook.add_chart({'type': 'radar'})
c2.add_series({'name': 'Kepala PKM', 'categories': "='Relevansi Lintas Profesi'!$A$5:$A$15", 'values': "='Relevansi Lintas Profesi'!$B$5:$B$15"})
c2.add_series({'name': 'Dokter Umum', 'categories': "='Relevansi Lintas Profesi'!$A$5:$A$15", 'values': "='Relevansi Lintas Profesi'!$C$5:$C$15"})
c2.add_series({'name': 'Sp.KKLP', 'categories': "='Relevansi Lintas Profesi'!$A$5:$A$15", 'values': "='Relevansi Lintas Profesi'!$D$5:$D$15"})
c2.set_title({'name': 'Gap Persepsi Lintas Profesi'})
c2.set_size({'width': 800, 'height': 600})
s2.insert_chart('F5', c2)

# 3. Peta Jalan JKN vs Prioritas Baru
s3 = create_chart_sheet('Usulan JKN', 'EVALUASI MANFAAT JKN VS USULAN BARU')
s3.write('A4', 'Layanan', header_format)
s3.write('B4', 'Existing JKN', header_format)
s3.write('C4', 'Usulan Baru', header_format)
s3.set_column('C:C', 20)

for i in range(6): 
    s3.write(f'A{5+i}', '')
    s3.write_number(f'B{5+i}', 0)
    s3.write_number(f'C{5+i}', 0)

c3 = workbook.add_chart({'type': 'column'})
c3.add_series({'name': 'Existing JKN', 'categories': "='Usulan JKN'!$A$5:$A$10", 'values': "='Usulan JKN'!$B$5:$B$10"})
c3.add_series({'name': 'Usulan Baru', 'categories': "='Usulan JKN'!$A$5:$A$10", 'values': "='Usulan JKN'!$C$5:$C$10"})
c3.set_title({'name': 'Perbandingan Skor JKN vs Usulan'})
c3.set_size({'width': 800, 'height': 500})
s3.insert_chart('E5', c3)

workbook.close()
print("Kokpit template generated at public/templates/kokpit_template.xlsx")
