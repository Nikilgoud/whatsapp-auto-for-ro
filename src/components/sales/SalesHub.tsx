'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PurifierProduct, Invoice, Customer } from '@/types';
import { ProductCatalogView } from './ProductCatalogView';
import { SalesOrdersView } from './SalesOrdersView';
import { AddEditProductModal } from './AddEditProductModal';
import { WhatsAppProductBrochureModal } from './WhatsAppProductBrochureModal';
import { CreateSalesInvoiceModal } from './CreateSalesInvoiceModal';
import { SalesTaxInvoicePrintModal } from './SalesTaxInvoicePrintModal';
import {
  ShoppingCart,
  Package,
  Receipt,
  Plus,
  Share2,
  Droplets,
  Building2,
  Sparkles,
} from 'lucide-react';

interface SalesHubProps {
  onSelectCustomer?: (customer: Customer) => void;
}

export const SalesHub: React.FC<SalesHubProps> = ({ onSelectCustomer }) => {
  const { purifierProducts, invoices, business } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'orders'>('catalog');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<PurifierProduct | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [productToShare, setProductToShare] = useState<PurifierProduct | null>(null);

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [preselectedProductForSale, setPreselectedProductForSale] = useState<PurifierProduct | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);

  // Count sales invoices
  const salesInvoicesCount = invoices.filter(
    (inv) =>
      inv.invoiceType === 'SALES' ||
      inv.invoiceNumber.includes('SLS') ||
      inv.items.some((i) =>
        i.description.toLowerCase().includes('purifier') ||
        i.description.toLowerCase().includes('kent') ||
        i.description.toLowerCase().includes('machine')
      )
  ).length;

  const handleEditProduct = (product: PurifierProduct) => {
    setProductToEdit(product);
    setIsAddEditOpen(true);
  };

  const handleSellProduct = (product: PurifierProduct) => {
    setPreselectedProductForSale(product);
    setIsCreateInvoiceOpen(true);
  };

  const handleShareProduct = (product: PurifierProduct) => {
    setProductToShare(product);
    setIsShareModalOpen(true);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setInvoiceToPrint(invoice);
    setIsPrintModalOpen(true);
  };

  const handleInvoiceCreated = (invoiceId: string) => {
    const created = invoices.find((i) => i.id === invoiceId);
    if (created) {
      setInvoiceToPrint(created);
      setIsPrintModalOpen(true);
    }
    setActiveSubTab('orders');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>RO Purifiers & Appliances Sales Hub</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Live
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Showcase machine catalog, share WhatsApp brochures & generate GST sales invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsAddEditOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Inward Machine</span>
          </button>

          <button
            onClick={() => {
              setPreselectedProductForSale(null);
              setIsCreateInvoiceOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>Sell Machine / New Bill</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors relative ${
            activeSubTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog & Showcase</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSubTab === 'catalog'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {purifierProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors relative ${
            activeSubTab === 'orders'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Sales Orders & Invoices</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSubTab === 'orders'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {salesInvoicesCount}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'catalog' ? (
        <ProductCatalogView
          onOpenAddProduct={() => {
            setProductToEdit(null);
            setIsAddEditOpen(true);
          }}
          onEditProduct={handleEditProduct}
          onSellProduct={handleSellProduct}
          onShareWhatsApp={handleShareProduct}
        />
      ) : (
        <SalesOrdersView
          onPrintInvoice={handlePrintInvoice}
          onSelectCustomer={onSelectCustomer}
          onOpenCreateInvoice={() => {
            setPreselectedProductForSale(null);
            setIsCreateInvoiceOpen(true);
          }}
        />
      )}

      {/* Modals */}
      {isAddEditOpen && (
        <AddEditProductModal
          isOpen={isAddEditOpen}
          onClose={() => setIsAddEditOpen(false)}
          productToEdit={productToEdit}
        />
      )}

      {isShareModalOpen && (
        <WhatsAppProductBrochureModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          product={productToShare}
        />
      )}

      {isCreateInvoiceOpen && (
        <CreateSalesInvoiceModal
          isOpen={isCreateInvoiceOpen}
          onClose={() => setIsCreateInvoiceOpen(false)}
          preselectedProduct={preselectedProductForSale}
          onSuccess={handleInvoiceCreated}
        />
      )}

      {isPrintModalOpen && (
        <SalesTaxInvoicePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          invoice={invoiceToPrint}
        />
      )}
    </div>
  );
};
