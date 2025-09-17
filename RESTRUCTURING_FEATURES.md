# 🔄 Fitur Restrukturisasi Otomatis - UNISMUH Thesis Formatter

## 🎯 Fitur Baru: Auto-Restructuring

Sistem sekarang dapat **otomatis mendeteksi dan memperbaiki** urutan BAB yang salah dalam dokumen tesis!

## 🚀 Cara Kerja

### Scenario Contoh:
**❌ Upload dokumen dengan urutan salah:**
- BAB III METODE PENELITIAN
- BAB I PENDAHULUAN
- BAB II TINJAUAN PUSTAKA

**✅ Sistem otomatis mendeteksi dan memperbaiki menjadi:**
- BAB I PENDAHULUAN
- BAB II TINJAUAN PUSTAKA
- BAB III METODE PENELITIAN

## 📋 Fitur yang Ditambahkan

### 1. **Deteksi Otomatis Struktur Salah**
```python
# Sistem mendeteksi:
- Urutan BAB yang tidak berurutan
- Penomoran roman yang salah
- Chapter yang hilang
- Subsection yang tidak sesuai
```

### 2. **Restrukturisasi Otomatis**
- ✅ **Reorder Chapters**: BAB III → BAB I → BAB II menjadi BAB I → BAB II → BAB III
- ✅ **Fix Roman Numerals**: Perbaiki penomoran BAB IV menjadi BAB I jika diperlukan
- ✅ **Renumber Subsections**: 3.1, 3.2 menjadi 1.1, 1.2 sesuai chapter baru
- ✅ **Preserve Content**: Semua isi BAB tetap utuh, hanya urutan yang diperbaiki

### 3. **Preview Sebelum Apply**
- 📋 **Preview Modal**: Tampilkan urutan saat ini vs urutan yang akan dikoreksi
- ✅ **User Confirmation**: User bisa approve/reject perubahan
- 🔒 **Backup Original**: File asli selalu dibackup

### 4. **UI Integration**
- 🔴 **Tombol Merah "Restrukturisasi"**: Muncul jika ada masalah urutan
- 📊 **Violation Indicator**: Error level untuk masalah struktur
- 🎯 **One-Click Fix**: Sekali klik langsung benar

## 💡 Contoh Real-World Usage

### Sebelum:
```
User upload: thesis_draft.docx
Isi dokumen:
- BAB III METODE PENELITIAN
  3.1 Lokasi Penelitian
  3.2 Alat dan Bahan
- BAB I PENDAHULUAN
  1.1 Latar Belakang
  1.2 Rumusan Masalah
- BAB II TINJAUAN PUSTAKA
  2.1 Landasan Teori
```

### Setelah Auto-Restructure:
```
Output: thesis_draft_restructured.docx
Isi dokumen (otomatis diperbaiki):
- BAB I PENDAHULUAN
  1.1 Latar Belakang
  1.2 Rumusan Masalah
- BAB II TINJAUAN PUSTAKA
  2.1 Landasan Teori
- BAB III METODE PENELITIAN
  3.1 Lokasi Penelitian
  3.2 Alat dan Bahan
```

## 🛠️ Technical Implementation

### Backend Components Added:
```
/src/document_restructurer.py - Core restructuring engine
- analyze_document_structure()
- restructure_document()
- _renumber_subsections()
- get_restructuring_preview()
```

### API Endpoints Added:
```
POST /restructure/<file_id> - Apply restructuring
GET  /preview-restructure/<file_id> - Preview changes
```

### Frontend Features Added:
```javascript
// New functions in main.js
- handleRestructure()
- showRestructureConfirmation()
- getRestructurePreview()
```

## 🎮 User Experience Flow

1. **Upload Document** → Sistem deteksi urutan salah
2. **Show Red Button** → "Restrukturisasi Dokumen" muncul
3. **Click Button** → Modal preview tampil
4. **Confirm Changes** → Aplikasi restrukturisasi
5. **Download Result** → Dokumen sudah benar urutannya

## 📊 Validation Rules Added

### Error Level Violations:
- `document_reordering`: BAB tidak berurutan
- `chapter_order`: Urutan chapter salah
- `missing_chapter`: BAB wajib hilang

### Auto-Correctable:
- ✅ Chapter reordering
- ✅ Roman numeral correction
- ✅ Subsection renumbering
- ✅ Content preservation

## 🔧 Configuration

Aturan restrukturisasi dapat dikonfigurasi di `config/formatting_rules.yaml`:

```yaml
document_types:
  proposal:
    required_sections:
      - "BAB I PENDAHULUAN"
      - "BAB II TINJAUAN PUSTAKA"
      - "BAB III METODE PENELITIAN"
    subsections:
      "BAB I PENDAHULUAN":
        - "1.1 Latar Belakang"
        - "1.2 Rumusan Masalah"
        # etc...
```

## 🎯 Success Criteria Achieved

| Fitur | Status | Deskripsi |
|-------|--------|-----------|
| ✅ Deteksi Urutan Salah | **COMPLETE** | Sistem dapat identifikasi BAB tidak berurutan |
| ✅ Reorder Otomatis | **COMPLETE** | BAB otomatis disusun ulang sesuai aturan |
| ✅ Preserve Content | **COMPLETE** | Isi dokumen 100% terjaga |
| ✅ User Preview | **COMPLETE** | Modal konfirmasi dengan preview |
| ✅ One-Click Fix | **COMPLETE** | Tombol merah untuk auto-fix |

## 🚀 Real Impact

### Untuk Mahasiswa:
- ⏰ **Time Saving**: Tidak perlu copy-paste manual antar BAB
- 🎯 **Error Prevention**: Tidak ada lagi salah urutan submit
- 🔒 **Safe**: File asli selalu dibackup
- 💡 **Learning**: Memahami struktur yang benar

### Untuk Dosen:
- 📊 **Consistent Format**: Semua mahasiswa submit dengan urutan benar
- ⚡ **Faster Review**: Tidak perlu minta mahasiswa benahi urutan
- 📈 **Quality Control**: Struktur dokumen sesuai standar UNISMUH

---

**🎉 Sistem UNISMUH Thesis Formatter kini LENGKAP dengan Auto-Restructuring!**

Mahasiswa cukup upload dokumen, sistem otomatis deteksi dan perbaiki urutan BAB sesuai pedoman UNISMUH Makassar.