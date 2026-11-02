'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PurifierProduct } from '@/types';
import {
  X,
  Package,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  DollarSign,
  Shield,
  Layers,
  Gauge,
  Sparkles,
  Camera,
  Upload,
} from 'lucide-react';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: PurifierProduct | null;
}

const POPULAR_BRANDS = [
  'Kent',
  'Aquaguard',
  'Pureit',
  'Havells',
  'Livpure',
  'Blue Star',
  'Aquafresh',
  'Aqua 2090',
  'Aqua 4070',
  'Aqua Innvoica',
  'Purosis',
  'Purosis Plus',
  'Finpure',
  'Aqua Pearl',
  'Aqua Copper',
  'Royal Copper',
  'Cosmax',
  'Lx One',
  'G + Series',
  'Custom Assembly',
];

const PURIFIER_TYPES = [
  'RO+UV',
  'RO+UV+UF',
  'RO+UV+UF+Alkaline',
  'RO+UV+Copper',
  'RO+UV+UF+TDS Controller',
  'Ro + Copper + Zink',
  'Ro + Alkaline',
  'Ro + Copper + Alkaline',
  'Commercial RO (25/50 LPH)',
  'Custom (Type Manually)',
];

const PRESET_SAMPLE_IMAGES = [
  { label: 'Kent Grand Aesthetic', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60' },
  { label: 'Aquaguard Black & Copper', url: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=500&auto=format&fit=crop&q=60' },
  { label: 'Havells Metallic Wall Mount', url: 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=500&auto=format&fit=crop&q=60' },
];

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { business, addPurifierProduct, updatePurifierProduct } = useApp();

  const [brand, setBrand] = useState('Kent');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [purifierType, setPurifierType] = useState('RO+UV+UF+Alkaline');
  const [customPurifierType, setCustomPurifierType] = useState('');
  const [capacityLph, setCapacityLph] = useState<number>(15);
  const [storageLiters, setStorageLiters] = useState<number>(8);
  const [stagesCount, setStagesCount] = useState<number>(7);
  const [maxInputTds, setMaxInputTds] = useState<number>(2000);
  const [mrp, setMrp] = useState<number>(19500);
  const [sellingPrice, setSellingPrice] = useState<number>(15500);
  const [dealerMargin, setDealerMargin] = useState<number>(4000);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [freeServicesCount, setFreeServicesCount] = useState<number>(3);
  const [stockStatus, setStockStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');
  const [images, setImages] = useState<string[]>([PRESET_SAMPLE_IMAGES[0].url]);
  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Zero Water Wastage Technology',
    'Alkaline Mineralizer (pH 8.0 - 8.5)',
    'High-grade TDS Controller',
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].size > 8 * 1024 * 1024) {
        setError(`Image "${fileList[i].name}" exceeds 8MB size limit.`);
        return;
      }
      files.push(fileList[i]);
    }

    // Single file targeted replacement
    if (targetSlotIndex !== null && files.length === 1) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const updated = [...images];
          updated[targetSlotIndex] = event.target.result as string;
          setImages(updated);
          setError('');
          setTargetSlotIndex(null);
        }
      };
      reader.readAsDataURL(files[0]);
      return;
    }

    // Appending up to max 3 photos
    const slotsAvailable = 3 - (targetSlotIndex === null ? images.length : 0);
    const toProcess = files.slice(0, Math.max(slotsAvailable, 1));
    let processed = 0;
    const base64Results: string[] = [];

    toProcess.forEach((f, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          base64Results[idx] = event.target.result as string;
        }
        processed++;
        if (processed === toProcess.length) {
          setImages((prev) => {
            const next = [...prev, ...base64Results.filter(Boolean)].slice(0, 3);
            return next;
          });
          setError('');
          setTargetSlotIndex(null);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const triggerAddPhoto = (slotIdx?: number) => {
    setTargetSlotIndex(typeof slotIdx === 'number' ? slotIdx : null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddPresetPhoto = (url: string) => {
    if (images.length >= 3) {
      // Replace last
      setImages((prev) => [...prev.slice(0, 2), url]);
    } else {
      setImages((prev) => [...prev, url]);
    }
  };

  useEffect(() => {
    if (productToEdit) {
      if (productToEdit.brand) {
        if (POPULAR_BRANDS.includes(productToEdit.brand) && productToEdit.brand !== 'Custom Assembly') {
          setBrand(productToEdit.brand);
          setCustomBrand('');
        } else {
          setBrand('Custom Assembly');
          setCustomBrand(productToEdit.brand === 'Custom Assembly' ? '' : productToEdit.brand);
        }
      } else {
        setBrand('Kent');
        setCustomBrand('');
      }

      setModel(productToEdit.model);

      if (productToEdit.purifierType) {
        if (PURIFIER_TYPES.includes(productToEdit.purifierType) && productToEdit.purifierType !== 'Custom (Type Manually)') {
          setPurifierType(productToEdit.purifierType);
          setCustomPurifierType('');
        } else {
          setPurifierType('Custom (Type Manually)');
          setCustomPurifierType(productToEdit.purifierType);
        }
      } else {
        setPurifierType('RO+UV+UF+Alkaline');
        setCustomPurifierType('');
      }

      setCapacityLph(productToEdit.capacityLph || 15);
      setStorageLiters(productToEdit.storageLiters || 8);
      setStagesCount(productToEdit.stagesCount || 7);
      setMaxInputTds(productToEdit.maxInputTds || 2000);
      setMrp(productToEdit.mrp || 18000);
      setSellingPrice(productToEdit.sellingPrice || 14000);
      setDealerMargin(productToEdit.dealerMargin || (productToEdit.mrp - productToEdit.sellingPrice));
      setWarrantyMonths(productToEdit.warrantyMonths || 12);
      setFreeServicesCount(productToEdit.freeServicesCount || 3);
      setStockStatus(productToEdit.stockStatus || (productToEdit.inStock ? 'In Stock' : 'Out of Stock'));
      
      const loadedImages: string[] = [];
      if (productToEdit.images && productToEdit.images.length > 0) {
        loadedImages.push(...productToEdit.images.slice(0, 3));
      } else if (productToEdit.imageUrl) {
        loadedImages.push(productToEdit.imageUrl);
      }
      setImages(loadedImages.length > 0 ? loadedImages : [PRESET_SAMPLE_IMAGES[0].url]);

      setDescription(productToEdit.description || '');
      setFeatures(productToEdit.features && productToEdit.features.length > 0 ? productToEdit.features : ['100% RO Purified Drinking Water']);
    } else {
      setBrand('Kent');
      setCustomBrand('');
      setModel('');
      setPurifierType('RO+UV+UF+Alkaline');
      setCustomPurifierType('');
      setCapacityLph(15);
      setStorageLiters(8);
      setStagesCount(7);
      setMaxInputTds(2000);
      setMrp(19500);
      setSellingPrice(15500);
      setDealerMargin(4000);
      setWarrantyMonths(12);
      setFreeServicesCount(3);
      setStockStatus('In Stock');
      setImages([PRESET_SAMPLE_IMAGES[0].url]);
      setDescription('');
      setFeatures([
        'Zero Water Wastage Technology',
        'Alkaline Mineralizer (pH 8.0 - 8.5)',
        'High-grade TDS Controller',
      ]);
    }
    setError('');
  }, [productToEdit, isOpen]);

  // Recalculate margin when MRP or Selling price changes
  const handleMrpChange = (val: number) => {
    setMrp(val);
    setDealerMargin(Math.max(0, val - sellingPrice));
  };

  const handleSellingPriceChange = (val: number) => {
    setSellingPrice(val);
    setDealerMargin(Math.max(0, mrp - val));
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveBrand = brand === 'Custom Assembly' ? (customBrand.trim() || 'Custom Assembly') : brand.trim();
    const effectivePurifierType = purifierType === 'Custom (Type Manually)' ? (customPurifierType.trim() || 'Custom RO') : purifierType;

    if (!effectiveBrand) {
      setError('Please select or specify a brand name.');
      return;
    }
    if (brand === 'Custom Assembly' && !customBrand.trim()) {
      setError('Please type your custom assembly or brand name.');
      return;
    }
    if (purifierType === 'Custom (Type Manually)' && !customPurifierType.trim()) {
      setError('Please type your custom purification technology.');
      return;
    }
    if (!model.trim()) {
      setError('Please specify the model name (e.g. Grand Plus, Aura Copper, 50 LPH).');
      return;
    }
    if (sellingPrice <= 0) {
      setError('Selling price must be greater than zero.');
      return;
    }

    const primaryImageUrl = images[0] || PRESET_SAMPLE_IMAGES[0].url;

    if (productToEdit) {
      updatePurifierProduct(productToEdit.id, {
        brand: effectiveBrand,
        model,
        purifierType: effectivePurifierType,
        capacityLph: Number(capacityLph),
        storageLiters: Number(storageLiters),
        stagesCount: Number(stagesCount),
        maxInputTds: Number(maxInputTds),
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        dealerMargin: Number(dealerMargin),
        warrantyMonths: Number(warrantyMonths),
        freeServicesCount: Number(freeServicesCount),
        inStock: stockStatus !== 'Out of Stock',
        stockStatus,
        imageUrl: primaryImageUrl,
        images: images.length > 0 ? images : [primaryImageUrl],
        description,
        features,
      });
    } else {
      addPurifierProduct({
        businessId: business.id || 'biz-client-ro',
        brand: effectiveBrand,
        model,
        purifierType: effectivePurifierType,
        capacityLph: Number(capacityLph),
        storageLiters: Number(storageLiters),
        stagesCount: Number(stagesCount),
        maxInputTds: Number(maxInputTds),
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        dealerMargin: Number(dealerMargin),
        warrantyMonths: Number(warrantyMonths),
        freeServicesCount: Number(freeServicesCount),
        inStock: stockStatus !== 'Out of Stock',
        stockStatus,
        imageUrl: primaryImageUrl,
        images: images.length > 0 ? images : [primaryImageUrl],
        description,
        features,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {productToEdit ? 'Edit Purifier Model' : 'Add Purifier to Sales Catalog'}
              </h2>
              <p className="text-xs text-slate-500">
                Showcase machines with full specs, warranty inclusions, and pricing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
              {error}
            </div>
          )}

          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand / Manufacturer *
              </label>
              <div className="flex flex-col gap-2">
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {POPULAR_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                {brand === 'Custom Assembly' && (
                  <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 animate-in fade-in duration-200">
                    <label className="block text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Type Custom Assembly / Brand Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Assembled Grand Copper / Custom Pure 12L"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Grand Plus Alkaline / Aura Copper"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Purifier Type & Stock Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purification Technology / Type *
              </label>
              <div className="flex flex-col gap-2">
                <select
                  value={purifierType}
                  onChange={(e) => setPurifierType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {PURIFIER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {purifierType === 'Custom (Type Manually)' && (
                  <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 animate-in fade-in duration-200">
                    <label className="block text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Type Custom Purification Technology *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RO + Copper + Zinc + Alkaline + UF"
                      value={customPurifierType}
                      onChange={(e) => setCustomPurifierType(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inventory Stock Status
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="In Stock">In Stock (Available for Same-Day Delivery)</option>
                <option value="Low Stock">Low Stock (Limited Units Available)</option>
                <option value="Out of Stock">Out of Stock / On Order</option>
              </select>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-blue-500" />
              Technical & Filtration Specs
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Output Rate (LPH)</label>
                <input
                  type="number"
                  value={capacityLph}
                  onChange={(e) => setCapacityLph(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Storage Tank (Liters)</label>
                <input
                  type="number"
                  value={storageLiters}
                  onChange={(e) => setStorageLiters(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Purification Stages</label>
                <input
                  type="number"
                  value={stagesCount}
                  onChange={(e) => setStagesCount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Max Input TDS (ppm)</label>
                <input
                  type="number"
                  value={maxInputTds}
                  onChange={(e) => setMaxInputTds(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Pricing & Customer Offer
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Transparent Invoicing
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">MRP Price (₹)</label>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => handleMrpChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Selling / Offer Price (₹) *</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => handleSellingPriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Discount Displayed</label>
                <div className="px-3 py-2 text-sm rounded-lg bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-medium">
                  ₹{Math.max(0, mrp - sellingPrice).toLocaleString('en-IN')} off
                </div>
              </div>
            </div>
          </div>

          {/* Warranty & Free Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Standard Warranty (Months)
              </label>
              <input
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Included Free Periodic Filter Services
              </label>
              <input
                type="number"
                value={freeServicesCount}
                onChange={(e) => setFreeServicesCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Direct Photo Upload & 3 Photo Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-500" />
                <span>Purifier Photos (Add up to 3 Photos) *</span>
              </label>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                {images.length} / 3 Photos
              </span>
            </div>

            {/* Hidden native file input for camera/gallery upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* 3 Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((slotIdx) => {
                const img = images[slotIdx];
                const slotLabel =
                  slotIdx === 0
                    ? '1. Main / Front Cover'
                    : slotIdx === 1
                    ? '2. Inside Tank & Filters'
                    : '3. Side / Wall Angle';

                if (img) {
                  return (
                    <div
                      key={slotIdx}
                      className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2.5 flex flex-col justify-between group shadow-xs hover:border-blue-400 transition-colors"
                    >
                      <div className="relative h-28 w-full rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <img
                          src={img}
                          alt={`Purifier photo ${slotIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{slotIdx === 0 ? 'Cover Photo' : `Photo #${slotIdx + 1}`}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {slotLabel}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => triggerAddPhoto(slotIdx)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Change this photo"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(slotIdx)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Remove this photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={slotIdx}
                      onClick={() => triggerAddPhoto(slotIdx)}
                      className="group border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl h-40 p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        + Add Photo #{slotIdx + 1}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {slotLabel}
                      </span>
                      <span className="mt-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                        Take / Upload
                      </span>
                    </div>
                  );
                }
              })}
            </div>

            {/* Quick Presets (Optional) */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Or select standard model template:</span>
              {PRESET_SAMPLE_IMAGES.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => handleAddPresetPhoto(preset.url)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 text-[11px] font-medium transition-colors"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Features Bullet Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Key Features & Highlights
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Copper + Zinc Booster, Mineralizer"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {features.map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs"
                >
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Short Marketing Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Highlight ideal water conditions, design features, or customer benefits..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {productToEdit ? 'Save Changes' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
