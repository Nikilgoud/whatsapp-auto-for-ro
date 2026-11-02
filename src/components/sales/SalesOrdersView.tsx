'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Invoice, Customer } from '@/types';
import { formatDateDDMMYYYY } from '@/lib/utils';
import {
  Search,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  DollarSign,
  User,
  Phone,
  Droplets,
  Receipt,
  FileText,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface SalesOrdersViewProps {
  onPrintInvoice: (invoice: Invoice) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateInvoice: () => void;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  onPrintInvoice,
  onSelectCustomer,
  onOpenCreateInvoice,
}) => {
  const { invoices, customers, purifiers, technicians, business } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Partially paid' | 'Pending'>('All');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('All');

  // Filter for sales invoices (either invoiceType === 'SALES' or invoices with machine items or invoiceNumber containing SLS)
  const salesInvoices = invoices.filter((inv) => {
    return (
      inv.invoiceType === 'SALES' ||
      inv.invoiceNumber.includes('SLS') ||
      inv.items.some((item) =>
        item.description.toLowerCase().includes('purifier') ||
        item.description.toLowerCase().includes('kent') ||
        item.description.toLowerCase().includes('aquaguard') ||
        item.description.toLowerCase().includes('machine')
      )
    );
  });

  const filteredOrders = salesInvoices.filter((inv) => {
    const customer = customers.find((c) => c.id === inv.customerId);
    const matchesPayment = paymentFilter === 'All' || inv.paymentStatus === paymentFilter;
    const matchesDelivery =
      deliveryFilter === 'All' || (inv.deliveryStatus || 'Delivered') === deliveryFilter;

    if (!matchesPayment || !matchesDelivery) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const customerMatch =
        customer?.fullName.toLowerCase().includes(q) ||
        customer?.mobileNumber.includes(q) ||
        customer?.areaLocality.toLowerCase().includes(q);
      const invoiceMatch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.machineSerialNo || '').toLowerCase().includes(q) ||
        inv.items.some((item) => item.description.toLowerCase().includes(q));

      return customerMatch || invoiceMatch;
    }
    return true;
  });

  // Calculate Metrics
  const totalSalesRevenue = salesInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalCollected = salesInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalPendingBalance = salesInvoices.reduce((sum, i) => sum + i.balanceDue, 0);
  const pendingDeliveriesCount = salesInvoices.filter(
    (i) => i.deliveryStatus === 'Pending Installation' || i.deliveryStatus === 'Shipped'
  ).length;

  const handleShareWhatsApp = (inv: Invoice) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    if (!cust) return;
    const msg = `🧾 *TAX INVOICE & RECEIPT - ${business.name.toUpperCase()}*\n\nDear *${cust.fullName}*,\nThank you for purchasing your RO Water Purifier from us!\n\n📋 *Invoice No:* ${inv.invoiceNumber}\n📅 *Date:* ${formatDateDDMMYYYY(inv.invoiceDate)}\n💰 *Total:* ₹${inv.total.toLocaleString('en-IN')}\n💳 *Paid:* ₹${inv.amountPaid.toLocaleString('en-IN')}${inv.balanceDue > 0 ? `\n⏳ *Balance Due:* ₹${inv.balanceDue.toLocaleString('en-IN')}` : ' (Full Paid)'}\n🔧 *Installation Status:* ${inv.deliveryStatus || 'Delivered'}\n\nOur team is available anytime at +91 ${business.phone} for your water care needs! 🚰`;

    const cleanPhone = cust.mobileNumber.replace(/\D/g, '');
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Total Machine Sales</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ₹{totalSalesRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-blue-600 font-semibold">{salesInvoices.length} Machines Invoiced</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Payment Collected</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Cash & UPI Received</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Balance Due</span>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            ₹{totalPendingBalance.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-rose-500 font-semibold">To collect on delivery</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Pending Installations</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {pendingDeliveriesCount}
          </p>
          <span className="text-[10px] text-amber-500 font-semibold">Scheduled / En-route</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, invoice #, serial number, machine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="All">All Payments</option>
            <option value="Paid">Paid in Full</option>
            <option value="Partially paid">Partially Paid</option>
            <option value="Pending">Payment Pending</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hidden md:block"
          >
            <option value="All">All Delivery Statuses</option>
            <option value="Pending Installation">Pending Installation</option>
            <option value="Delivered">Delivered</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button
          onClick={onOpenCreateInvoice}
          className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <Receipt className="w-4 h-4" />
          <span>+ Create Sales Invoice</span>
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No sales orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create your first sales order using the button above to generate a GST tax invoice and schedule delivery.
          </p>
          <button
            onClick={onOpenCreateInvoice}
            className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            + Create Sales Invoice
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice & Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Machine & Items</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                  <th className="py-3 px-4 text-right">Paid / Balance</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">Delivery Tracking</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((inv) => {
                  const customer = customers.find((c) => c.id === inv.customerId);
                  const technician = technicians.find((t) => t.id === inv.technicianId);

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Invoice & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDateDDMMYYYY(inv.invoiceDate)}</span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        {customer ? (
                          <div>
                            <button
                              onClick={() => onSelectCustomer && onSelectCustomer(customer)}
                              className="font-bold text-blue-600 hover:underline text-left block"
                            >
                              {customer.fullName}
                            </button>
                            <span className="text-[11px] text-slate-500">
                              +91 {customer.mobileNumber} • {customer.areaLocality}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Customer record deleted</span>
                        )}
                      </td>

                      {/* Machine Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {inv.items[0]?.description || 'RO Water Purifier System'}
                        </p>
                        {inv.machineSerialNo && (
                          <span className="text-[10px] font-mono text-slate-400 block">
                            S/N: {inv.machineSerialNo}
                          </span>
                        )}
                        {inv.items.length > 1 && (
                          <span className="text-[10px] text-blue-600 font-medium">
                            +{inv.items.length - 1} add-ons / accessories
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          ₹{inv.total.toLocaleString('en-IN')}
                        </span>
                        {inv.discount > 0 && (
                          <span className="text-[10px] text-emerald-600 block">
                            -₹{inv.discount.toLocaleString('en-IN')} disc
                          </span>
                        )}
                      </td>

                      {/* Paid / Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-emerald-600 block">
                          ₹{inv.amountPaid.toLocaleString('en-IN')}
                        </span>
                        {inv.balanceDue > 0 ? (
                          <span className="text-[10px] text-rose-600 font-bold block">
                            Bal: ₹{inv.balanceDue.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500">Nil Due</span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : inv.paymentStatus === 'Partially paid'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {inv.paymentMethod || 'UPI'}
                        </span>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            inv.deliveryStatus === 'Pending Installation'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                          }`}
                        >
                          {inv.deliveryStatus || 'Delivered'}
                        </span>
                        {technician && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Tech: {technician.name}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleShareWhatsApp(inv)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Share Invoice on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintInvoice(inv)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Print / View Tax Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
