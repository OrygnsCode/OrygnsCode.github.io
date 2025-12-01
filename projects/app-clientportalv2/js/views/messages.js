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
            <div class="flex justify-between items-center mb-6 animate-fade-in">
                <h2 class="text-2xl font-bold flex items-center gap-2">
                    <i class="fa-solid fa-satellite-dish text-accent"></i> Messages
                </h2>
                <button class="btn btn-primary shadow-glow" id="compose-btn">
                    <i class="fa-solid fa-pen-to-square"></i> Compose
                </button>
            </div>

            <div class="card p-0 overflow-hidden border-primary/20 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                <div class="divide-y divide-border/30">
                    ${messages.length > 0 ? messages.map(msg => `
                        <div class="p-4 hover:bg-primary/5 cursor-pointer transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${!msg.read ? 'bg-primary/5' : ''}"
                             onclick="window.location.hash='#/messages/${msg.id}'">
                            <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                            
                            <div class="avatar ${!msg.read ? 'border-primary shadow-[0_0_10px_var(--color-primary)]' : 'border-border'} transition-all group-hover:scale-110">
                                ${msg.thread && msg.thread.length > 0 ? msg.thread[0].avatar : 'U'}
                            </div>
                            <div class="flex-1 min-w-0 relative z-10">
                                <div class="flex justify-between items-baseline mb-1">
                                    <h4 class="font-semibold truncate ${!msg.read ? 'text-white' : 'text-secondary'} group-hover:text-primary transition-colors">${msg.subject}</h4>
                                    <span class="text-xs text-muted font-mono whitespace-nowrap ml-2">${this.formatDate(msg.date)}</span>
                                </div>
                                <p class="text-sm text-muted truncate group-hover:text-text-main transition-colors">${msg.lastMessage}</p>
                            </div>
                            ${!msg.read ? '<div class="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_var(--color-primary)] animate-pulse"></div>' : ''}
                        </div>
                    `).join('') : '<div class="p-12 text-center text-muted font-mono">NO_TRANSMISSIONS_FOUND</div>'}
                </div>
            </div>
        `;

        document.getElementById('compose-btn').addEventListener('click', () => this.showComposeModal());
    }

    renderThread(id) {
        const message = store.getState().messages.find(m => m.id === id);
        if (!message) {
            this.container.innerHTML = '<div class="text-center mt-8 text-muted font-mono">TRANSMISSION_NOT_FOUND</div>';
            return;
        }

        // Mark as read if needed
        if (!message.read) {
            store.markMessageRead(id);
        }

        this.container.innerHTML = `
            <div class="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
                <div class="mb-4 flex items-center justify-between border-b border-border/50 pb-4">
                    <div class="flex items-center gap-3">
                        <a href="#/messages" class="btn btn-secondary btn-icon flex items-center justify-center hover:text-primary transition-colors">
                            <i class="fa-solid fa-arrow-left"></i>
                        </a>
                        <div>
                            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-hashtag text-primary text-sm"></i> ${message.subject}
                            </h2>
                            <div class="text-xs text-muted font-mono">
                                PARTICIPANTS: [${message.participants.join(', ')}]
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-secondary btn-icon flex items-center justify-center hover:text-warning transition-colors" title="Archive"><i class="fa-solid fa-box-archive"></i></button>
                        <button class="btn btn-danger btn-icon flex items-center justify-center hover:shadow-glow-red transition-all" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin" id="message-thread">
                    ${message.thread.map(msg => `
                        <div class="flex gap-4 ${msg.isMe ? 'flex-row-reverse' : ''} group">
                            <div class="avatar avatar-sm flex-shrink-0 border border-border group-hover:border-primary transition-colors">${msg.avatar}</div>
                            <div class="max-w-[70%]">
                                <div class="flex items-baseline gap-2 mb-1 ${msg.isMe ? 'justify-end' : ''}">
                                    <span class="text-xs font-mono text-secondary">${msg.sender}</span>
                                    <span class="text-[10px] text-muted font-mono">${this.formatTime(msg.time)}</span>
                                </div>
                                <div class="p-4 rounded-xl backdrop-blur-md shadow-lg transition-all hover:scale-[1.01] ${msg.isMe ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-none shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-card/80 border border-white/5 rounded-tl-none'}">
                                    <p class="text-sm leading-relaxed">${msg.text}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="mt-4 pt-4 border-t border-border/50">
                    <div class="bg-card/50 border border-primary/20 rounded-xl p-2 flex items-end gap-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all backdrop-blur-sm">
                        <div class="flex gap-1 pb-2 pl-2">
                            <button class="text-muted hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors"><i class="fa-solid fa-paperclip"></i></button>
                            <button class="text-muted hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-colors"><i class="fa-regular fa-face-smile"></i></button>
                        </div>
                        <textarea id="reply-input" class="bg-transparent border-none text-white w-full resize-none py-2 px-2 focus:outline-none max-h-32 font-mono text-sm" rows="1" placeholder="Enter transmission..."></textarea>
                        <button class="btn btn-primary rounded-lg px-4 py-2 mb-0.5 shadow-glow hover:scale-105 transition-transform" id="send-reply">
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
