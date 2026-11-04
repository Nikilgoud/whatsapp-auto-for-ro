'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Invoice } from '@/types';
import { formatIndianCurrency, formatAmountInWords, formatDateDDMMYYYY } from '@/lib/utils';
import {
  X,
  Printer,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  QrCode,
  Droplets,
  Share2,
  Globe,
} from 'lucide-react';

interface SalesTaxInvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const SalesTaxInvoicePrintModal: React.FC<SalesTaxInvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { business, customers } = useApp();

  if (!isOpen || !invoice) return null;

  const customer = customers.find((c) => c.id === invoice.customerId);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!customer) return;
    const msg = `🧾 *TAX INVOICE / RECEIPT - ${business.name.toUpperCase()}*\n\nDear *${customer.fullName}*,\nPlease find your machine purchase invoice details below:\n\n📄 *Invoice No:* ${invoice.invoiceNumber}\n📅 *Date:* ${formatDateDDMMYYYY(invoice.invoiceDate)}\n💰 *Total Amount:* ₹${invoice.total.toLocaleString('en-IN')}\n💳 *Paid:* ₹${invoice.amountPaid.toLocaleString('en-IN')}${invoice.balanceDue > 0 ? `\n⏳ *Balance Due:* ₹${invoice.balanceDue.toLocaleString('en-IN')}` : ' (Full Paid)'}\n\nThank you for choosing ${business.name} for your home water purification needs! 🚰`;
    const cleanPhone = customer.mobileNumber.replace(/\D/g, '');
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Indian GST breakdown
  const halfGstRate = (invoice.gstRate || 0) / 2;
  const halfGstAmount = (invoice.gstAmount || 0) / 2;

  // Generate UPI payment string & active QR image
  const cleanPhone = (business.phone || '').replace(/\D/g, '').slice(-10) || '9849012345';
  const upiId = business.whatsappNumber
    ? `${business.whatsappNumber.replace(/\D/g, '').slice(-10)}@upi`
    : `${cleanPhone}@upi`;
  const invoiceBalance = invoice.balanceDue > 0 ? invoice.balanceDue : invoice.total;
  const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(business.name)}&am=${invoiceBalance}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayLink)}`;
  const activeQrImage = business.paymentQrCodeUrl || dynamicQrUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:m-0 print:overflow-visible">
        {/* Modal Controls (Fixed Top Toolbar, Hidden in Print) */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 print:hidden z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tax Invoice Document Preview
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 print:text-black print:overflow-visible print:p-4 print:space-y-4 scrollbar-thin">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-blue-700 print:text-black">
                    {business.name}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">{business.tagline || 'Sales, Spares & Certified Water Services'}</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-700 space-y-0.5 pt-2">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{business.address}, {business.city}, {business.state} - {business.pincode}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Phone: +91 {business.phone} | WhatsApp: +91 {business.whatsappNumber || business.phone}</span>
                </p>
                {business.website && (
                  <p className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Website: {business.website}</span>
                  </p>
                )}
                {business.settings.gstin && (
                  <p className="font-semibold text-slate-800 dark:text-slate-200 print:text-black pt-1">
                    GSTIN: <span className="font-mono text-blue-700 print:text-black">{business.settings.gstin}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-md mb-2">
                TAX INVOICE
              </span>
              <table className="text-xs text-right ml-auto">
                <tbody>
                  <tr>
                    <td className="text-slate-500 font-medium pr-3 py-0.5">Invoice No:</td>
                    <td className="font-mono font-bold text-slate-900 dark:text-white print:text-black">{invoice.invoiceNumber}</td>
                  </tr>
                  {(invoice.customerCode || customer?.customerCode) && (
                    <tr>
                      <td className="text-slate-500 font-medium pr-3 py-0.5">Customer ID:</td>
                      <td className="font-mono font-bold text-blue-700 dark:text-blue-400 print:text-black">
                        {invoice.customerCode || customer?.customerCode}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-slate-500 font-medium pr-3 py-0.5">Invoice Date:</td>
                    <td className="font-medium text-slate-800 dark:text-slate-200 print:text-black">{formatDateDDMMYYYY(invoice.invoiceDate)}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 font-medium pr-3 py-0.5">Place of Supply:</td>
                    <td className="font-medium text-slate-800 dark:text-slate-200 print:text-black">{business.state || 'Telangana (36)'}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 font-medium pr-3 py-0.5">Payment Mode:</td>
                    <td className="font-semibold text-emerald-600 print:text-black">{invoice.paymentMethod || 'UPI / Cash'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill-To & Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To (Customer Details)
              </span>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-sm text-slate-900 dark:text-white print:text-black">
                  {customer?.fullName || 'Valued Customer'}
                </p>
                {(invoice.customerCode || customer?.customerCode) && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 print:border-black">
                    Cust ID: {invoice.customerCode || customer?.customerCode}
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300 print:text-slate-700 mt-0.5">
                {customer?.streetAddress ? `${customer.streetAddress}, ${customer.areaLocality}` : customer?.areaLocality || 'Delivery Address'}
              </p>
              <p className="text-slate-600 dark:text-slate-300 print:text-slate-700">
                Phone: +91 {customer?.mobileNumber}
              </p>
              {customer?.email && (
                <p className="text-slate-500">Email: {customer.email}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Appliance & Delivery Tracking
              </span>
              <table className="w-full text-slate-700 dark:text-slate-300 print:text-slate-700 space-y-0.5">
                <tbody>
                  {invoice.machineSerialNo && (
                    <tr>
                      <td className="text-slate-400 py-0.5">Machine Serial No:</td>
                      <td className="font-mono font-semibold text-right text-slate-900 dark:text-white print:text-black">
                        {invoice.machineSerialNo}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-slate-400 py-0.5">Delivery Status:</td>
                    <td className="font-semibold text-right text-blue-600 print:text-black">
                      {invoice.deliveryStatus || 'Delivered'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-slate-400 py-0.5">Standard Warranty:</td>
                    <td className="font-semibold text-right text-emerald-600 print:text-black">
                      12 Months (Comprehensive)
                    </td>
                  </tr>
                  <tr>
                    <td className="text-slate-400 py-0.5">Free Periodic Services:</td>
                    <td className="font-semibold text-right text-slate-900 dark:text-white print:text-black">
                      3 Included Visits
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 font-bold">#</th>
                  <th className="py-2.5 px-3 font-bold">Item Description & Specifications</th>
                  <th className="py-2.5 px-3 font-bold text-center">HSN/SAC</th>
                  <th className="py-2.5 px-3 font-bold text-center">Qty</th>
                  <th className="py-2.5 px-3 font-bold text-right">Unit Price</th>
                  <th className="py-2.5 px-3 font-bold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white print:text-black">
                      {item.description}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {idx === 0 ? '84212190' : '84219900'}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300 print:text-slate-800">
                      ₹{item.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white print:text-black">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="w-full sm:w-1/2 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount Chargeable (in words):
                </span>
                <p className="font-medium text-slate-900 dark:text-white print:text-black italic">
                  INR {formatAmountInWords(invoice.total)} Only
                </p>
              </div>

              {/* UPI QR Payment Block */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center p-1 shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                  <img
                    src={activeQrImage}
                    alt="UPI Payment QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] leading-tight space-y-0.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Scan & Pay via any UPI App
                  </span>
                  <p className="text-slate-500 font-mono text-[10px]">UPI ID: {upiId}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">GPay • PhonePe • Paytm • BHIM</p>
                  <span className="inline-block text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded font-bold">
                    {business.paymentQrCodeUrl ? 'Custom Business QR' : 'Instant UPI Payment'}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-5/12 space-y-1.5 text-xs text-right">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-white print:text-black">
                  ₹{invoice.subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600">
                  <span>Special Dealer Discount:</span>
                  <span className="font-semibold">- ₹{invoice.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {invoice.gstRate > 0 && (
                <>
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>CGST ({halfGstRate}%):</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      ₹{halfGstAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>SGST ({halfGstRate}%):</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      ₹{halfGstAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between py-2 border-t-2 border-slate-800 dark:border-slate-200 text-sm font-extrabold text-slate-900 dark:text-white print:text-black">
                <span>Grand Total (INR):</span>
                <span>₹{invoice.total.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between py-1 text-xs font-semibold text-emerald-600">
                <span>Amount Paid:</span>
                <span>₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
              </div>

              {invoice.balanceDue > 0 ? (
                <div className="flex justify-between py-1 text-xs font-bold text-rose-600">
                  <span>Balance Due:</span>
                  <span>₹{invoice.balanceDue.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 rounded-md">
                  <span>Status:</span>
                  <span>FULL PAYMENT RECEIVED</span>
                </div>
              )}
            </div>
          </div>

          {/* Warranty Terms & Authorized Signatory */}
          <div className="pt-4 border-t border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-1 text-slate-500 text-[11px] leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Official Warranty Terms & Conditions:
              </span>
              <p>1. 1-Year Comprehensive Warranty covers SMPS, booster pump, and RO membrane against manufacturing defects.</p>
              <p>2. Quote Customer ID <strong className="font-mono text-slate-800 dark:text-slate-200">{invoice.customerCode || customer?.customerCode}</strong> for prompt on-site warranty claims and 3 free periodic visits.</p>
              <p>3. Physical breakage, high-voltage burning without stabilizer, or external tampering voids the warranty.</p>
              <p>4. Doorstep support helpline: <strong>{business.phone}</strong> (WhatsApp enabled).</p>
            </div>

            <div className="text-right space-y-3 pt-4 sm:pt-0">
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                For {business.name.toUpperCase()}
              </div>
              <div className="w-44 ml-auto flex flex-col items-end justify-end">
                {business.signatureUrl ? (
                  <div className="h-12 w-full flex items-end justify-end">
                    <img
                      src={business.signatureUrl}
                      alt="Authorized Signature"
                      className="max-h-12 max-w-[150px] object-contain mb-1"
                    />
                  </div>
                ) : (
                  <div className="h-8 w-full"></div>
                )}
                <div className="border-t border-slate-400 w-full pt-1 text-[10px] text-slate-500 text-right">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Hidden on Print) */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 print:hidden text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">
            Viewing full tax invoice • Scroll vertically to inspect all details
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
