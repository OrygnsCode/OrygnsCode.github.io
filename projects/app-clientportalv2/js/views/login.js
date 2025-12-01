export default class LoginView {
    constructor(app) {
        this.app = app;
        this.element = document.createElement('div');
        this.element.className = 'login-container';
    }

    render() {
        this.element.innerHTML = `
            <div class="login-card">
                <div class="login-header">
                    <h2 style="font-size: 2rem; margin-bottom: 0.5rem; color: var(--color-primary);">Orygns Portal</h2>
                    <p style="color: var(--color-text-secondary);">Sign in to your account</p>
                </div>
                
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" id="email" class="form-input" value="client@example.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" id="password" class="form-input" value="password123" required>
                    </div>
                    
                    <div class="error-message" id="error-msg">Invalid credentials</div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                        Sign In
                    </button>
                    
                    <div style="margin-top: 1.5rem; text-align: center; font-size: 0.85rem; color: var(--color-text-muted);">
                        <p>Demo Credentials:</p>
                        <p>client@example.com / password123</p>
                        <p>staff@example.com / password123</p>
                    </div>
                </form>
            </div>
        `;

        this.attachEvents();
        return this.element;
    }

    attachEvents() {
        const form = this.element.querySelector('#login-form');
        const errorMsg = this.element.querySelector('#error-msg');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            const btn = form.querySelector('button[type="submit"]');

            // Loading state
            btn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0;"></div>';
            btn.disabled = true;
            errorMsg.classList.remove('visible');

            try {
                await this.app.auth.login(email, password);
                window.location.hash = '#/dashboard';
            } catch (err) {
                errorMsg.textContent = err.message;
                errorMsg.classList.add('visible');
                btn.innerHTML = 'Sign In';
                btn.disabled = false;
            }
        });
    }
}
