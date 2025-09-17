// Upload handling for UNISMUH Thesis Formatter

document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const dragDropZone = document.getElementById('dragDropZone');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));

    let selectedFile = null;

    // File validation
    const validateFile = (file) => {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Hanya file .docx yang diperbolehkan');
        }

        if (file.size > maxSize) {
            throw new Error('Ukuran file maksimal 50MB');
        }

        return true;
    };

    // Display selected file info
    const displayFileInfo = (file) => {
        const fileInfoHtml = `
            <div class="file-info">
                <div class="d-flex align-items-center">
                    <i class="fas fa-file-word fa-2x me-3"></i>
                    <div>
                        <h6 class="mb-1">${file.name}</h6>
                        <small>Ukuran: ${formatBytes(file.size)}</small>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-light" onclick="clearSelectedFile()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Replace drag zone content
        dragDropZone.innerHTML = fileInfoHtml;
        uploadBtn.disabled = false;
    };

    // Clear selected file
    window.clearSelectedFile = () => {
        selectedFile = null;
        fileInput.value = '';
        uploadBtn.disabled = true;

        // Restore drag zone
        dragDropZone.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Seret dan lepas file di sini</h5>
            <p class="text-muted mb-3">atau</p>
            <button type="button" class="btn btn-outline-primary" onclick="document.getElementById('fileInput').click()">
                <i class="fas fa-folder-open me-2"></i>Pilih File
            </button>
        `;
    };

    // Handle file selection
    const handleFileSelect = (file) => {
        try {
            validateFile(file);
            selectedFile = file;
            displayFileInfo(file);
            showToast('File berhasil dipilih', 'success');
        } catch (error) {
            showToast(error.message, 'danger');
            clearSelectedFile();
        }
    };

    // File input change handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Drag and drop handlers
    dragDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropZone.classList.add('dragover');
    });

    dragDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('dragover');
    });

    dragDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // Progress update function
    const updateProgress = (percent, text) => {
        progressBar.style.width = percent + '%';
        progressBar.setAttribute('aria-valuenow', percent);
        progressText.textContent = text;
    };

    // Upload form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            showToast('Pilih file terlebih dahulu', 'warning');
            return;
        }

        try {
            // Show loading modal
            loadingModal.show();

            // Show progress container
            progressContainer.classList.remove('d-none');
            updateProgress(0, 'Memulai upload...');

            // Simulate upload progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress > 90) {
                    progress = 90;
                    clearInterval(progressInterval);
                }
                updateProgress(progress, 'Mengunggah file...');
            }, 300);

            // Upload file
            const uploadResult = await handleFileUpload(selectedFile);

            // Complete progress
            clearInterval(progressInterval);
            updateProgress(100, 'Upload selesai');

            // Store file ID
            currentFileId = uploadResult.file_id;

            // Hide loading modal
            loadingModal.hide();

            // Show processing message
            updateProgress(100, 'Memproses dokumen...');

            // Perform validation
            const docInfo = uploadResult.result.document_info;
            document.getElementById('documentInfo').innerHTML = renderDocumentInfo(docInfo);

            await performValidation(currentFileId);

            // Hide progress container
            setTimeout(() => {
                progressContainer.classList.add('d-none');
            }, 1000);

            showToast('Dokumen berhasil diproses!', 'success');

        } catch (error) {
            console.error('Upload error:', error);
            loadingModal.hide();
            progressContainer.classList.add('d-none');
            showToast('Upload gagal: ' + error.message, 'danger');
        }
    });

    // Keyboard accessibility
    dragDropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    // Make drag zone focusable
    dragDropZone.setAttribute('tabindex', '0');
    dragDropZone.setAttribute('role', 'button');
    dragDropZone.setAttribute('aria-label', 'Klik atau seret file untuk upload');

    console.log('Upload functionality initialized');
});