export class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentParams = {};
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Handle initial load
    }

    getCurrentPath() {
        const hash = window.location.hash.slice(1) || '/';
        return hash;
    }

    handleRoute() {
        const path = this.getCurrentPath();
        const route = this.matchRoute(path);

        if (route) {
            this.currentParams = route.params;
            this.render(route.view, route.params);
        } else {
            // Fallback to dashboard
            window.location.hash = '#/dashboard';
        }
    }

    matchRoute(path) {
        for (const route of this.routes) {
            // Convert route path to regex
            // e.g. /projects/:id -> /projects/([^/]+)
            const regexPath = route.path.replace(/:([^\s/]+)/g, '([^\\s/]+)');
            const regex = new RegExp(`^${regexPath}$`);
            const match = path.match(regex);

            if (match) {
                const params = {};
                const paramNames = (route.path.match(/:([^\s/]+)/g) || []).map(p => p.slice(1));

                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });

                return { view: route.view, params };
            }
        }
        return null;
    }

    render(ViewClass, params) {
        const container = document.getElementById('page-view');
        if (container) {
            // Cleanup previous view if needed (not implemented here but good practice)
            container.innerHTML = '';

            try {
                const view = new ViewClass(params);
                view.render();
            } catch (error) {
                console.error('Error rendering view:', error);
                container.innerHTML = '<div class="p-8 text-center text-danger">Error loading view. Please try again.</div>';
            }
        }
    }
}
