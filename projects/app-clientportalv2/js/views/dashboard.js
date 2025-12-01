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
            <div class="grid grid-cols-4 gap-6 mb-8">
                <!-- Cyber Stat Cards -->
                <div class="card relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fa-solid fa-layer-group text-6xl text-primary"></i>
                    </div>
                    <div class="relative z-10">
                        <div class="text-muted text-xs font-mono uppercase tracking-wider mb-1">Active Projects</div>
                        <div class="text-3xl font-bold text-white mb-2" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);">${activeProjects}</div>
                        <div class="flex items-center gap-2 text-xs text-success">
                            <i class="fa-solid fa-arrow-trend-up"></i>
                            <span>System Optimal</span>
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 w-full h-1 bg-primary/20">
                        <div class="h-full bg-primary" style="width: 75%; box-shadow: 0 0 10px var(--color-primary);"></div>
                    </div>
                </div>

                <div class="card relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fa-solid fa-list-check text-6xl text-warning"></i>
                    </div>
                    <div class="relative z-10">
                        <div class="text-muted text-xs font-mono uppercase tracking-wider mb-1">Pending Tasks</div>
                        <div class="text-3xl font-bold text-white mb-2" style="text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);">${pendingTasks}</div>
                        <div class="flex items-center gap-2 text-xs text-warning">
                            <i class="fa-solid fa-clock"></i>
                            <span>Processing...</span>
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 w-full h-1 bg-warning/20">
                        <div class="h-full bg-warning" style="width: 45%; box-shadow: 0 0 10px var(--color-warning);"></div>
                    </div>
                </div>

                <div class="card relative overflow-hidden group cursor-pointer" onclick="window.location.hash='#/messages'">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fa-solid fa-envelope text-6xl text-accent"></i>
                    </div>
                    <div class="relative z-10">
                        <div class="text-muted text-xs font-mono uppercase tracking-wider mb-1">Unread Messages</div>
                        <div class="text-3xl font-bold text-white mb-2" style="text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);">${unreadMessages}</div>
                        <div class="flex items-center gap-2 text-xs text-accent">
                            <i class="fa-solid fa-signal"></i>
                            <span>New Transmissions</span>
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 w-full h-1 bg-accent/20">
                        <div class="h-full bg-accent" style="width: ${unreadMessages > 0 ? '100%' : '0%'}; box-shadow: 0 0 10px var(--color-accent);"></div>
                    </div>
                </div>

                <div class="card relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fa-solid fa-file-invoice-dollar text-6xl text-danger"></i>
                    </div>
                    <div class="relative z-10">
                        <div class="text-muted text-xs font-mono uppercase tracking-wider mb-1">Due Invoices</div>
                        <div class="text-3xl font-bold text-white mb-2" style="text-shadow: 0 0 10px rgba(248, 113, 113, 0.5);">${dueInvoices}</div>
                        <div class="flex items-center gap-2 text-xs text-danger">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>Action Required</span>
                        </div>
                    </div>
                    <div class="absolute bottom-0 left-0 w-full h-1 bg-danger/20">
                        <div class="h-full bg-danger" style="width: ${dueInvoices > 0 ? '100%' : '0%'}; box-shadow: 0 0 10px var(--color-danger);"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-6">
                <!-- System Activity Log -->
                <div class="card col-span-2 relative overflow-hidden">
                    <div class="card-header border-b border-border/50 pb-4 mb-4 flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-terminal text-primary"></i>
                            <h3 class="font-mono text-sm font-bold text-primary tracking-wider">SYSTEM_ACTIVITY_LOG</h3>
                        </div>
                        <div class="flex gap-2">
                            <div class="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
                            <div class="w-2 h-2 rounded-full bg-warning animate-pulse" style="animation-delay: 0.2s"></div>
                            <div class="w-2 h-2 rounded-full bg-success animate-pulse" style="animation-delay: 0.4s"></div>
                        </div>
                    </div>
                    <div class="font-mono text-xs space-y-3 relative z-10">
                        ${state.activity.slice(0, 6).map((item, index) => `
                            <div class="flex items-start gap-3 opacity-0 animate-slide-in" style="animation: fadeIn 0.3s ease forwards ${index * 0.1}s;">
                                <span class="text-muted">[${item.time}]</span>
                                <span class="text-primary">></span>
                                <span class="text-text-main">${item.text}</span>
                            </div>
                        `).join('')}
                        <div class="flex items-center gap-2 mt-4 pt-2 border-t border-border/30 text-muted animate-pulse">
                            <span>_</span>
                        </div>
                    </div>
                    <!-- Matrix rain effect overlay could go here -->
                </div>

                <!-- Mission Timers (Deadlines) -->
                <div class="card">
                    <div class="card-header border-b border-border/50 pb-4 mb-4">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-hourglass-half text-accent"></i>
                            <h3 class="font-mono text-sm font-bold text-accent tracking-wider">MISSION_TIMERS</h3>
                        </div>
                    </div>
                    <div class="space-y-4">
                        ${upcoming.length > 0 ? upcoming.map(item => `
                            <div class="group p-3 rounded-lg bg-white/5 border border-white/5 hover:border-accent/50 transition-all">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-xs font-mono text-muted uppercase">${item.type}</span>
                                    <span class="text-xs font-bold text-white bg-accent/20 px-2 py-0.5 rounded text-accent border border-accent/20">${new Date(item.date).toLocaleDateString()}</span>
                                </div>
                                <div class="text-sm font-medium text-white group-hover:text-accent transition-colors truncate">${item.title}</div>
                            </div>
                        `).join('') : '<div class="text-muted text-xs font-mono text-center py-4">NO_ACTIVE_MISSIONS</div>'}
                    </div>
                    
                    <!-- Mini System Load Visualization -->
                    <div class="mt-6 pt-4 border-t border-border/50">
                        <div class="flex justify-between text-xs font-mono text-muted mb-1">
                            <span>CPU_LOAD</span>
                            <span>42%</span>
                        </div>
                        <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                            <div class="h-full bg-primary w-[42%] shadow-[0_0_10px_var(--color-primary)]"></div>
                        </div>
                        
                        <div class="flex justify-between text-xs font-mono text-muted mb-1">
                            <span>MEM_USAGE</span>
                            <span>68%</span>
                        </div>
                        <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div class="h-full bg-accent w-[68%] shadow-[0_0_10px_var(--color-accent)]"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
