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
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Billing & Invoices</h2>
                <button class="btn btn-secondary">
                    <i class="fa-solid fa-download"></i> Download Report
                </button>
            </div>

            <div class="grid grid-cols-3 gap-6 mb-8">
                <div class="card bg-primary-bg border-primary/20">
                    <div class="text-sm text-primary mb-1 font-medium">Total Due</div>
                    <div class="text-3xl font-bold text-white">$${totalDue.toLocaleString()}</div>
                    <div class="text-xs text-primary/70 mt-1">Across ${invoices.filter(i => i.status !== 'Paid').length} invoices</div>
                </div>
                <div class="card">
                    <div class="text-sm text-muted mb-1 font-medium">Last Payment</div>
                    <div class="text-3xl font-bold">$1,250.00</div>
                    <div class="text-xs text-muted mt-1">Oct 28, 2025</div>
                </div>
                <div class="card">
                    <div class="text-sm text-muted mb-1 font-medium">Payment Method</div>
                    <div class="flex items-center gap-2 mt-1">
                        <i class="fa-brands fa-cc-visa text-2xl text-white"></i>
                        <span class="font-mono text-lg">•••• 4242</span>
                    </div>
                    <div class="text-xs text-muted mt-1">Expires 12/28</div>
                </div>
            </div>

            <div class="card">
                <h3 class="card-title mb-4">Outstanding Invoices</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-border text-xs text-muted uppercase">
                                <th class="py-3 font-medium">Invoice ID</th>
                                <th class="py-3 font-medium">Client</th>
                                <th class="py-3 font-medium">Due Date</th>
                                <th class="py-3 font-medium">Amount</th>
                                <th class="py-3 font-medium">Status</th>
                                <th class="py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                            ${this.renderInvoiceRows(invoices.filter(i => i.status !== 'Paid'))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card mt-6">
                <h3 class="card-title mb-4">Payment History</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-border text-xs text-muted uppercase">
                                <th class="py-3 font-medium">Invoice ID</th>
                                <th class="py-3 font-medium">Date Paid</th>
                                <th class="py-3 font-medium">Amount</th>
                                <th class="py-3 font-medium">Status</th>
                                <th class="py-3 font-medium text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
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
            return '<tr><td colspan="6" class="py-4 text-center text-muted">No outstanding invoices</td></tr>';
        }
        return invoices.map(inv => `
            <tr class="group hover:bg-white/5 transition-colors">
                <td class="py-3 font-medium text-white">${inv.id}</td>
                <td class="py-3 text-secondary">${inv.client}</td>
                <td class="py-3 text-muted">${new Date(inv.dueDate).toLocaleDateString()}</td>
                <td class="py-3 font-medium">$${inv.amount.toLocaleString()}</td>
                <td class="py-3"><span class="badge ${inv.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}">${inv.status}</span></td>
                <td class="py-3 text-right">
                    <button class="btn btn-primary btn-sm pay-btn" data-id="${inv.id}" data-amount="${inv.amount}">Pay Now</button>
                </td>
            </tr>
        `).join('');
    }

    renderHistoryRows(invoices) {
        return invoices.map(inv => `
            <tr class="group hover:bg-white/5 transition-colors">
                <td class="py-3 font-medium text-white">${inv.id}</td>
                <td class="py-3 text-muted">${new Date(inv.paidDate || inv.date).toLocaleDateString()}</td>
                <td class="py-3 text-secondary">$${inv.amount.toLocaleString()}</td>
                <td class="py-3"><span class="badge badge-success">Paid</span></td>
                <td class="py-3 text-right">
                    <button class="text-muted hover:text-primary"><i class="fa-solid fa-download"></i> PDF</button>
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
