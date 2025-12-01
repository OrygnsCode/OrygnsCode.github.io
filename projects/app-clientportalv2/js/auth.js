export default class Auth {
    constructor(store) {
        this.store = store;
        this.demoUsers = [
            {
                email: 'client@example.com',
                password: 'password123',
                name: 'Sarah Connor',
                company: 'Cyberdyne Systems',
                role: 'Client',
                avatar: 'SC'
            },
            {
                email: 'staff@example.com',
                password: 'password123',
                name: 'John Doe',
                company: 'OrygnsCode',
                role: 'Admin',
                avatar: 'JD'
            }
        ];
    }

    checkAuth() {
        const user = this.store.state.user;
        return !!user;
    }

    login(email, password) {
        return new Promise((resolve, reject) => {
            // Simulate API delay
            setTimeout(() => {
                const user = this.demoUsers.find(u => u.email === email && u.password === password);

                if (user) {
                    // Don't store password in state
                    const { password, ...safeUser } = user;
                    this.store.setUser(safeUser);
                    resolve(safeUser);
                } else {
                    reject(new Error('Invalid email or password'));
                }
            }, 800);
        });
    }

    logout() {
        this.store.setUser(null);
        window.location.hash = '#/login';
    }
}
