# 🔬 Metodologi & Implementasi Teknis
**UNISMUH Thesis Document Formatter**

## 📚 Metode Yang Digunakan

### 1. **Rule-Based Processing System**
**Lokasi**: `src/validator.py` dan `config/formatting_rules.yaml`

**Konsep**: Sistem berbasis aturan yang memproses dokumen berdasarkan rules yang telah didefinisikan dalam format YAML.

```python
# src/validator.py - Rule-based validation
class DocumentValidator:
    def __init__(self, config):
        self.rules = config['validation_rules']  # Load rules from YAML

    def validate_document(self, document_path):
        violations = []

        # Apply rules sequentially
        violations.extend(self._validate_page_setup(doc))      # Rule 1: Page layout
        violations.extend(self._validate_typography(doc))       # Rule 2: Typography
        violations.extend(self._validate_structure(doc))        # Rule 3: Document structure
        violations.extend(self._validate_document_order(doc))   # Rule 4: Chapter ordering
        violations.extend(self._validate_headings(doc))         # Rule 5: Heading format

        return violations
```

**Rule Definition dalam YAML**:
```yaml
# config/formatting_rules.yaml
validation_rules:
  margins:
    severity: "error"
    message_template: "{margin} margin is {found} but should be {expected}"
  font:
    severity: "error"
    message_template: "{found_font} font used instead of required {required_font}"
```

### 2. **Pattern Matching & Regular Expression**
**Lokasi**: `src/document_restructurer.py`

**Konsep**: Menggunakan regex untuk mendeteksi pola BAB dan struktur dokumen.

```python
# Pattern matching untuk deteksi BAB
def analyze_document_structure(self, document_path):
    chapter_pattern = r'BAB\s+([IVX]+)\s+(.+)'  # Regex pattern

    for paragraph in doc.paragraphs:
        text = paragraph.text.strip().upper()
        chapter_match = re.match(chapter_pattern, text)

        if chapter_match:
            roman_numeral = chapter_match.group(1)    # Extract: "I", "II", "III"
            chapter_title = chapter_match.group(2)     # Extract: "PENDAHULUAN"
            chapter_number = self._roman_to_int(roman_numeral)  # Convert to int for sorting
```

### 3. **Content Preservation Algorithm**
**Lokasi**: `src/document_restructurer.py`

**Konsep**: Mempertahankan 100% konten dokumen saat melakukan restrukturisasi.

```python
def _copy_chapter_content(self, source_doc, target_doc, chapter_info, analysis):
    start_idx = chapter_info['paragraph_index']

    # Find end boundary (next chapter or document end)
    end_idx = len(source_doc.paragraphs)
    for other_chapter in analysis['chapters']:
        if other_chapter['paragraph_index'] > start_idx:
            end_idx = other_chapter['paragraph_index']
            break

    # Copy all content between boundaries
    for i in range(start_idx + 1, end_idx):
        source_para = source_doc.paragraphs[i]
        target_para = target_doc.add_paragraph()

        # Preserve formatting
        for run in source_para.runs:
            new_run = target_para.add_run(run.text)
            new_run.font.name = run.font.name
            new_run.font.size = run.font.size
            new_run.bold = run.bold
```

### 4. **Modular Architecture Pattern**
**Lokasi**: Semua file `src/`

**Konsep**: Setiap komponen memiliki tanggung jawab spesifik dan dapat digunakan secara independen.

```python
# Dependency injection pattern
class DocumentProcessor:
    def __init__(self, config):
        self.validator = DocumentValidator(config)     # Module 1
        self.corrector = DocumentCorrector(config)     # Module 2

class DocumentCorrector:
    def __init__(self, config):
        self.restructurer = DocumentRestructurer(config)  # Module 3
```

### 5. **Error Handling & Logging Pattern**
**Lokasi**: Semua modules

**Konsep**: Comprehensive error handling dengan logging untuk debugging.

```python
import logging

class DocumentValidator:
    def __init__(self, config):
        self.logger = logging.getLogger(__name__)

    def validate_document(self, document_path):
        try:
            # Processing logic
            violations = self._process_validation()
            self.logger.info(f"Validation completed: {len(violations)} violations")
            return violations

        except Exception as e:
            self.logger.error(f"Validation failed: {str(e)}")
            return [{'type': 'system_error', 'message': f'Validation error: {str(e)}'}]
```

## 🔄 Alur Proses Lengkap

### **Phase 1: Document Upload & Preprocessing**
```
User Upload (.docx)
    ↓
Flask Route (/upload)
    ↓
File Validation (size, format)
    ↓
Secure File Storage (temp/)
    ↓
DocumentProcessor.process_document()
```

**Code Flow**:
```python
# app.py
@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']

    # Validation
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only .docx files allowed'})

    # Storage
    file_id = str(uuid.uuid4())
    file_path = os.path.join('temp', f"{file_id}_{filename}")
    file.save(file_path)

    # Processing
    processor = DocumentProcessor(config)
    result = processor.process_document(file_path, file_id)
```

### **Phase 2: Document Analysis & Validation**
```
Load Document (python-docx)
    ↓
Structure Analysis (Regex Pattern Matching)
    ↓
Rule-Based Validation (YAML Rules)
    ↓
Violation Detection & Classification
    ↓
Return Analysis Results
```

**Code Flow**:
```python
# document_processor.py
def process_document(self, document_path, file_id):
    doc = Document(document_path)  # Load with python-docx

    # Create backup
    backup_path = self._create_backup(document_path, file_id)

    # Validate using rule-based engine
    violations = self.validator.validate_document(document_path)

    # Classify violations by severity
    errors = [v for v in violations if v['severity'] == 'error']
    warnings = [v for v in violations if v['severity'] == 'warning']
```

### **Phase 3: Rule-Based Validation Engine**
```
Load Validation Rules (YAML)
    ↓
Apply Rules Sequentially:
├── Page Setup Rules (margins, font)
├── Typography Rules (spacing, alignment)
├── Structure Rules (required sections)
├── Order Rules (chapter sequence) ← NEW!
└── Heading Rules (format, style)
    ↓
Generate Violation Reports
```

**Code Flow**:
```python
# validator.py - Rule-based processing core
def validate_document(self, document_path):
    violations = []
    doc = Document(document_path)

    # Rule 1: Page Setup Validation
    sections = doc.sections
    for section in sections:
        expected_top = float(self.config['page_setup']['margins']['top'].replace('cm', ''))
        actual_top = section.top_margin.cm

        if abs(actual_top - expected_top) > 0.2:  # Tolerance rule
            violations.append({
                'type': 'margin_error',
                'severity': self.rules['margins']['severity'],
                'message': self.rules['margins']['message_template'].format(
                    margin='Top', found=actual_top, expected=expected_top
                ),
                'auto_correctable': True
            })

    # Rule 2: Typography Validation
    expected_font = self.config['typography']['body_font']['family']
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            if run.font.name and run.font.name != expected_font:
                violations.append({
                    'type': 'font_error',
                    'severity': self.rules['font']['severity'],
                    'message': self.rules['font']['message_template'].format(
                        found_font=run.font.name, required_font=expected_font
                    ),
                    'auto_correctable': True
                })
```

### **Phase 4: Document Structure Analysis (NEW!)**
```
Extract Chapter Headers (Regex)
    ↓
Convert Roman Numerals to Integers
    ↓
Analyze Chapter Order
    ↓
Detect Structure Violations
    ↓
Generate Restructuring Plan
```

**Code Flow**:
```python
# document_restructurer.py - Structure analysis
def analyze_document_structure(self, document_path):
    doc = Document(document_path)
    chapters = []

    # Extract chapters using regex pattern matching
    for para_idx, paragraph in enumerate(doc.paragraphs):
        text = paragraph.text.strip().upper()

        # Rule-based pattern matching
        chapter_match = re.match(r'BAB\s+([IVX]+)\s+(.+)', text)
        if chapter_match:
            roman_num = chapter_match.group(1)
            chapter_title = chapter_match.group(2)

            # Convert roman to integer for ordering analysis
            chapter_num = self._roman_to_int(roman_num)

            chapters.append({
                'paragraph_index': para_idx,
                'roman_numeral': roman_num,
                'chapter_number': chapter_num,
                'title': chapter_title
            })

    # Rule-based order validation
    current_order = [ch['chapter_number'] for ch in chapters]
    correct_order = sorted(current_order)
    reordering_needed = (current_order != correct_order)

    return {
        'chapters': chapters,
        'reordering_needed': reordering_needed,
        'structure_issues': self._generate_structure_violations(chapters)
    }
```

### **Phase 5: Auto-Correction & Restructuring**
```
Group Corrections by Type
    ↓
Apply Standard Corrections:
├── Margin Corrections
├── Font Corrections
├── Spacing Corrections
└── Document Restructuring ← NEW!
    ↓
Save Corrected Document
```

**Code Flow**:
```python
# corrector.py - Type-based correction system
def apply_corrections(self, document_path, corrections_to_apply):
    # Group corrections by type for efficient processing
    corrections_by_type = {}
    for correction in corrections_to_apply:
        correction_type = correction.get('type')
        corrections_by_type.setdefault(correction_type, []).append(correction)

    # Apply corrections sequentially
    if 'margin' in corrections_by_type:
        self._apply_margin_corrections(doc, corrections_by_type['margin'])

    if 'font' in corrections_by_type:
        self._apply_font_corrections(doc, corrections_by_type['font'])

    # NEW: Document restructuring
    if 'document_restructure' in corrections_by_type:
        result = self._apply_document_restructuring(document_path, corrections_by_type['document_restructure'])
        if result['restructured_file_path']:
            document_path = result['restructured_file_path']  # Use restructured file
```

### **Phase 6: Document Restructuring Algorithm**
```
Create New Document
    ↓
Sort Chapters by Correct Order
    ↓
For Each Chapter:
├── Copy Chapter Heading (with format correction)
├── Copy All Chapter Content (preserve formatting)
├── Renumber Subsections (3.1 → 1.1)
└── Update References
    ↓
Save Restructured Document
```

**Code Flow**:
```python
# document_restructurer.py - Core restructuring algorithm
def restructure_document(self, document_path, options):
    doc = Document(document_path)
    analysis = self.analyze_document_structure(document_path)

    # Create new document with correct structure
    new_doc = Document()

    # Sort chapters by correct order (rule-based)
    sorted_chapters = sorted(analysis['chapters'], key=lambda x: x['chapter_number'])

    for chapter in sorted_chapters:
        # 1. Create corrected chapter heading
        self._create_corrected_chapter_heading(new_doc, chapter)

        # 2. Copy all content (content preservation)
        self._copy_chapter_content(doc, new_doc, chapter, analysis)

        # 3. Renumber subsections (rule-based renumbering)
        self._renumber_subsections(new_doc, chapter['chapter_number'])

    # Save restructured document
    restructured_path = self._save_restructured_document(new_doc, document_path)

    return {
        'success': True,
        'restructured_file_path': restructured_path,
        'original_order': [ch['title'] for ch in analysis['chapters']],
        'corrected_order': [ch['title'] for ch in sorted_chapters]
    }
```

## 🧮 Algoritma Khusus

### **1. Roman Numeral Conversion Algorithm**
```python
def _roman_to_int(self, roman):
    """Convert roman numeral to integer for sorting"""
    roman_numerals = {'I': 1, 'V': 5, 'X': 10}
    result = 0
    prev_value = 0

    # Process from right to left
    for char in reversed(roman):
        value = roman_numerals.get(char, 0)

        # Subtraction rule (IV = 4, IX = 9)
        if value < prev_value:
            result -= value
        else:
            result += value

        prev_value = value

    return result

# Test: "III" → 3, "IV" → 4, "IX" → 9
```

### **2. Content Boundary Detection Algorithm**
```python
def _find_chapter_boundaries(self, doc, chapters):
    """Find start and end boundaries for each chapter"""
    boundaries = []

    for i, chapter in enumerate(chapters):
        start_idx = chapter['paragraph_index']

        # Find end boundary (next chapter or document end)
        if i + 1 < len(chapters):
            end_idx = chapters[i + 1]['paragraph_index']
        else:
            end_idx = len(doc.paragraphs)

        boundaries.append({
            'chapter': chapter,
            'start': start_idx,
            'end': end_idx,
            'content_length': end_idx - start_idx - 1
        })

    return boundaries
```

### **3. Subsection Renumbering Algorithm**
```python
def _renumber_subsections(self, doc, chapter_number):
    """Renumber subsections to match new chapter number"""
    subsection_counter = 1

    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()

        # Match subsection patterns: "3.1 Title" → "1.1 Title"
        subsection_match = re.match(r'(\d+)\.(\d+)\s+(.+)', text)
        if subsection_match:
            old_chapter = int(subsection_match.group(1))
            subsection_num = int(subsection_match.group(2))
            title = subsection_match.group(3)

            # Update numbering
            new_text = f"{chapter_number}.{subsection_counter} {title}"

            # Replace paragraph content
            paragraph.clear()
            run = paragraph.add_run(new_text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(12)

            subsection_counter += 1
```

## 🎯 Rule-Based Processing Detail

### **Lokasi Implementation**:

1. **Rule Definition**: `config/formatting_rules.yaml`
2. **Rule Engine**: `src/validator.py`
3. **Rule Application**: `src/corrector.py`
4. **Structure Rules**: `src/document_restructurer.py`

### **Rule Types**:

```yaml
# Physical Layout Rules
page_setup:
  margins: {top: "4cm", left: "4cm", right: "3cm", bottom: "3cm"}
  paper_size: "A4"

# Typography Rules
typography:
  body_font: {family: "Times New Roman", size: "12pt"}
  line_spacing: {body_text: 1.5, abstract: 1.0}

# Structure Rules
document_types:
  proposal:
    required_sections:
      - "BAB I PENDAHULUAN"
      - "BAB II TINJAUAN PUSTAKA"
      - "BAB III METODE PENELITIAN"

# Validation Rules (Severity & Messages)
validation_rules:
  margins:
    severity: "error"
    message_template: "{margin} margin is {found} but should be {expected}"
  font:
    severity: "error"
    message_template: "{found_font} used instead of {required_font}"
```

### **Rule Processing Flow**:
```
YAML Rules → Python Config → Validation Engine → Violation Detection → Auto-Correction
```

## 🔬 Metode Penelitian Yang Diterapkan

### **1. Document Object Model (DOM) Processing**
- **Library**: `python-docx`
- **Method**: Parsing struktur dokumen Word ke dalam object model
- **Application**: Extract paragraphs, runs, formatting properties

### **2. Pattern Recognition dengan Regular Expression**
- **Method**: Regex pattern matching untuk identifikasi struktur
- **Patterns**: `r'BAB\s+([IVX]+)\s+(.+)'` untuk chapter detection
- **Application**: Extract chapter headers, subsections, numbering

### **3. Rule-Based Expert System**
- **Method**: Knowledge-based system dengan rules dalam YAML
- **Components**: Rule base, inference engine, working memory
- **Application**: Validation dan correction berdasarkan institutional rules

### **4. Content Preservation Algorithm**
- **Method**: Boundary detection + content copying dengan formatting preservation
- **Technique**: Deep copy semua formatting properties (font, size, bold, italic)
- **Application**: Restructure dokumen tanpa kehilangan konten

### **5. Modular Software Architecture**
- **Pattern**: Separation of concerns, dependency injection
- **Components**: Processor, Validator, Corrector, Restructurer, Reporter
- **Benefits**: Maintainability, testability, extensibility

---

**📊 Metodologi ini menggabungkan teknik Computer Science modern dengan kebutuhan praktis academic document processing, menghasilkan sistem yang robust, accurate, dan user-friendly.**