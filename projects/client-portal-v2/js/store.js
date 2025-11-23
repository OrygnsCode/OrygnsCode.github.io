import { mockData } from './data/mock-data.js';

export class Store {
    constructor() {
        this.state = {
            user: null,
            projects: [],
            messages: [],
            files: [],
            invoices: [],
            activity: [],
            notifications: [],
            searchResults: null,
            settings: {}
        };
        this.listeners = [];

        // Bind methods to ensure 'this' context
        this.notify = this.notify.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.getState = this.getState.bind(this);
        this.setState = this.setState.bind(this);
    }

    // Core API
    subscribe(listener) {
        this.listeners.push(listener);
        // Return unsubscribe function for convenience
        return () => this.unsubscribe(listener);
    }

    unsubscribe(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    getState() {
        return { ...this.state }; // Return shallow copy to prevent direct mutation
    }

    setState(partialState) {
        this.state = { ...this.state, ...partialState };
        this.notify();
        this.persistSettings();
    }

    // Data Loading
    async loadUserData() {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // Load from mock data
            // Deep clone to avoid reference issues
            const data = JSON.parse(JSON.stringify(mockData));

            // Merge with localStorage if available
            const savedProfile = this.loadFromStorage('user_profile');
            if (savedProfile) {
                data.user = { ...data.user, ...savedProfile };
            }

            this.setState({
                user: data.user,
                projects: data.projects,
                messages: data.messages,
                files: data.files,
                invoices: data.invoices,
                activity: data.activity,
                notifications: data.notifications
            });

            console.log('Store initialized with data:', this.state);
        } catch (error) {
            console.error('Failed to load user data:', error);
            // Fallback to empty state to prevent crash
            this.setState({
                user: { name: 'Guest', role: 'Visitor' },
                projects: [],
                messages: [],
                files: [],
                invoices: [],
                activity: [],
                notifications: []
            });
        }
    }

    loadFromStorage(key) {
        try {
            const item = localStorage.getItem(`cp_v2_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('LocalStorage access failed:', e);
            return null;
        }
    }

    saveToStorage(key, value) {
        try {
            localStorage.setItem(`cp_v2_${key}`, JSON.stringify(value));
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    }

    persistSettings() {
        if (this.state.user) {
            // Only persist specific user fields that are editable
            const profileToSave = {
                name: this.state.user.name,
                company: this.state.user.company,
                avatar: this.state.user.avatar
            };
            this.saveToStorage('user_profile', profileToSave);
        }
    }

    // Actions

    // Projects
    updateProject(id, updates) {
        const projects = this.state.projects.map(p =>
            p.id === id ? { ...p, ...updates } : p
        );
        this.setState({ projects });
        this.addActivity(`Updated project "${projects.find(p => p.id === id).title}"`, 'project', 'fa-pen-to-square');
    }

    updateTask(projectId, taskId, updates) {
        const projects = this.state.projects.map(p => {
            if (p.id === projectId) {
                const tasks = p.tasks.map(t =>
                    t.id === taskId ? { ...t, ...updates } : t
                );
                // Recalculate progress
                const completed = tasks.filter(t => t.status === 'Completed').length;
                const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : p.progress;
                return { ...p, tasks, progress };
            }
            return p;
        });
        this.setState({ projects });

        // Log activity if task completed
        if (updates.status === 'Completed') {
            const project = projects.find(p => p.id === projectId);
            const task = project.tasks.find(t => t.id === taskId);
            this.addActivity(`Completed task "${task.title}"`, 'task', 'fa-check');
        }
    }

    // Messages
    addMessage(message) {
        const newMessage = {
            id: `m${Date.now()}`,
            date: new Date().toISOString(),
            read: true,
            thread: [],
            ...message
        };
        this.setState({ messages: [newMessage, ...this.state.messages] });
        this.addActivity(`Sent new message: "${message.subject}"`, 'message', 'fa-paper-plane');
    }

    replyToMessage(threadId, text) {
        const messages = this.state.messages.map(m => {
            if (m.id === threadId) {
                const newReply = {
                    id: `msg${Date.now()}`,
                    sender: 'Me',
                    text: text,
                    time: new Date().toISOString(),
                    isMe: true,
                    avatar: this.state.user.avatar
                };
                return {
                    ...m,
                    lastMessage: text,
                    date: new Date().toISOString(),
                    read: true,
                    thread: [...m.thread, newReply]
                };
            }
            return m;
        });
        this.setState({ messages });
    }

    markMessageRead(id) {
        const messages = this.state.messages.map(m =>
            m.id === id ? { ...m, read: true } : m
        );
        this.setState({ messages });
        // Also update notification badge if linked
        const notifications = this.state.notifications.map(n =>
            n.link === `#/messages/${id}` ? { ...n, read: true } : n
        );
        this.setState({ notifications });
    }

    // Files
    addFile(file) {
        const newFile = {
            id: `f${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            ...file
        };
        this.setState({ files: [newFile, ...this.state.files] });
        this.addActivity(`Uploaded file "${file.name}"`, 'file', 'fa-cloud-arrow-up');
    }

    // Billing
    payInvoice(id) {
        const invoices = this.state.invoices.map(inv =>
            inv.id === id ? { ...inv, status: 'Paid', paidDate: new Date().toISOString() } : inv
        );
        this.setState({ invoices });
        this.addActivity(`Paid invoice ${id}`, 'billing', 'fa-credit-card');
    }

    // Settings
    updateProfile(updates) {
        this.setState({ user: { ...this.state.user, ...updates } });
        this.addActivity('Updated profile information', 'settings', 'fa-user-pen');
    }

    // Activity
    addActivity(text, type = 'system', icon = 'fa-info-circle') {
        const newActivity = {
            id: `a${Date.now()}`,
            text,
            time: 'Just now',
            type,
            icon
        };
        this.setState({ activity: [newActivity, ...this.state.activity] });
    }

    // Search
    search(query) {
        if (!query) {
            this.setState({ searchResults: null });
            return;
        }

        query = query.toLowerCase();
        const results = [];

        // Search Projects
        this.state.projects.forEach(p => {
            if (p.title.toLowerCase().includes(query) || p.client.toLowerCase().includes(query)) {
                results.push({ type: 'Project', title: p.title, link: `#/projects/${p.id}` });
            }
        });

        // Search Files
        this.state.files.forEach(f => {
            if (f.name.toLowerCase().includes(query)) {
                results.push({ type: 'File', title: f.name, link: `#/files` });
            }
        });

        // Search Messages
        this.state.messages.forEach(m => {
            if (m.subject.toLowerCase().includes(query)) {
                results.push({ type: 'Message', title: m.subject, link: `#/messages/${m.id}` });
            }
        });

        this.setState({ searchResults: results });
    }
}

// Singleton instance
export const store = new Store();
