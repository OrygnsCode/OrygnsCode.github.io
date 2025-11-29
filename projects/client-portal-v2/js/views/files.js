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
            <div class="flex justify-between items-center mb-8 animate-fade-in">
                <h2 class="text-2xl font-bold flex items-center gap-2">
                    <i class="fa-solid fa-database text-accent"></i> Files_Repository
                </h2>
                <div class="flex gap-3">
                    <div class="search-container relative group" style="width: 250px;">
                        <i class="fa-solid fa-magnifying-glass search-icon text-muted group-focus-within:text-primary transition-colors"></i>
                        <input type="text" id="file-search" class="search-input bg-card/50 border-border/50 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all" placeholder="Search data shards...">
                    </div>
                    <button class="btn btn-primary shadow-glow" id="upload-btn">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Upload Data
                    </button>
                </div>
            </div>

            <div class="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <button class="filter-chip active" data-filter="all"><i class="fa-solid fa-layer-group"></i> All Data</button>
                <button class="filter-chip" data-filter="image"><i class="fa-regular fa-image"></i> Images</button>
                <button class="filter-chip" data-filter="pdf"><i class="fa-regular fa-file-pdf"></i> Docs</button>
                <button class="filter-chip" data-filter="code"><i class="fa-solid fa-code"></i> Code</button>
                <button class="filter-chip" data-filter="zip"><i class="fa-regular fa-file-zipper"></i> Archives</button>
            </div>

            <div class="grid grid-cols-4 gap-6" id="files-grid">
                ${this.renderFiles(files)}
            </div>
        `;

        this.bindEvents();
    }

    renderFiles(files) {
        if (files.length === 0) {
            return '<div class="col-span-4 text-center py-12 text-muted font-mono border border-dashed border-border/30 rounded-xl">NO_DATA_SHARDS_FOUND</div>';
        }

        return files.map((file, index) => `
            <div class="card group hover:border-primary/50 transition-all duration-300 cursor-pointer relative overflow-hidden animate-slide-up" style="animation-delay: ${index * 0.05}s">
                <div class="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button class="w-8 h-8 rounded-full bg-body/80 hover:bg-primary hover:text-white flex items-center justify-center transition-colors backdrop-blur-sm">
                        <i class="fa-solid fa-download text-xs"></i>
                    </button>
                </div>
                
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-body/50 border border-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        ${this.getFileIcon(file.type)}
                    </div>
                    <div class="w-2 h-2 rounded-full bg-success shadow-[0_0_5px_var(--color-success)]"></div>
                </div>
                
                <h4 class="font-medium truncate mb-1 text-white group-hover:text-primary transition-colors" title="${file.name}">${file.name}</h4>
                <div class="text-xs text-muted mb-4 font-mono flex items-center gap-2">
                    <span>${file.size}</span>
                    <span class="text-border">|</span>
                    <span>${new Date(file.date).toLocaleDateString()}</span>
                </div>
                
                <div class="flex items-center gap-2 pt-3 border-t border-border/30">
                    <span class="badge badge-neutral text-[10px] border border-white/5 group-hover:border-primary/30 transition-colors">${file.project}</span>
                </div>
                
                <div class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
        `).join('');
    }

    getFileIcon(type) {
        const icons = {
            'image': '<i class="fa-regular fa-image text-info drop-shadow-[0_0_5px_rgba(14,165,233,0.5)]"></i>',
            'pdf': '<i class="fa-regular fa-file-pdf text-danger drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]"></i>',
            'doc': '<i class="fa-regular fa-file-word text-primary drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"></i>',
            'xls': '<i class="fa-regular fa-file-excel text-success drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]"></i>',
            'zip': '<i class="fa-regular fa-file-zipper text-warning drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]"></i>',
            'code': '<i class="fa-regular fa-file-code text-secondary drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]"></i>'
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
