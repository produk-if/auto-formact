from flask import Flask, render_template, request, jsonify, send_file, flash, redirect, url_for
import os
import uuid
import yaml
from datetime import datetime
from werkzeug.utils import secure_filename
from src.document_processor import DocumentProcessor
from src.validator import DocumentValidator
from src.corrector import DocumentCorrector
from src.report_generator import ReportGenerator
from src.document_restructurer import DocumentRestructurer

app = Flask(__name__)
app.secret_key = 'unismuh-thesis-formatter-secret-key'

# Configuration
UPLOAD_FOLDER = 'temp'
ALLOWED_EXTENSIONS = {'docx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_config():
    """Load formatting rules from YAML configuration"""
    with open('config/formatting_rules.yaml', 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

@app.route('/')
def index():
    """Main page for document upload"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle document upload and processing"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file selected'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Only .docx files are allowed'}), 400

        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        original_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{filename}")

        # Save uploaded file
        file.save(original_path)

        # Load configuration
        config = load_config()

        # Process document
        processor = DocumentProcessor(config)
        processing_result = processor.process_document(original_path, file_id)

        return jsonify({
            'success': True,
            'file_id': file_id,
            'filename': filename,
            'result': processing_result
        })

    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

@app.route('/validate/<file_id>')
def validate_document(file_id):
    """Validate document against formatting rules"""
    try:
        config = load_config()

        # Find the document file
        files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith(file_id)]
        if not files:
            return jsonify({'error': 'Document not found'}), 404

        doc_path = os.path.join(app.config['UPLOAD_FOLDER'], files[0])

        # Validate document
        validator = DocumentValidator(config)
        violations = validator.validate_document(doc_path)

        return jsonify({
            'success': True,
            'violations': violations,
            'total_violations': len(violations),
            'severity_summary': validator.get_severity_summary(violations)
        })

    except Exception as e:
        return jsonify({'error': f'Validation failed: {str(e)}'}), 500

@app.route('/correct/<file_id>', methods=['POST'])
def correct_document(file_id):
    """Apply automatic corrections to document"""
    try:
        config = load_config()

        # Find the document file
        files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith(file_id)]
        if not files:
            return jsonify({'error': 'Document not found'}), 404

        doc_path = os.path.join(app.config['UPLOAD_FOLDER'], files[0])

        # Get correction options from request
        corrections_to_apply = request.json.get('corrections', [])

        # Apply corrections
        corrector = DocumentCorrector(config)
        correction_result = corrector.apply_corrections(doc_path, corrections_to_apply)

        return jsonify({
            'success': True,
            'corrections_applied': correction_result['applied'],
            'corrections_failed': correction_result['failed'],
            'corrected_file_path': correction_result['corrected_file_path']
        })

    except Exception as e:
        return jsonify({'error': f'Correction failed: {str(e)}'}), 500

@app.route('/restructure/<file_id>', methods=['POST'])
def restructure_document(file_id):
    """Restructure document chapters to correct order"""
    try:
        config = load_config()

        # Find the document file
        files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith(file_id)]
        if not files:
            return jsonify({'error': 'Document not found'}), 404

        doc_path = os.path.join(app.config['UPLOAD_FOLDER'], files[0])

        # Initialize restructurer
        restructurer = DocumentRestructurer(config)

        # Get restructuring options from request (default to auto-restructure)
        restructure_options = request.json.get('options', {'reorder_chapters': True})

        # Apply restructuring
        result = restructurer.restructure_document(doc_path, restructure_options)

        return jsonify({
            'success': result['success'],
            'message': result['message'],
            'changes_applied': result['changes_applied'],
            'original_order': result.get('original_order', []),
            'corrected_order': result.get('corrected_order', []),
            'restructured_file_path': result['restructured_file_path']
        })

    except Exception as e:
        return jsonify({'error': f'Restructuring failed: {str(e)}'}), 500

@app.route('/preview-restructure/<file_id>')
def preview_restructure(file_id):
    """Preview restructuring changes without applying them"""
    try:
        config = load_config()

        # Find the document file
        files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith(file_id)]
        if not files:
            return jsonify({'error': 'Document not found'}), 404

        doc_path = os.path.join(app.config['UPLOAD_FOLDER'], files[0])

        # Initialize restructurer
        restructurer = DocumentRestructurer(config)

        # Get preview
        preview = restructurer.get_restructuring_preview(doc_path)

        return jsonify({
            'success': True,
            'preview': preview
        })

    except Exception as e:
        return jsonify({'error': f'Preview failed: {str(e)}'}), 500

@app.route('/report/<file_id>')
def generate_report(file_id):
    """Generate compliance report"""
    try:
        config = load_config()

        # Find the document file
        files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith(file_id)]
        if not files:
            return jsonify({'error': 'Document not found'}), 404

        doc_path = os.path.join(app.config['UPLOAD_FOLDER'], files[0])

        # Generate report
        report_generator = ReportGenerator(config)
        report_path = report_generator.generate_pdf_report(doc_path, file_id)

        return send_file(report_path, as_attachment=True,
                        download_name=f'compliance_report_{file_id}.pdf')

    except Exception as e:
        return jsonify({'error': f'Report generation failed: {str(e)}'}), 500

@app.route('/download/<file_id>')
def download_document(file_id):
    """Download processed document"""
    try:
        # Find the corrected document file
        corrected_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER'])
                          if f.startswith(f"{file_id}_corrected")]

        if corrected_files:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], corrected_files[0])
            original_name = corrected_files[0].replace(f"{file_id}_corrected_", "")
            return send_file(file_path, as_attachment=True,
                           download_name=f"corrected_{original_name}")
        else:
            # If no corrected version, return original
            original_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER'])
                            if f.startswith(file_id) and not f.endswith('_corrected.docx')]
            if original_files:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], original_files[0])
                original_name = original_files[0].replace(f"{file_id}_", "")
                return send_file(file_path, as_attachment=True, download_name=original_name)

        return jsonify({'error': 'Document not found'}), 404

    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@app.route('/status/<file_id>')
def get_processing_status(file_id):
    """Get processing status for file"""
    try:
        # Check if processing is complete by looking for processed files
        files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith(file_id)]

        if not files:
            return jsonify({'status': 'not_found'})

        # Simple status check - in a real implementation, you'd track this properly
        return jsonify({
            'status': 'completed',
            'files_found': len(files),
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': f'Status check failed: {str(e)}'}), 500

@app.route('/rules')
def view_rules():
    """Display formatting rules"""
    try:
        config = load_config()
        return render_template('rules.html', rules=config)
    except Exception as e:
        flash(f'Error loading rules: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 50MB.'}), 413

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error occurred.'}), 500

if __name__ == '__main__':
    # Ensure temp directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)