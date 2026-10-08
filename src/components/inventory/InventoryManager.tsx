'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { InventoryItem } from '@/types';
import { formatIndianCurrency } from '@/lib/utils';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  CheckCircle2,
  TrendingDown,
  ArrowUpRight,
  Filter,
  X,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryStock, business } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Item State
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Filter');
  const [brand, setBrand] = useState('Aquapure');
  const [supplier, setSupplier] = useState('Shree Balaji Spares (Secunderabad)');
  const [purchasePrice, setPurchasePrice] = useState(100);
  const [sellingPrice, setSellingPrice] = useState(250);
  const [currentStock, setCurrentStock] = useState(20);
  const [minimumStock, setMinimumStock] = useState(10);
  const [reorderLevel, setReorderLevel] = useState(15);
  const [unit, setUnit] = useState('Pieces');

  const filteredItems = inventory.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowStockItems = inventory.filter((i) => i.isLowStock);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !sku) return;

    addInventoryItem({
      businessId: business.id,
      sku,
      productName,
      category,
      brand,
      supplier,
      purchasePrice,
      sellingPrice,
      currentStock,
      minimumStock,
      reorderLevel,
      unit,
    });

    setIsAddModalOpen(false);
    setProductName('');
    setSku('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Spares & Consumables Inventory</span>
          </h2>
          <p className="text-xs text-slate-500">
            Auto-deducted when technicians complete filter or membrane replacements.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Spare Part</span>
        </button>
      </div>

      {/* LOW STOCK ALERT BANNER */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Stock Reorder Alert:</p>
              <p className="mt-0.5">
                The following critical consumables are below their reorder threshold:{' '}
                <strong>{lowStockItems.map((i) => i.productName).join(', ')}</strong>. Order from your local distributor to avoid technician service delays.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold rounded-lg shrink-0">
            {lowStockItems.length} Items Low
          </span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search spare name, SKU (e.g. FLT-SED-10), or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'Filter', 'Membrane', 'Pump', 'SMPS', 'UV Lamp', 'Cartridges'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Cost vs Selling Price</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Quick Stock Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      SKU: {item.sku} • {item.brand}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatIndianCurrency(item.sellingPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Cost: {formatIndianCurrency(item.purchasePrice)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {item.currentStock}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      {item.unit} (Reorder &lt; {item.reorderLevel})
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {item.isLowStock ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        In Stock
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[140px]">
                    {item.supplier}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => updateInventoryStock(item.id, -1)}
                        className="w-7 h-7 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 rounded-lg font-bold text-xs transition"
                        title="Reduce stock by 1"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateInventoryStock(item.id, 5)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg font-bold text-[11px] transition"
                        title="Add restock +5"
                      >
                        +5
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleAddItem}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add RO Consumable / Spare Part
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sediment Candle 10 inch Spun"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">SKU Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLT-SED-10"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="Filter">Filter</option>
                  <option value="Membrane">Membrane</option>
                  <option value="Pump">Pump</option>
                  <option value="SMPS">SMPS</option>
                  <option value="UV Lamp">UV Lamp</option>
                  <option value="Cartridges">Cartridges</option>
                  <option value="Fittings & Pipes">Fittings & Pipes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold mb-1">Purchase (₹)</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Selling (₹)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Initial Stock</label>
                <input
                  type="number"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                Add to Stock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
