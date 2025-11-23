import { store } from '../store.js';

export class ActivityView {
    constructor() {
        this.container = document.getElementById('page-view');
    }

    render() {
        const activity = store.getState().activity;

        this.container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Activity Log</h2>
                <div class="flex gap-2">
                    <select id="activity-filter" class="form-control" style="width: 150px;">
                        <option value="all">All Activity</option>
                        <option value="project">Projects</option>
                        <option value="task">Tasks</option>
                        <option value="message">Messages</option>
                        <option value="file">Files</option>
                        <option value="billing">Billing</option>
                    </select>
                </div>
            </div>

            <div class="card">
                <div class="relative pl-4 border-l border-border ml-2 space-y-8" id="activity-list">
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
            return '<div class="pl-6 text-muted">No activity found</div>';
        }

        return items.map(item => `
            <div class="relative pl-6">
                <div class="absolute -left-[21px] top-0 w-10 h-10 rounded-full bg-body border border-border flex items-center justify-center text-muted z-10">
                    <i class="fa-solid ${item.icon}"></i>
                </div>
                <div class="pt-1">
                    <div class="text-sm font-medium text-white mb-1">${item.text}</div>
                    <div class="text-xs text-muted">${item.time}</div>
                </div>
            </div>
        `).join('');
    }
}
