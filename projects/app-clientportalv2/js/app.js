import { store } from './store.js';
import { Router } from './router.js';
import { Layout } from './components/layout.js';
import { DashboardView } from './views/dashboard.js';
import { ProjectsView } from './views/projects.js';
import { MessagesView } from './views/messages.js';
import { FilesView } from './views/files.js';
import { BillingView } from './views/billing.js';
import { ActivityView } from './views/activity.js';
import { SettingsView } from './views/settings.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        console.log('Initializing Client Portal V2...');

        // 1. Initialize Store (Load Data)
        await store.loadUserData();

        // 2. Initialize Layout
        this.layout = new Layout();

        // 3. Initialize Router
        this.router = new Router([
            { path: '/', view: DashboardView },
            { path: '/dashboard', view: DashboardView },
            { path: '/projects', view: ProjectsView },
            { path: '/projects/:id', view: ProjectsView },
            { path: '/messages', view: MessagesView },
            { path: '/messages/:id', view: MessagesView },
            { path: '/files', view: FilesView },
            { path: '/billing', view: BillingView },
            { path: '/activity', view: ActivityView },
            { path: '/settings', view: SettingsView }
        ]);

        // 4. Bind Router to Layout (for active state)
        window.addEventListener('hashchange', () => {
            this.layout.updateActiveNav(this.router.getCurrentPath());
        });

        // Initial active state
        this.layout.updateActiveNav(this.router.getCurrentPath());

        // Start Router
        this.router.init();

        console.log('App initialized successfully.');
    }
}

// Start the app
new App();
