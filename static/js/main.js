// Main JavaScript for UNISMUH Thesis Formatter

// Global variables
let currentFileId = null;

// Utility functions
const showToast = (message, type = 'info') => {
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    // Initialize and show toast
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    toast.show();

    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Show/hide loading states
const showLoading = (element, text = 'Loading...') => {
    const originalContent = element.innerHTML;
    element.setAttribute('data-original-content', originalContent);
    element.innerHTML = `
        <span class="loading-spinner"></span>
        ${text}
    `;
    element.disabled = true;
};

const hideLoading = (element) => {
    const originalContent = element.getAttribute('data-original-content');
    if (originalContent) {
        element.innerHTML = originalContent;
        element.removeAttribute('data-original-content');
    }
    element.disabled = false;
};

// API calls
const apiCall = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// File upload handling
const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();
};

// Document validation
const validateDocument = async (fileId) => {
    return await apiCall(`/validate/${fileId}`);
};

// Document correction
const correctDocument = async (fileId, corrections) => {
    return await apiCall(`/correct/${fileId}`, {
        method: 'POST',
        body: JSON.stringify({ corrections })
    });
};

// Document restructuring
const restructureDocument = async (fileId, options = {}) => {
    return await apiCall(`/restructure/${fileId}`, {
        method: 'POST',
        body: JSON.stringify({ options })
    });
};

// Restructuring preview
const getRestructurePreview = async (fileId) => {
    return await apiCall(`/preview-restructure/${fileId}`);
};

// Report generation
const generateReport = async (fileId) => {
    const response = await fetch(`/report/${fileId}`);
    if (!response.ok) {
        throw new Error('Report generation failed');
    }
    return response.blob();
};

// Document download
const downloadDocument = async (fileId) => {
    const response = await fetch(`/download/${fileId}`);
    if (!response.ok) {
        throw new Error('Download failed');
    }
    return response.blob();
};

// UI rendering functions
const renderDocumentInfo = (docInfo) => {
    return `
        <div class="col-md-6">
            <div class="stat-card stat-card-info">
                <h5><i class="fas fa-file-word me-2"></i>Informasi Dokumen</h5>
                <div class="mt-3">
                    <div class="row text-start">
                        <div class="col-6"><strong>Judul:</strong></div>
                        <div class="col-6">${docInfo.title}</div>
                    </div>
                    <div class="row text-start">
                        <div class="col-6"><strong>Penulis:</strong></div>
                        <div class="col-6">${docInfo.author}</div>
                    </div>
                    <div class="row text-start">
                        <div class="col-6"><strong>Paragraf:</strong></div>
                        <div class="col-6">${docInfo.paragraph_count}</div>
                    </div>
                    <div class="row text-start">
                        <div class="col-6"><strong>Kata:</strong></div>
                        <div class="col-6">${docInfo.estimated_word_count}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderViolationsSummary = (validation) => {
    return `
        <div class="col-md-6">
            <div class="stat-card ${validation.errors > 0 ? 'stat-card-error' : validation.warnings > 0 ? 'stat-card-warning' : 'stat-card-success'}">
                <h5><i class="fas fa-chart-pie me-2"></i>Ringkasan Validasi</h5>
                <div class="row mt-3">
                    <div class="col-3 text-center">
                        <h3>${validation.errors}</h3>
                        <small>Error</small>
                    </div>
                    <div class="col-3 text-center">
                        <h3>${validation.warnings}</h3>
                        <small>Warning</small>
                    </div>
                    <div class="col-3 text-center">
                        <h3>${validation.suggestions}</h3>
                        <small>Saran</small>
                    </div>
                    <div class="col-3 text-center">
                        <h3>${validation.total_violations}</h3>
                        <small>Total</small>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderViolationsList = (violations) => {
    if (!violations || violations.length === 0) {
        return `
            <div class="alert alert-success" role="alert">
                <h4 class="alert-heading"><i class="fas fa-check-circle me-2"></i>Selamat!</h4>
                <p>Tidak ada pelanggaran formatting yang ditemukan. Dokumen Anda sudah sesuai dengan pedoman UNISMUH Makassar.</p>
            </div>
        `;
    }

    let html = '<div class="accordion" id="violationsAccordion">';

    // Group violations by severity
    const groupedViolations = {
        error: violations.filter(v => v.severity === 'error'),
        warning: violations.filter(v => v.severity === 'warning'),
        suggestion: violations.filter(v => v.severity === 'suggestion')
    };

    const severityConfig = {
        error: { title: 'Kesalahan Kritis', icon: 'fas fa-times-circle', class: 'danger' },
        warning: { title: 'Peringatan', icon: 'fas fa-exclamation-triangle', class: 'warning' },
        suggestion: { title: 'Saran Perbaikan', icon: 'fas fa-lightbulb', class: 'info' }
    };

    Object.entries(groupedViolations).forEach(([severity, items], index) => {
        if (items.length > 0) {
            const config = severityConfig[severity];
            html += `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button"
                                data-bs-toggle="collapse" data-bs-target="#collapse${severity}"
                                aria-expanded="${index === 0}" aria-controls="collapse${severity}">
                            <i class="${config.icon} text-${config.class} me-2"></i>
                            ${config.title} (${items.length})
                        </button>
                    </h2>
                    <div id="collapse${severity}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                         data-bs-parent="#violationsAccordion">
                        <div class="accordion-body">
            `;

            items.forEach((violation, violationIndex) => {
                const correctable = violation.auto_correctable ? '<i class="fas fa-magic text-success ms-2" title="Dapat dikoreksi otomatis"></i>' : '';
                html += `
                    <div class="violation-item violation-${severity}" id="violation-${severity}-${violationIndex}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="fw-bold mb-1">
                                    <span class="violation-icon">
                                        <i class="${config.icon} text-${config.class}"></i>
                                    </span>
                                    ${violation.message}
                                    ${correctable}
                                </div>
                                ${violation.location ? `<small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${violation.location}</small>` : ''}
                            </div>
                            <span class="severity-${severity}">
                                ${severity.toUpperCase()}
                            </span>
                        </div>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                </div>
            `;
        }
    });

    html += '</div>';
    return html;
};

// Event handlers
const handleDownloadReport = async () => {
    const btn = document.getElementById('generateReportBtn');
    showLoading(btn, 'Generating...');

    try {
        const blob = await generateReport(currentFileId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance_report_${currentFileId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Laporan PDF berhasil diunduh', 'success');
    } catch (error) {
        showToast('Gagal mengunduh laporan: ' + error.message, 'danger');
    } finally {
        hideLoading(btn);
    }
};

const handleDownloadDocument = async () => {
    const btn = document.getElementById('downloadBtn');
    showLoading(btn, 'Downloading...');

    try {
        const blob = await downloadDocument(currentFileId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dokumen_${currentFileId}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Dokumen berhasil diunduh', 'success');
    } catch (error) {
        showToast('Gagal mengunduh dokumen: ' + error.message, 'danger');
    } finally {
        hideLoading(btn);
    }
};

const handleAutoCorrect = async () => {
    const btn = document.getElementById('autoCorrectBtn');
    showLoading(btn, 'Correcting...');

    try {
        // Get all auto-correctable violations
        const violations = JSON.parse(sessionStorage.getItem('currentViolations') || '[]');
        const autoCorrectableViolations = violations
            .filter(v => v.auto_correctable && v.correction)
            .map(v => v.correction);

        if (autoCorrectableViolations.length === 0) {
            showToast('Tidak ada pelanggaran yang dapat dikoreksi otomatis', 'info');
            return;
        }

        const result = await correctDocument(currentFileId, autoCorrectableViolations);

        showToast(`${result.corrections_applied.length} koreksi berhasil diterapkan`, 'success');

        if (result.corrections_failed.length > 0) {
            showToast(`${result.corrections_failed.length} koreksi gagal diterapkan`, 'warning');
        }

        // Refresh validation
        await performValidation(currentFileId);

    } catch (error) {
        showToast('Gagal melakukan koreksi otomatis: ' + error.message, 'danger');
    } finally {
        hideLoading(btn);
    }
};

const handleRestructure = async () => {
    const btn = document.getElementById('restructureBtn');
    if (!btn) return;

    showLoading(btn, 'Restructuring...');

    try {
        // First show preview if available
        const preview = await getRestructurePreview(currentFileId);

        if (preview.preview && preview.preview.preview_available) {
            const confirmed = await showRestructureConfirmation(preview.preview);
            if (!confirmed) {
                hideLoading(btn);
                return;
            }
        }

        // Apply restructuring
        const result = await restructureDocument(currentFileId, { reorder_chapters: true });

        if (result.success) {
            showToast(`Dokumen berhasil direstrukturisasi: ${result.message}`, 'success');

            // Show changes applied
            if (result.changes_applied && result.changes_applied.length > 0) {
                showToast(`${result.changes_applied.length} perubahan diterapkan`, 'info');
            }

            // Update current file ID if a new restructured file was created
            if (result.restructured_file_path) {
                // Extract new file ID from path
                const pathParts = result.restructured_file_path.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const newFileId = fileName.split('_')[0];
                currentFileId = newFileId;
            }

            // Refresh validation with new document
            await performValidation(currentFileId);

        } else {
            showToast('Restrukturisasi gagal: ' + result.message, 'danger');
        }

    } catch (error) {
        showToast('Gagal melakukan restrukturisasi: ' + error.message, 'danger');
    } finally {
        hideLoading(btn);
    }
};

const showRestructureConfirmation = async (preview) => {
    return new Promise((resolve) => {
        const modalHtml = `
            <div class="modal fade" id="restructureModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-sort me-2"></i>
                                Konfirmasi Restrukturisasi Dokumen
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Dokumen akan direorganisasi untuk mengurutkan BAB sesuai standar UNISMUH.
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="fw-bold text-danger">Urutan Saat Ini:</h6>
                                    <ul class="list-group">
                                        ${preview.current_order.map(ch => `
                                            <li class="list-group-item d-flex align-items-center">
                                                <span class="badge bg-danger me-2">${ch.roman}</span>
                                                ${ch.title}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="fw-bold text-success">Urutan Setelah Koreksi:</h6>
                                    <ul class="list-group">
                                        ${preview.corrected_order.map(ch => `
                                            <li class="list-group-item d-flex align-items-center">
                                                <span class="badge bg-success me-2">${ch.roman}</span>
                                                ${ch.title}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancelRestructure">
                                <i class="fas fa-times me-2"></i>Batal
                            </button>
                            <button type="button" class="btn btn-primary" id="confirmRestructure">
                                <i class="fas fa-check me-2"></i>Ya, Restructure Dokumen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById('restructureModal'));
        modal.show();

        // Event listeners
        document.getElementById('confirmRestructure').addEventListener('click', () => {
            modal.hide();
            resolve(true);
        });

        document.getElementById('cancelRestructure').addEventListener('click', () => {
            modal.hide();
            resolve(false);
        });

        // Clean up modal when hidden
        document.getElementById('restructureModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('restructureModal').remove();
        });
    });
};

const handleUploadAnother = () => {
    // Reset the form
    document.getElementById('uploadForm').reset();
    document.getElementById('resultsCard').classList.add('d-none');
    document.getElementById('uploadBtn').disabled = true;

    // Clear current file
    currentFileId = null;
    sessionStorage.removeItem('currentViolations');

    showToast('Formulir telah direset untuk dokumen baru', 'info');
};

// Initialize tooltips
const initializeTooltips = () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
};

// Perform validation and display results
const performValidation = async (fileId) => {
    try {
        const validationResult = await validateDocument(fileId);

        // Store violations for later use
        sessionStorage.setItem('currentViolations', JSON.stringify(validationResult.violations));

        // Show results card
        const resultsCard = document.getElementById('resultsCard');
        resultsCard.classList.remove('d-none');
        resultsCard.classList.add('fade-in');

        // Update violation summary
        document.getElementById('violationsSummary').innerHTML = renderViolationsSummary(validationResult.severity_summary);

        // Update violations list
        document.getElementById('violationsList').innerHTML = renderViolationsList(validationResult.violations);

        // Enable/disable auto-correct button based on available corrections
        const autoCorrectBtn = document.getElementById('autoCorrectBtn');
        const autoCorrectableCount = validationResult.violations.filter(v => v.auto_correctable).length;

        if (autoCorrectableCount > 0) {
            autoCorrectBtn.disabled = false;
            autoCorrectBtn.innerHTML = `<i class="fas fa-magic me-2"></i>Koreksi Otomatis (${autoCorrectableCount})`;
        } else {
            autoCorrectBtn.disabled = true;
            autoCorrectBtn.innerHTML = `<i class="fas fa-magic me-2"></i>Tidak Ada Koreksi Otomatis`;
        }

        // Show/hide restructure button based on document order violations
        const restructureBtn = document.getElementById('restructureBtn');
        const needsRestructuring = validationResult.violations.some(v => v.type === 'document_reordering');

        if (needsRestructuring) {
            restructureBtn.classList.remove('d-none');
            restructureBtn.disabled = false;
        } else {
            restructureBtn.classList.add('d-none');
        }

        // Initialize tooltips for new elements
        initializeTooltips();

    } catch (error) {
        showToast('Gagal melakukan validasi: ' + error.message, 'danger');
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tooltips
    initializeTooltips();

    // Add event listeners for buttons (will be added when results are shown)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'generateReportBtn' || e.target.closest('#generateReportBtn')) {
            e.preventDefault();
            handleDownloadReport();
        } else if (e.target.id === 'downloadBtn' || e.target.closest('#downloadBtn')) {
            e.preventDefault();
            handleDownloadDocument();
        } else if (e.target.id === 'autoCorrectBtn' || e.target.closest('#autoCorrectBtn')) {
            e.preventDefault();
            handleAutoCorrect();
        } else if (e.target.id === 'uploadAnotherBtn' || e.target.closest('#uploadAnotherBtn')) {
            e.preventDefault();
            handleUploadAnother();
        } else if (e.target.id === 'restructureBtn' || e.target.closest('#restructureBtn')) {
            e.preventDefault();
            handleRestructure();
        }
    });

    console.log('UNISMUH Thesis Formatter initialized');
});