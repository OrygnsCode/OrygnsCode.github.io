import { store } from '../store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';

export class MessagesView {
    constructor(params) {
        this.container = document.getElementById('page-view');
        this.params = params;
    }

    render() {
        const messageId = this.params && this.params.id;

        if (messageId) {
            this.renderThread(messageId);
        } else {
            this.renderInbox();
        }
    }

    renderInbox() {
        const messages = store.getState().messages;

        this.container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Messages</h2>
                <button class="btn btn-primary" id="compose-btn">
                    <i class="fa-solid fa-pen-to-square"></i> Compose
                </button>
            </div>

            <div class="card p-0 overflow-hidden">
                <div class="divide-y divide-border">
                    ${messages.length > 0 ? messages.map(msg => `
                        <div class="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center gap-4 ${!msg.read ? 'bg-primary-bg/10' : ''}"
                             onclick="window.location.hash='#/messages/${msg.id}'">
                            <div class="avatar ${!msg.read ? 'border-primary' : ''}">
                                ${msg.thread && msg.thread.length > 0 ? msg.thread[0].avatar : 'U'}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-baseline mb-1">
                                    <h4 class="font-semibold truncate ${!msg.read ? 'text-white' : 'text-secondary'}">${msg.subject}</h4>
                                    <span class="text-xs text-muted whitespace-nowrap ml-2">${this.formatDate(msg.date)}</span>
                                </div>
                                <p class="text-sm text-muted truncate">${msg.lastMessage}</p>
                            </div>
                            ${!msg.read ? '<div class="w-2 h-2 rounded-full bg-primary"></div>' : ''}
                        </div>
                    `).join('') : '<div class="p-8 text-center text-muted">No messages found</div>'}
                </div>
            </div>
        `;

        document.getElementById('compose-btn').addEventListener('click', () => this.showComposeModal());
    }

    renderThread(id) {
        const message = store.getState().messages.find(m => m.id === id);
        if (!message) {
            this.container.innerHTML = '<div class="text-center mt-8">Message not found</div>';
            return;
        }

        // Mark as read if needed
        if (!message.read) {
            store.markMessageRead(id);
        }

        this.container.innerHTML = `
            <div class="h-[calc(100vh-140px)] flex flex-col">
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <a href="#/messages" class="btn btn-secondary btn-icon flex items-center justify-center">
                            <i class="fa-solid fa-arrow-left"></i>
                        </a>
                        <div>
                            <h2 class="text-xl font-bold">${message.subject}</h2>
                            <div class="text-sm text-muted">
                                ${message.participants.join(', ')}
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-secondary btn-icon flex items-center justify-center" title="Archive"><i class="fa-solid fa-box-archive"></i></button>
                        <button class="btn btn-danger btn-icon flex items-center justify-center" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-6" id="message-thread">
                    ${message.thread.map(msg => `
                        <div class="flex gap-4 ${msg.isMe ? 'flex-row-reverse' : ''}">
                            <div class="avatar avatar-sm flex-shrink-0">${msg.avatar}</div>
                            <div class="max-w-[70%]">
                                <div class="flex items-baseline gap-2 mb-1 ${msg.isMe ? 'justify-end' : ''}">
                                    <span class="text-sm font-medium text-secondary">${msg.sender}</span>
                                    <span class="text-xs text-muted">${this.formatTime(msg.time)}</span>
                                </div>
                                <div class="p-3 rounded-lg ${msg.isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-card border border-border rounded-tl-none'}">
                                    <p class="text-sm leading-relaxed">${msg.text}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="mt-4 pt-4 border-t border-border">
                    <div class="bg-card border border-border rounded-xl p-2 flex items-end gap-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <div class="flex gap-1 pb-2 pl-2">
                            <button class="text-muted hover:text-primary p-2 rounded-full hover:bg-white/5 transition-colors"><i class="fa-solid fa-paperclip"></i></button>
                            <button class="text-muted hover:text-primary p-2 rounded-full hover:bg-white/5 transition-colors"><i class="fa-regular fa-face-smile"></i></button>
                        </div>
                        <textarea id="reply-input" class="bg-transparent border-none text-white w-full resize-none py-2 px-2 focus:outline-none max-h-32" rows="1" placeholder="Type your reply..."></textarea>
                        <button class="btn btn-primary rounded-lg px-4 py-2 mb-0.5" id="send-reply">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Scroll to bottom
        const threadContainer = document.getElementById('message-thread');
        if (threadContainer) {
            threadContainer.scrollTop = threadContainer.scrollHeight;
        }

        document.getElementById('send-reply').addEventListener('click', () => {
            const input = document.getElementById('reply-input');
            const text = input.value.trim();
            if (text) {
                store.replyToMessage(id, text);
                this.renderThread(id); // Re-render to show new message
            }
        });
    }

    showComposeModal() {
        modal.show({
            title: 'New Message',
            confirmText: 'Send Message',
            content: `
                <div class="space-y-4">
                    <div>
                        <label class="form-label">Recipient</label>
                        <select class="form-control">
                            <option>Support Team</option>
                            <option>Billing Department</option>
                            <option>Project Manager</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Subject</label>
                        <input type="text" id="new-subject" class="form-control" placeholder="Enter subject...">
                    </div>
                    <div>
                        <label class="form-label">Message</label>
                        <textarea id="new-message" class="form-control" rows="5" placeholder="Type your message..."></textarea>
                    </div>
                </div>
            `,
            onConfirm: () => {
                return new Promise((resolve) => {
                    const subject = document.getElementById('new-subject').value;
                    const message = document.getElementById('new-message').value;

                    if (!subject || !message) {
                        toast.show('Please fill in all fields', 'error');
                        resolve();
                        return;
                    }

                    setTimeout(() => {
                        store.addMessage({
                            subject,
                            lastMessage: message,
                            participants: ['Support', 'Me']
                        });
                        this.renderInbox();
                        toast.show('Message sent successfully');
                        resolve();
                    }, 1000);
                });
            }
        });
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    formatTime(isoString) {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
