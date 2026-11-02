'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PurifierProduct } from '@/types';
import {
  Search,
  Filter,
  Plus,
  Share2,
  ShoppingCart,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Gauge,
  Droplets,
  ShieldCheck,
  Tag,
  Grid,
  List,
} from 'lucide-react';

interface ProductCatalogViewProps {
  onOpenAddProduct: () => void;
  onEditProduct: (product: PurifierProduct) => void;
  onSellProduct: (product: PurifierProduct) => void;
  onShareWhatsApp: (product: PurifierProduct) => void;
}

interface ProductGridCardProps {
  product: PurifierProduct;
  onEditProduct: (product: PurifierProduct) => void;
  onSellProduct: (product: PurifierProduct) => void;
  onShareWhatsApp: (product: PurifierProduct) => void;
  onDelete: (id: string, name: string) => void;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  onEditProduct,
  onSellProduct,
  onShareWhatsApp,
  onDelete,
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const status = product.stockStatus || (product.inStock ? 'In Stock' : 'Out of Stock');

  const photos = (product.images && product.images.length > 0)
    ? product.images
    : product.imageUrl
    ? [product.imageUrl]
    : ['https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60'];

  const currentPhoto = photos[photoIndex] || photos[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
      {/* Image & Badges */}
      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={currentPhoto}
          alt={product.model}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Stock Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
              status === 'In Stock'
                ? 'bg-emerald-500 text-white'
                : status === 'Low Stock'
                ? 'bg-amber-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {status}
          </span>
        </div>

        {/* Brand Pill */}
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider">
            {product.brand}
          </span>
        </div>

        {/* Multi-Photo Carousel Switcher (Up to 3 Photos) */}
        {photos.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-10">
            {photos.map((_, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIndex(pIdx);
                }}
                className={`h-2 rounded-full transition-all ${
                  photoIndex === pIdx
                    ? 'w-6 bg-white shadow-md'
                    : 'w-2 bg-white/60 hover:bg-white'
                }`}
                title={`View Photo ${pIdx + 1} of ${photos.length}`}
              />
            ))}
            <span className="ml-1 text-[9px] font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
              {photoIndex + 1}/{photos.length}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
            {product.model}
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
            {product.purifierType}
          </p>

          {/* Spec Mini Badges */}
          <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Filtration Rate</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {product.capacityLph || 15} LPH
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Storage Tank</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {product.storageLiters || 8} Litres
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Stages</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {product.stagesCount || 7} Stages
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Max Input TDS</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {product.maxInputTds || 2000} ppm
              </span>
            </div>
          </div>

          {/* Features list */}
          {product.features && product.features.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {product.features.slice(0, 3).map((feat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Warranty Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                ₹{product.sellingPrice.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.sellingPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block">
              {product.warrantyMonths || 12}M Warranty • {product.freeServicesCount || 3} Free Services
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEditProduct(product)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Specs & Photos"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(product.id, product.model)}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Remove Purifier"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onShareWhatsApp(product)}
            className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => onSellProduct(product)}
            className="px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Sell Machine</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  onOpenAddProduct,
  onEditProduct,
  onSellProduct,
  onShareWhatsApp,
}) => {
  const { purifierProducts, deletePurifierProduct } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Extract all available brands
  const brands = ['All', ...Array.from(new Set(purifierProducts.map((p) => p.brand)))];

  const filteredProducts = purifierProducts.filter((product) => {
    const matchesBrand = selectedBrand === 'All' || product.brand.toLowerCase() === selectedBrand.toLowerCase();
    const productStatus = product.stockStatus || (product.inStock ? 'In Stock' : 'Out of Stock');
    const matchesStock = selectedStockStatus === 'All' || productStatus === selectedStockStatus;

    if (!matchesBrand || !matchesStock) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        product.brand.toLowerCase().includes(q) ||
        product.model.toLowerCase().includes(q) ||
        product.purifierType.toLowerCase().includes(q) ||
        (product.features || []).some((f) => f.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the product sales catalog?`)) {
      deletePurifierProduct(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by brand, model, alkaline, RO+UV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                {b === 'All' ? 'All Brands' : b}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hidden md:block"
          >
            <option value="All">All Stock Status</option>
            <option value="In Stock">In Stock Only</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        {/* View Mode & Add Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-0.5 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenAddProduct}
            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Purifier</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <Droplets className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No purifier models found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search query or brand filter, or add a new water purifier model to your catalog.
          </p>
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            + Add First Purifier
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              onEditProduct={onEditProduct}
              onSellProduct={onSellProduct}
              onShareWhatsApp={onShareWhatsApp}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && filteredProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Purifier Model</th>
                  <th className="py-3 px-4">Brand & Technology</th>
                  <th className="py-3 px-4">Specs (LPH / Tank / TDS)</th>
                  <th className="py-3 px-4 text-right">Offer Price (MRP)</th>
                  <th className="py-3 px-4 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-center">Warranty & Services</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const status = p.stockStatus || (p.inStock ? 'In Stock' : 'Out of Stock');
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {(p.imageUrl || (p.images && p.images[0])) && (
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200 dark:border-slate-700">
                              <img
                                src={p.imageUrl || (p.images && p.images[0])}
                                alt={p.model}
                                className="w-full h-full object-cover"
                              />
                              {p.images && p.images.length > 1 && (
                                <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[8px] font-bold px-1 rounded-tl">
                                  {p.images.length}P
                                </span>
                              )}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{p.model}</span>
                            {p.images && p.images.length > 1 && (
                              <span className="text-[10px] text-blue-600 font-medium">
                                {p.images.length} photos
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{p.brand}</span>
                        <span className="text-[11px] text-blue-600">{p.purifierType}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {p.capacityLph} LPH • {p.storageLiters}L • &le;{p.maxInputTds || 2000} ppm
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          ₹{p.sellingPrice.toLocaleString('en-IN')}
                        </span>
                        {p.mrp > p.sellingPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{p.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'In Stock'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">
                        {p.warrantyMonths || 12}M • {p.freeServicesCount || 3} Free Visits
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onShareWhatsApp(p)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSellProduct(p)}
                            className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
