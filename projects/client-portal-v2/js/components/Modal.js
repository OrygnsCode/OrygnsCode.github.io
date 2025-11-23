export class Modal {
    constructor() {
        this.element = null;
    }

    show({ title, content, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) {
        // Remove existing modal if any
        if (this.element) {
            this.close();
        }

        this.element = document.createElement('div');
        this.element.className = 'modal-backdrop';
        this.element.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">${cancelText}</button>
                    <button class="btn btn-primary modal-confirm">
                        <span class="btn-text">${confirmText}</span>
                        <i class="fa-solid fa-spinner fa-spin hidden"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.element);

        // Animation
        requestAnimationFrame(() => {
            this.element.classList.add('active');
            this.element.querySelector('.modal-container').classList.add('active');
        });

        // Event Listeners
        this.element.querySelector('.modal-close').addEventListener('click', () => this.close());
        this.element.querySelector('.modal-cancel').addEventListener('click', () => this.close());

        const confirmBtn = this.element.querySelector('.modal-confirm');
        confirmBtn.addEventListener('click', async () => {
            if (onConfirm) {
                // Loading state
                confirmBtn.disabled = true;
                confirmBtn.querySelector('.btn-text').textContent = 'Processing...';
                confirmBtn.querySelector('.fa-spinner').classList.remove('hidden');

                try {
                    await onConfirm();
                    this.close();
                } catch (error) {
                    console.error(error);
                    confirmBtn.disabled = false;
                    confirmBtn.querySelector('.btn-text').textContent = confirmText;
                    confirmBtn.querySelector('.fa-spinner').classList.add('hidden');
                }
            } else {
                this.close();
            }
        });

        // Close on backdrop click
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });
    }

    close() {
        if (!this.element) return;

        this.element.classList.remove('active');
        this.element.querySelector('.modal-container').classList.remove('active');

        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.element = null;
        }, 300);
    }
}

export const modal = new Modal();
