import { store } from '../store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';

export class BillingView {
    constructor() {
        this.container = document.getElementById('page-view');
    }

    render() {
        const invoices = store.getState().invoices;
        const totalDue = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue')
            .reduce((acc, i) => acc + i.amount, 0);

        this.container.innerHTML = `
            <div class="flex justify-between items-center mb-8 animate-fade-in">
                <h2 class="text-2xl font-bold flex items-center gap-2">
                    <i class="fa-solid fa-file-invoice-dollar text-accent"></i> Financial_Command
                </h2>
                <button class="btn btn-secondary hover:text-primary hover:border-primary transition-colors">
                    <i class="fa-solid fa-download"></i> Export_Report
                </button>
            </div>

            <div class="grid grid-cols-3 gap-6 mb-8">
                <div class="card bg-primary/5 border-primary/30 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i class="fa-solid fa-coins text-6xl text-primary"></i>
                    </div>
                    <div class="text-xs text-primary font-mono mb-1 uppercase tracking-wider">Total Outstanding</div>
                    <div class="text-4xl font-bold text-white mb-2" style="text-shadow: 0 0 15px rgba(6,182,212,0.5);">$${totalDue.toLocaleString()}</div>
                    <div class="text-xs text-primary/70 mt-1 font-mono flex items-center gap-2">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <span>${invoices.filter(i => i.status !== 'Paid').length} PENDING_TRANSACTIONS</span>
                    </div>
                </div>
                
                <div class="card relative overflow-hidden group">
                    <div class="text-xs text-muted font-mono mb-1 uppercase tracking-wider">Last Transaction</div>
                    <div class="text-3xl font-bold text-white mb-2">$1,250.00</div>
                    <div class="text-xs text-muted mt-1 font-mono">DATE: 2025-10-28</div>
                    <div class="absolute bottom-0 left-0 w-full h-1 bg-success/20">
                        <div class="h-full bg-success w-full shadow-[0_0_10px_var(--color-success)]"></div>
                    </div>
                </div>
                
                <div class="card relative overflow-hidden group">
                    <div class="text-xs text-muted font-mono mb-1 uppercase tracking-wider">Payment Method</div>
                    <div class="flex items-center gap-3 mt-2">
                        <i class="fa-brands fa-cc-visa text-3xl text-white/80"></i>
                        <div class="font-mono text-lg text-white tracking-widest">•••• 4242</div>
                    </div>
                    <div class="text-xs text-success mt-2 font-mono flex items-center gap-1">
                        <i class="fa-solid fa-shield-halved"></i> SECURE_LINK_ACTIVE
                    </div>
                </div>
            </div>

            <div class="card overflow-hidden border-primary/20 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="card-title flex items-center gap-2">
                        <i class="fa-solid fa-list-ul text-warning"></i> Outstanding_Invoices
                    </h3>
                    <div class="flex gap-2">
                        <div class="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
                        <div class="w-2 h-2 rounded-full bg-warning animate-pulse" style="animation-delay: 0.2s"></div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-border/50 text-xs text-muted font-mono uppercase tracking-wider">
                                <th class="py-4 px-4 font-medium">ID_REF</th>
                                <th class="py-4 px-4 font-medium">Client_Entity</th>
                                <th class="py-4 px-4 font-medium">Due_Date</th>
                                <th class="py-4 px-4 font-medium">Amount</th>
                                <th class="py-4 px-4 font-medium">Status</th>
                                <th class="py-4 px-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border/30 font-mono text-sm">
                            ${this.renderInvoiceRows(invoices.filter(i => i.status !== 'Paid'))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card mt-8 opacity-80 hover:opacity-100 transition-opacity">
                <h3 class="card-title mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left text-muted"></i> Transaction_History
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-border/50 text-xs text-muted font-mono uppercase tracking-wider">
                                <th class="py-3 px-4 font-medium">ID_REF</th>
                                <th class="py-3 px-4 font-medium">Date_Paid</th>
                                <th class="py-3 px-4 font-medium">Amount</th>
                                <th class="py-3 px-4 font-medium">Status</th>
                                <th class="py-3 px-4 font-medium text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border/30 font-mono text-sm">
                            ${this.renderHistoryRows(invoices.filter(i => i.status === 'Paid'))}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    renderInvoiceRows(invoices) {
        if (invoices.length === 0) {
            return '<tr><td colspan="6" class="py-8 text-center text-muted font-mono">NO_OUTSTANDING_INVOICES</td></tr>';
        }
        return invoices.map(inv => `
            <tr class="group hover:bg-white/5 transition-colors">
                <td class="py-4 px-4 font-medium text-primary">#${inv.id}</td>
                <td class="py-4 px-4 text-white">${inv.client}</td>
                <td class="py-4 px-4 text-muted">${new Date(inv.dueDate).toLocaleDateString()}</td>
                <td class="py-4 px-4 font-bold text-white">$${inv.amount.toLocaleString()}</td>
                <td class="py-4 px-4"><span class="badge ${inv.status === 'Overdue' ? 'badge-danger shadow-[0_0_10px_var(--color-danger)]' : 'badge-warning shadow-[0_0_10px_var(--color-warning)]'}">${inv.status}</span></td>
                <td class="py-4 px-4 text-right">
                    <button class="btn btn-primary btn-sm pay-btn shadow-glow hover:scale-105 transition-transform" data-id="${inv.id}" data-amount="${inv.amount}">
                        <i class="fa-regular fa-credit-card mr-1"></i> Pay Now
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderHistoryRows(invoices) {
        return invoices.map(inv => `
            <tr class="group hover:bg-white/5 transition-colors">
                <td class="py-3 px-4 font-medium text-muted">#${inv.id}</td>
                <td class="py-3 px-4 text-muted">${new Date(inv.paidDate || inv.date).toLocaleDateString()}</td>
                <td class="py-3 px-4 text-secondary">$${inv.amount.toLocaleString()}</td>
                <td class="py-3 px-4"><span class="badge badge-success bg-success/10 text-success border border-success/20">PAID</span></td>
                <td class="py-3 px-4 text-right">
                    <button class="text-muted hover:text-primary transition-colors"><i class="fa-solid fa-download"></i> PDF</button>
                </td>
            </tr>
        `).join('');
    }

    bindEvents() {
        this.container.querySelectorAll('.pay-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const amount = btn.dataset.amount;

                modal.show({
                    title: `Pay Invoice ${id}`,
                    confirmText: 'Pay Now',
                    content: `
                        <div class="space-y-4">
                            <div class="p-4 bg-body rounded-lg border border-border">
                                <div class="flex justify-between mb-2">
                                    <span class="text-muted">Amount Due</span>
                                    <span class="font-bold text-xl">$${parseInt(amount).toLocaleString()}</span>
                                </div>
                                <div class="text-xs text-muted">Invoice ${id}</div>
                            </div>
                            
                            <div>
                                <label class="form-label">Card Number</label>
                                <div class="relative">
                                    <i class="fa-regular fa-credit-card absolute left-3 top-3 text-muted"></i>
                                    <input type="text" class="form-control pl-10" value="4242 4242 4242 4242" readonly>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="form-label">Expiry</label>
                                    <input type="text" class="form-control" value="12/28" readonly>
                                </div>
                                <div>
                                    <label class="form-label">CVC</label>
                                    <input type="text" class="form-control" value="123" readonly>
                                </div>
                            </div>
                        </div>
                    `,
                    onConfirm: () => {
                        return new Promise((resolve) => {
                            // Simulate API call
                            setTimeout(() => {
                                store.payInvoice(id);
                                this.render();
                                toast.show(`Invoice ${id} paid successfully!`);
                                resolve();
                            }, 1500);
                        });
                    }
                });
            });
        });
    }
}
