import { store } from '../store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';

export class FilesView {
    constructor() {
        this.container = document.getElementById('page-view');
    }

    render() {
        const files = store.getState().files;

        this.container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Files</h2>
                <div class="flex gap-2">
                    <div class="search-container" style="width: 250px;">
                        <i class="fa-solid fa-magnifying-glass search-icon"></i>
                        <input type="text" id="file-search" class="search-input" placeholder="Search files...">
                    </div>
                    <button class="btn btn-primary" id="upload-btn">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Upload File
                    </button>
                </div>
            </div>

            <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button class="filter-chip active" data-filter="all">All Files</button>
                <button class="filter-chip" data-filter="image">Images</button>
                <button class="filter-chip" data-filter="pdf">Documents</button>
                <button class="filter-chip" data-filter="code">Code</button>
                <button class="filter-chip" data-filter="zip">Archives</button>
            </div>

            <div class="grid grid-cols-4 gap-4" id="files-grid">
                ${this.renderFiles(files)}
            </div>
        `;

        this.bindEvents();
    }

    renderFiles(files) {
        if (files.length === 0) {
            return '<div class="col-span-4 text-center py-12 text-muted">No files found</div>';
        }

        return files.map(file => `
            <div class="card group hover:border-primary transition-colors cursor-pointer">
                <div class="flex items-start justify-between mb-3">
                    <div class="w-10 h-10 rounded-lg bg-body flex items-center justify-center text-xl">
                        ${this.getFileIcon(file.type)}
                    </div>
                    <button class="text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>
                <h4 class="font-medium truncate mb-1" title="${file.name}">${file.name}</h4>
                <div class="text-xs text-muted mb-3">${file.size} • ${new Date(file.date).toLocaleDateString()}</div>
                <div class="flex items-center gap-2">
                    <span class="badge badge-neutral text-[10px]">${file.project}</span>
                </div>
            </div>
        `).join('');
    }

    getFileIcon(type) {
        const icons = {
            'image': '<i class="fa-regular fa-image text-info"></i>',
            'pdf': '<i class="fa-regular fa-file-pdf text-danger"></i>',
            'doc': '<i class="fa-regular fa-file-word text-primary"></i>',
            'xls': '<i class="fa-regular fa-file-excel text-success"></i>',
            'zip': '<i class="fa-regular fa-file-zipper text-warning"></i>',
            'code': '<i class="fa-regular fa-file-code text-secondary"></i>'
        };
        return icons[type] || '<i class="fa-regular fa-file text-muted"></i>';
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('file-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterFiles();
            });
        }

        // Filters
        this.container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.filterFiles();
            });
        });

        // Upload Modal
        document.getElementById('upload-btn').addEventListener('click', () => {
            modal.show({
                title: 'Upload File',
                confirmText: 'Upload',
                content: `
                    <div class="space-y-4">
                        <div class="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                            <i class="fa-solid fa-cloud-arrow-up text-4xl text-muted mb-3"></i>
                            <div class="text-sm font-medium mb-1">Click to upload or drag and drop</div>
                            <div class="text-xs text-muted">SVG, PNG, JPG or GIF (max. 800x400px)</div>
                        </div>
                        <div>
                            <label class="form-label">File Name</label>
                            <input type="text" id="upload-name" class="form-control" placeholder="Custom file name (optional)">
                        </div>
                        <div>
                            <label class="form-label">Project</label>
                            <select id="upload-project" class="form-control">
                                <option value="Internal">Internal</option>
                                <option value="Website Redesign">Website Redesign</option>
                                <option value="Mobile App">Mobile App</option>
                            </select>
                        </div>
                    </div>
                `,
                onConfirm: () => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            const mockFile = {
                                name: document.getElementById('upload-name').value || `Upload_${Date.now()}.pdf`,
                                type: 'pdf',
                                size: '2.5 MB',
                                project: document.getElementById('upload-project').value,
                                tags: ['Upload']
                            };
                            store.addFile(mockFile);
                            this.render();
                            toast.show('File uploaded successfully');
                            resolve();
                        }, 1500);
                    });
                }
            });
        });
    }

    filterFiles() {
        const query = document.getElementById('file-search').value.toLowerCase();
        const typeFilter = this.container.querySelector('.filter-chip.active').dataset.filter;

        let filtered = store.getState().files;

        if (typeFilter !== 'all') {
            filtered = filtered.filter(f => {
                if (typeFilter === 'image') return ['image', 'png', 'jpg'].includes(f.type);
                if (typeFilter === 'pdf') return ['pdf', 'doc', 'txt'].includes(f.type);
                return f.type === typeFilter;
            });
        }

        if (query) {
            filtered = filtered.filter(f => f.name.toLowerCase().includes(query));
        }

        document.getElementById('files-grid').innerHTML = this.renderFiles(filtered);
    }
}
