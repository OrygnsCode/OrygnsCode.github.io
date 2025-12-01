import { store } from '../store.js';

export class ActivityView {
    constructor() {
        this.container = document.getElementById('page-view');
    }

    render() {
        const activity = store.getState().activity;

        this.container.innerHTML = `
            <div class="flex justify-between items-center mb-8 animate-fade-in">
                <h2 class="text-2xl font-bold flex items-center gap-2">
                    <i class="fa-solid fa-terminal text-success"></i> System_Log
                </h2>
                <div class="flex gap-2">
                    <div class="relative">
                        <i class="fa-solid fa-filter absolute left-3 top-3 text-muted text-xs"></i>
                        <select id="activity-filter" class="form-control pl-8 bg-card/50 border-border/50 font-mono text-xs uppercase tracking-wider focus:border-primary/50" style="width: 180px;">
                            <option value="all">All_Events</option>
                            <option value="project">Project_Updates</option>
                            <option value="task">Task_Status</option>
                            <option value="message">Comms_Log</option>
                            <option value="file">Data_Transfer</option>
                            <option value="billing">Financial_Ops</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="card bg-black/40 border-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] min-h-[500px] relative overflow-hidden">
                <!-- CRT Scanline Effect -->
                <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
                
                <div class="relative pl-6 border-l-2 border-primary/20 ml-4 space-y-8 py-4" id="activity-list">
                    ${this.renderActivityItems(activity)}
                </div>
            </div>
        `;

        document.getElementById('activity-filter').addEventListener('change', (e) => {
            const filter = e.target.value;
            let filtered = store.getState().activity;
            if (filter !== 'all') {
                filtered = filtered.filter(a => a.type === filter);
            }
            document.getElementById('activity-list').innerHTML = this.renderActivityItems(filtered);
        });
    }

    renderActivityItems(items) {
        if (items.length === 0) {
            return '<div class="pl-6 text-muted font-mono">NO_SYSTEM_ACTIVITY_DETECTED</div>';
        }

        return items.map((item, index) => `
            <div class="relative pl-8 group animate-slide-in" style="animation-delay: ${index * 0.05}s">
                <div class="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-body border border-primary/30 flex items-center justify-center text-primary z-10 shadow-[0_0_10px_rgba(6,182,212,0.2)] group-hover:scale-110 transition-transform">
                    <i class="fa-solid ${item.icon} text-[10px]"></i>
                </div>
                <div class="pt-0.5">
                    <div class="flex items-baseline gap-3 mb-1">
                        <span class="text-xs font-mono text-primary/70">[${item.time}]</span>
                        <span class="text-xs font-mono text-muted uppercase tracking-wider border border-white/10 px-1 rounded">${item.type}</span>
                    </div>
                    <div class="text-sm font-medium text-white group-hover:text-primary transition-colors font-mono">
                        <span class="text-success mr-2">></span>${item.text}
                    </div>
                </div>
            </div>
        `).join('');
    }
}
