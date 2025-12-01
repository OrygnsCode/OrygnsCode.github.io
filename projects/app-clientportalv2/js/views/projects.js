import { store } from '../store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';

export class ProjectsView {
    constructor(params) {
        this.container = document.getElementById('page-view');
        this.params = params;
        this.activeTab = 'overview'; // Default tab for detail view
    }

    render() {
        const projectId = this.params && this.params.id;

        if (projectId) {
            this.renderDetail(projectId);
        } else {
            this.renderList();
        }
    }

    renderList() {
        const projects = store.getState().projects;

        this.container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Projects</h2>
                <div class="flex gap-2 items-center">
                    <div class="search-container relative">
                        <i class="fa-solid fa-magnifying-glass search-icon"></i>
                        <input type="text" id="project-search" class="search-input" placeholder="Search projects...">
                    </div>
                    <button class="btn btn-primary" id="new-project-btn">
                        <i class="fa-solid fa-plus"></i> New Project
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-6" id="projects-grid">
                ${projects.map(project => this.createProjectCard(project)).join('')}
            </div>
        `;

        // Bind search event
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = store.getState().projects.filter(p =>
                    p.title.toLowerCase().includes(query) ||
                    p.client.toLowerCase().includes(query)
                );
                document.getElementById('projects-grid').innerHTML = filtered.map(p => this.createProjectCard(p)).join('');
            });
        }

        // Bind New Project Modal
        const newProjectBtn = document.getElementById('new-project-btn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                modal.show({
                    title: 'Create New Project',
                    confirmText: 'Create Project',
                    content: `
                        <div class="space-y-4">
                            <div>
                                <label class="form-label">Project Title</label>
                                <input type="text" id="np-title" class="form-control" placeholder="e.g. Website Redesign">
                            </div>
                            <div>
                                <label class="form-label">Client</label>
                                <input type="text" id="np-client" class="form-control" placeholder="Client Name">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="form-label">Due Date</label>
                                    <input type="date" id="np-date" class="form-control">
                                </div>
                                <div>
                                    <label class="form-label">Budget</label>
                                    <input type="text" id="np-budget" class="form-control" placeholder="$0.00">
                                </div>
                            </div>
                            <div>
                                <label class="form-label">Description</label>
                                <textarea id="np-desc" class="form-control" rows="3"></textarea>
                            </div>
                        </div>
                    `,
                    onConfirm: () => {
                        return new Promise((resolve) => {
                            const title = document.getElementById('np-title').value;
                            const client = document.getElementById('np-client').value;

                            if (!title || !client) {
                                toast.show('Please fill in required fields', 'error');
                                resolve(); // Close modal anyway or handle validation better (for now simple)
                                return;
                            }

                            setTimeout(() => {
                                store.addProject({
                                    title,
                                    client,
                                    status: 'Planning',
                                    progress: 0,
                                    dueDate: document.getElementById('np-date').value || new Date().toISOString(),
                                    description: document.getElementById('np-desc').value,
                                    team: []
                                });
                                this.renderList();
                                toast.show('Project created successfully');
                                resolve();
                            }, 1000);
                        });
                    }
                });
            });
        }
    }

    createProjectCard(project) {
        return `
            <div class="card relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all duration-300" onclick="window.location.hash='#/projects/${project.id}'">
                <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex justify-between items-start mb-4">
                    <div class="avatar bg-primary-bg text-primary border border-primary/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                        ${project.title.substring(0, 2).toUpperCase()}
                    </div>
                    <span class="badge ${this.getStatusBadgeClass(project.status)} shadow-sm">${project.status}</span>
                </div>
                
                <h3 class="text-lg font-bold mb-1 group-hover:text-primary transition-colors">${project.title}</h3>
                <p class="text-sm text-muted mb-4">${project.client}</p>
                
                <div class="mb-4">
                    <div class="flex justify-between text-xs mb-1">
                        <span class="text-muted font-mono">PROGRESS_Sequence</span>
                        <span class="font-bold text-primary">${project.progress}%</span>
                    </div>
                    <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full bg-primary transition-all duration-500 relative" style="width: ${project.progress}%">
                            <div class="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-4 border-t border-border/50">
                    <div class="avatar-group">
                        ${project.team.map(member => `
                            <div class="avatar avatar-sm border-2 border-bg-card" title="${member.name}">${member.avatar}</div>
                        `).join('')}
                    </div>
                    <div class="text-xs text-muted font-mono">
                        <i class="fa-regular fa-clock mr-1"></i> ${new Date(project.dueDate).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `;
    }

    renderDetail(id) {
        const project = store.getState().projects.find(p => p.id === id);
        if (!project) {
            this.container.innerHTML = '<div class="text-center mt-8 text-muted">Project not found</div>';
            return;
        }

        this.container.innerHTML = `
            <div class="mb-8 animate-fade-in">
                <a href="#/projects" class="text-sm text-muted hover:text-primary mb-4 inline-flex items-center gap-2 transition-colors">
                    <i class="fa-solid fa-arrow-left"></i> Back to Projects
                </a>
                <div class="flex justify-between items-end">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h1 class="text-4xl font-bold text-white tracking-tight">${project.title}</h1>
                            <span class="badge ${this.getStatusBadgeClass(project.status)}">${project.status}</span>
                        </div>
                        <div class="flex items-center gap-4 text-sm text-muted font-mono">
                            <span class="flex items-center gap-2"><i class="fa-solid fa-building"></i> ${project.client}</span>
                            <span class="text-border">|</span>
                            <span class="flex items-center gap-2"><i class="fa-regular fa-calendar"></i> Due ${new Date(project.dueDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button class="btn btn-secondary hover:border-primary hover:text-primary hover:shadow-glow transition-all">
                        <i class="fa-solid fa-pen"></i> Edit Project
                    </button>
                </div>
            </div>

            <div class="tabs border-b border-border/50 mb-6">
                <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
                <button class="tab-btn ${this.activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">Tasks</button>
                <button class="tab-btn ${this.activeTab === 'files' ? 'active' : ''}" data-tab="files">Files</button>
            </div>

            <div id="tab-content" class="animate-slide-up">
                ${this.getTabContent(project)}
            </div>
        `;

        this.bindDetailEvents(project);
    }

    getTabContent(project) {
        switch (this.activeTab) {
            case 'overview':
                return `
                    <div class="grid grid-cols-3 gap-6">
                        <div class="col-span-2 space-y-6">
                            <div class="card">
                                <h3 class="card-title mb-4 flex items-center gap-2">
                                    <i class="fa-solid fa-align-left text-primary"></i> Description
                                </h3>
                                <p class="text-secondary leading-relaxed">${project.description}</p>
                            </div>
                            
                            <div class="card">
                                <h3 class="card-title mb-4 flex items-center gap-2">
                                    <i class="fa-solid fa-flag text-accent"></i> Milestones
                                </h3>
                                <div class="space-y-6 relative pl-4 border-l border-border/30 ml-2">
                                    ${project.milestones.map(m => `
                                        <div class="relative pl-6 group">
                                            <div class="absolute -left-[21px] top-1 w-3 h-3 rounded-full ${m.status === 'Completed' ? 'bg-success shadow-[0_0_10px_var(--color-success)]' : m.status === 'In Progress' ? 'bg-primary shadow-[0_0_10px_var(--color-primary)]' : 'bg-border'} border-2 border-bg-card transition-all group-hover:scale-125"></div>
                                            <div class="flex justify-between items-start p-3 rounded-lg hover:bg-white/5 transition-colors">
                                                <div>
                                                    <div class="font-medium ${m.status === 'Completed' ? 'text-muted line-through' : 'text-white'}">${m.title}</div>
                                                    <div class="text-xs text-muted font-mono mt-1">${new Date(m.date).toLocaleDateString()}</div>
                                                </div>
                                                <span class="badge ${this.getStatusBadgeClass(m.status)}">${m.status}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-6">
                            <div class="card">
                                <h3 class="card-title mb-4 flex items-center gap-2">
                                    <i class="fa-solid fa-users text-info"></i> Team
                                </h3>
                                <div class="space-y-3">
                                    ${project.team.map(member => `
                                        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <div class="avatar avatar-sm border border-border">${member.avatar}</div>
                                            <div>
                                                <div class="text-sm font-medium text-white">${member.name}</div>
                                                <div class="text-xs text-muted">${member.role}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="card relative overflow-hidden">
                                <div class="absolute top-0 right-0 p-4 opacity-5">
                                    <i class="fa-solid fa-chart-pie text-6xl"></i>
                                </div>
                                <h3 class="card-title mb-4">Progress</h3>
                                <div class="text-center py-6">
                                    <div class="text-5xl font-bold text-primary mb-2" style="text-shadow: 0 0 20px rgba(6,182,212,0.3);">${project.progress}%</div>
                                    <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                                        <div class="h-full bg-primary shadow-[0_0_10px_var(--color-primary)]" style="width: ${project.progress}%"></div>
                                    </div>
                                    <div class="text-xs text-muted font-mono">COMPLETION_RATE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            case 'tasks':
                return `
                    <div class="card">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="card-title">Tasks</h3>
                            <button class="btn btn-primary btn-sm shadow-glow"><i class="fa-solid fa-plus"></i> Add Task</button>
                        </div>
                        <div class="space-y-1">
                            ${project.tasks.map(task => `
                                <div class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-md transition-colors group">
                                    <div class="w-5 h-5 rounded border border-muted flex items-center justify-center cursor-pointer ${task.status === 'Completed' ? 'bg-success border-success text-white' : ''}"
                                         data-task-id="${task.id}"
                                         data-project-id="${project.id}"
                                         data-status="${task.status}">
                                        ${task.status === 'Completed' ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                                    </div>
                                    <div class="flex-1">
                                        <div class="text-sm font-medium ${task.status === 'Completed' ? 'text-muted line-through' : ''}">${task.title}</div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="avatar avatar-sm text-xs" title="${task.assignee}">${task.assignee.split(' ').map(n => n[0]).join('')}</div>
                                        <span class="badge ${this.getPriorityBadgeClass(task.priority)}">${task.priority}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'files':
                return `<div class="text-center py-8 text-muted">Files view coming soon (See global Files section)</div>`;
            default:
                return '';
        }
    }

    bindDetailEvents(project) {
        // Tab switching
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                this.renderDetail(project.id);
            });
        });

        // Task Toggle
        this.container.querySelectorAll('[data-task-id]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = el.dataset.taskId;
                const projectId = el.dataset.projectId;
                const currentStatus = el.dataset.status;
                const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';

                store.updateTask(projectId, taskId, { status: newStatus });
                this.renderDetail(projectId); // Re-render to show updates
            });
        });
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'Completed': return 'badge-success';
            case 'In Progress': return 'badge-info';
            case 'Pending': return 'badge-warning';
            case 'Planning': return 'badge-neutral';
            case 'On Hold': return 'badge-warning';
            default: return 'badge-neutral';
        }
    }

    getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'High': return 'badge-danger';
            case 'Medium': return 'badge-warning';
            case 'Low': return 'badge-success';
            default: return 'badge-neutral';
        }
    }
}
