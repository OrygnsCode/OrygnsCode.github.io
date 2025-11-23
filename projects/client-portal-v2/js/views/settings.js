import { store } from '../store.js';
import { toast } from '../components/Toast.js';

export class SettingsView {
    constructor() {
        this.container = document.getElementById('page-view');
        this.activeTab = 'profile';
    }

    render() {
        const user = store.getState().user;

        this.container.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">Settings</h2>

            <div class="grid grid-cols-4 gap-6">
                <div class="col-span-1">
                    <div class="card p-2">
                        <button class="w-full text-left p-3 rounded-md hover:bg-white/5 transition-colors mb-1 ${this.activeTab === 'profile' ? 'bg-primary/10 text-primary font-medium' : 'text-secondary'}" data-tab="profile">
                            <i class="fa-regular fa-user w-6"></i> Profile
                        </button>
                        <button class="w-full text-left p-3 rounded-md hover:bg-white/5 transition-colors mb-1 ${this.activeTab === 'security' ? 'bg-primary/10 text-primary font-medium' : 'text-secondary'}" data-tab="security">
                            <i class="fa-solid fa-shield-halved w-6"></i> Security
                        </button>
                        <button class="w-full text-left p-3 rounded-md hover:bg-white/5 transition-colors ${this.activeTab === 'notifications' ? 'bg-primary/10 text-primary font-medium' : 'text-secondary'}" data-tab="notifications">
                            <i class="fa-regular fa-bell w-6"></i> Notifications
                        </button>
                    </div>
                </div>

                <div class="col-span-3">
                    ${this.getTabContent(user)}
                </div>
            </div>
        `;

        this.bindEvents();
    }

    getTabContent(user) {
        switch (this.activeTab) {
            case 'profile':
                return `
                    <div class="card">
                        <h3 class="card-title mb-6">Public Profile</h3>
                        <div class="flex items-center gap-6 mb-8">
                            <div class="avatar avatar-lg text-2xl">${user.avatar}</div>
                            <div>
                                <button class="btn btn-secondary btn-sm mb-2">Change Avatar</button>
                                <div class="text-xs text-muted">JPG, GIF or PNG. Max size of 800K</div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="form-label">Full Name</label>
                                <input type="text" id="profile-name" class="form-control" value="${user.name}">
                            </div>
                            <div>
                                <label class="form-label">Company</label>
                                <input type="text" id="profile-company" class="form-control" value="${user.company}">
                            </div>
                        </div>
                        <div class="mb-6">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" value="${user.email}" disabled>
                            <div class="text-xs text-muted mt-1">Contact support to change email</div>
                        </div>

                        <div class="flex justify-end">
                            <button class="btn btn-primary" id="save-profile">Save Changes</button>
                        </div>
                    </div>
                `;
            case 'security':
                return `
                    <div class="card mb-6">
                        <h3 class="card-title mb-4">Password</h3>
                        <div class="space-y-4 mb-6">
                            <div>
                                <label class="form-label">Current Password</label>
                                <input type="password" class="form-control">
                            </div>
                            <div>
                                <label class="form-label">New Password</label>
                                <input type="password" class="form-control">
                            </div>
                        </div>
                        <div class="flex justify-end">
                            <button class="btn btn-secondary">Update Password</button>
                        </div>
                    </div>
                    <div class="card">
                        <h3 class="card-title mb-4">Login History</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center py-2 border-b border-border">
                                <div>
                                    <div class="font-medium">Mac OS • Chrome</div>
                                    <div class="text-xs text-muted">Los Angeles, US • Current Session</div>
                                </div>
                                <div class="text-xs text-success">Active now</div>
                            </div>
                            <div class="flex justify-between items-center py-2">
                                <div>
                                    <div class="font-medium">iPhone 13 • Safari</div>
                                    <div class="text-xs text-muted">Los Angeles, US • 2 days ago</div>
                                </div>
                                <div class="text-xs text-muted">Nov 18</div>
                            </div>
                        </div>
                    </div>
                `;
            case 'notifications':
                return `
                    <div class="card">
                        <h3 class="card-title mb-6">Notification Preferences</h3>
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium mb-1">Email Notifications</div>
                                    <div class="text-sm text-muted">Receive daily summaries of activity</div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked>
                                    <div class="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium mb-1">Project Updates</div>
                                    <div class="text-sm text-muted">Get notified when tasks are completed</div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked>
                                    <div class="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium mb-1">Billing Alerts</div>
                                    <div class="text-sm text-muted">Get notified about new invoices</div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked>
                                    <div class="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    bindEvents() {
        // Tab Switching
        this.container.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                this.render();
            });
        });

        // Profile Save
        const saveBtn = document.getElementById('save-profile');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const name = document.getElementById('profile-name').value;
                const company = document.getElementById('profile-company').value;

                store.updateProfile({ name, company });
                toast.show('Profile updated successfully');
            });
        }
    }
}
