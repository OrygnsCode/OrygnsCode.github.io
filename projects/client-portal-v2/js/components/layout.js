import { store } from '../store.js';

export class Layout {
    constructor() {
        this.sidebarNav = document.querySelector('.sidebar-nav');
        this.pageTitle = document.getElementById('page-title');
        this.globalSearch = document.getElementById('global-search');
        this.searchResults = document.getElementById('search-results');
        this.notificationBadge = document.getElementById('notification-badge');
        this.userProfileContainer = document.getElementById('sidebar-user-profile');

        this.init();
    }

    init() {
        this.bindEvents();

        // Initial render
        this.renderUserProfile();
        this.updateNotifications();

        // Subscribe to store
        store.subscribe(state => {
            this.renderUserProfile();
            this.updateNotifications();
            if (state.searchResults) {
                this.renderSearchResults(state.searchResults);
            }
        });
    }

    bindEvents() {
        // Global Search
        if (this.globalSearch) {
            this.globalSearch.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                store.search(query);
                if (query.length > 0) {
                    this.searchResults.classList.add('active');
                } else {
                    this.searchResults.classList.remove('active');
                }
            });

            // Hide search results on click outside
            document.addEventListener('click', (e) => {
                if (this.globalSearch && this.searchResults &&
                    !this.globalSearch.contains(e.target) &&
                    !this.searchResults.contains(e.target)) {
                    this.searchResults.classList.remove('active');
                }
            });
        }
    }

    updateActiveNav(path) {
        if (!this.sidebarNav) return;

        // Remove active class from all
        this.sidebarNav.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current path
        // Handle root path or specific routes
        let activeLink = this.sidebarNav.querySelector(`[data-path="${path}"]`);

        // Fallback for detail routes (e.g. /projects/1 -> /projects)
        if (!activeLink && path.includes('/')) {
            const basePath = '/' + path.split('/')[1];
            activeLink = this.sidebarNav.querySelector(`[data-path="${basePath}"]`);
        }

        if (activeLink) {
            activeLink.classList.add('active');
            if (this.pageTitle) {
                this.pageTitle.textContent = activeLink.querySelector('span').textContent;
            }
        }
    }

    renderUserProfile() {
        const user = store.getState().user;
        if (!user || !this.userProfileContainer) return;

        this.userProfileContainer.innerHTML = `
            <div class="avatar avatar-sm">${user.avatar}</div>
            <div style="flex: 1; overflow: hidden;">
                <div style="font-size: 0.875rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.role}</div>
            </div>
            <i class="fa-solid fa-chevron-right transition-transform" id="user-dropdown-arrow" style="font-size: 0.75rem; color: var(--color-text-muted);"></i>
            
            <!-- Dropdown Menu -->
            <div class="absolute bottom-full left-0 w-full mb-2 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible transition-all transform translate-y-2 z-50" id="user-dropdown-menu">
                <div class="p-1">
                    <a href="#/settings" class="block px-3 py-2 rounded-md hover:bg-white/5 text-sm text-secondary hover:text-white transition-colors">
                        <i class="fa-regular fa-user mr-2"></i> Profile
                    </a>
                    <a href="#/settings" class="block px-3 py-2 rounded-md hover:bg-white/5 text-sm text-secondary hover:text-white transition-colors">
                        <i class="fa-solid fa-gear mr-2"></i> Settings
                    </a>
                    <div class="h-px bg-border my-1"></div>
                    <button class="w-full text-left px-3 py-2 rounded-md hover:bg-danger/10 text-sm text-danger transition-colors" onclick="alert('Logged out (Demo)')">
                        <i class="fa-solid fa-arrow-right-from-bracket mr-2"></i> Logout
                    </button>
                </div>
            </div>
        `;

        // Toggle Dropdown
        const container = this.userProfileContainer;
        const menu = container.querySelector('#user-dropdown-menu');
        const arrow = container.querySelector('#user-dropdown-arrow');

        container.style.position = 'relative';
        container.style.cursor = 'pointer';

        // Remove old listener if exists (simple way)
        const newContainer = container.cloneNode(true);
        container.parentNode.replaceChild(newContainer, container);
        this.userProfileContainer = newContainer;

        this.userProfileContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = this.userProfileContainer.querySelector('#user-dropdown-menu');
            const arrow = this.userProfileContainer.querySelector('#user-dropdown-arrow');

            menu.classList.toggle('invisible');
            menu.classList.toggle('opacity-0');
            menu.classList.toggle('translate-y-2');

            if (menu.classList.contains('invisible')) {
                arrow.style.transform = 'rotate(0deg)';
            } else {
                arrow.style.transform = 'rotate(90deg)';
            }
        });

        // Close on click outside
        document.addEventListener('click', () => {
            const menu = this.userProfileContainer.querySelector('#user-dropdown-menu');
            const arrow = this.userProfileContainer.querySelector('#user-dropdown-arrow');
            if (menu && !menu.classList.contains('invisible')) {
                menu.classList.add('invisible', 'opacity-0', 'translate-y-2');
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    }

    updateNotifications() {
        const notifications = store.getState().notifications;
        if (!this.notificationBadge) return;

        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            this.notificationBadge.style.display = 'block';
        } else {
            this.notificationBadge.style.display = 'none';
        }
    }

    renderSearchResults(results) {
        if (!this.searchResults) return;

        if (!results || results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-result-item" style="cursor: default; color: var(--color-text-muted);">No results found</div>';
            return;
        }

        this.searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="window.location.hash='${result.link}'">
                <span class="search-result-type">${result.type}</span>
                <span style="font-weight: 500;">${result.title}</span>
            </div>
        `).join('');
    }
}
