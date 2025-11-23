import { store } from '../store.js';

export class DashboardView {
    constructor() {
        this.container = document.getElementById('page-view');
    }

    render() {
        const state = store.getState();

        // Calculate stats
        const activeProjects = state.projects.filter(p => p.status === 'In Progress').length;
        const pendingTasks = state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status !== 'Completed').length, 0);
        const unreadMessages = state.messages.filter(m => !m.read).length;
        const dueInvoices = state.invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue').length;

        // Get upcoming deadlines
        const upcoming = [
            ...state.projects.map(p => ({ title: `Project Due: ${p.title}`, date: p.dueDate, type: 'project' })),
            ...state.invoices.filter(i => i.status === 'Unpaid').map(i => ({ title: `Invoice Due: ${i.id}`, date: i.dueDate, type: 'invoice' }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

        this.container.innerHTML = `
            <div class="grid grid-cols-4 gap-4 mb-4">
                <!-- Stat Cards -->
                <div class="card">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-muted text-sm font-medium">Active Projects</span>
                        <div class="btn-icon bg-primary-bg text-primary flex items-center justify-center rounded-full" style="width: 32px; height: 32px;">
                            <i class="fa-solid fa-layer-group"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold">${activeProjects}</div>
                    <div class="text-xs text-success mt-1 flex items-center gap-1">
                        <i class="fa-solid fa-arrow-trend-up"></i> <span>On track</span>
                    </div>
                </div>

                <div class="card">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-muted text-sm font-medium">Pending Tasks</span>
                        <div class="btn-icon bg-warning-bg text-warning flex items-center justify-center rounded-full" style="width: 32px; height: 32px;">
                            <i class="fa-solid fa-list-check"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold">${pendingTasks}</div>
                    <div class="text-xs text-muted mt-1">Across all projects</div>
                </div>

                <div class="card">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-muted text-sm font-medium">Unread Messages</span>
                        <div class="btn-icon bg-info-bg text-info flex items-center justify-center rounded-full" style="width: 32px; height: 32px;">
                            <i class="fa-solid fa-envelope"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold">${unreadMessages}</div>
                    <div class="text-xs text-primary mt-1 cursor-pointer hover:underline" onclick="window.location.hash='#/messages'">View Inbox</div>
                </div>

                <div class="card">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-muted text-sm font-medium">Due Invoices</span>
                        <div class="btn-icon bg-danger-bg text-danger flex items-center justify-center rounded-full" style="width: 32px; height: 32px;">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                        </div>
                    </div>
                    <div class="text-2xl font-bold">${dueInvoices}</div>
                    <div class="text-xs text-danger mt-1">Action required</div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
                <!-- Recent Activity -->
                <div class="card col-span-2" style="grid-column: span 2;">
                    <div class="card-header">
                        <h3 class="card-title">Recent Activity</h3>
                        <a href="#/activity" class="btn btn-secondary btn-sm">View All</a>
                    </div>
                    <div class="activity-feed">
                        ${state.activity.slice(0, 5).map(item => `
                            <div class="flex items-start gap-4 mb-4 last:mb-0">
                                <div class="avatar avatar-sm bg-card border-border text-muted">
                                    <i class="fa-solid ${item.icon}"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="text-sm font-medium">${item.text}</div>
                                    <div class="text-xs text-muted">${item.time}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Upcoming Deadlines -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Upcoming Deadlines</h3>
                    </div>
                    <div class="space-y-4">
                        ${upcoming.length > 0 ? upcoming.map(item => `
                            <div class="flex items-center gap-3 p-3 rounded-md bg-body border border-border">
                                <div class="w-1 h-full bg-${item.type === 'project' ? 'primary' : 'danger'} rounded-full"></div>
                                <div class="flex-1">
                                    <div class="text-sm font-medium truncate">${item.title}</div>
                                    <div class="text-xs text-muted">${new Date(item.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                        `).join('') : '<div class="text-muted text-sm text-center">No upcoming deadlines</div>'}
                    </div>
                </div>
            </div>
        `;
    }
}
