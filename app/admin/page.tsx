'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Edit2, Check, X, RefreshCw, Shield } from 'lucide-react';

type PeriodUnit = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
type DisplayType = 'RADIO' | 'PILLS' | 'CHECKBOX' | 'IMAGE';

interface RentalPeriod {
  id: number;
  name: string;
  duration: number;
  unit: PeriodUnit;
  isActive: boolean;
  createdAt: string;
  _count?: { rentalPrices: number };
}

interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
  extraPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Attribute {
  id: number;
  name: string;
  displayType: DisplayType;
  values?: AttributeValue[];
  createdAt?: string;
  updatedAt?: string;
  _count?: { values: number };
}

const API_BASE = '/api/admin';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'periods' | 'attributes'>('periods');
  const [rentalPeriods, setRentalPeriods] = useState<RentalPeriod[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Rental Period Form
  const [periodForm, setPeriodForm] = useState({
    name: '',
    duration: 1,
    unit: 'HOUR' as PeriodUnit,
    isActive: true,
  });

  // Attribute Form
  const [attributeForm, setAttributeForm] = useState({
    name: '',
    displayType: 'RADIO' as DisplayType,
    values: [{ value: '', extraPrice: 0 }],
  });

  const [editingPeriod, setEditingPeriod] = useState<number | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'periods') {
      fetchRentalPeriods();
    } else {
      fetchAttributes();
    }
  }, [activeTab]);

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Rental Periods API
  const fetchRentalPeriods = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?resource=rental-periods`);
      const data = await res.json();
      if (data.success) {
        setRentalPeriods(data.data);
      } else {
        showMessage('error', data.error);
      }
    } catch (err) {
      showMessage('error', 'Failed to fetch rental periods');
    } finally {
      setLoading(false);
    }
  };

  const createRentalPeriod = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'rental-period',
          ...periodForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Rental period created successfully');
        setPeriodForm({ name: '', duration: 1, unit: 'HOUR', isActive: true });
        fetchRentalPeriods();
      } else {
        showMessage('error', data.error);
      }
    } catch (err) {
      showMessage('error', 'Failed to create rental period');
    } finally {
      setLoading(false);
    }
  };

  const updateRentalPeriod = async (id: number, updates: Partial<RentalPeriod>) => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'rental-period',
          id,
          ...updates,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Updated successfully');
        setEditingPeriod(null);
        fetchRentalPeriods();
      } else {
        showMessage('error', data.error);
      }
    } catch (err) {
      showMessage('error', 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const deleteRentalPeriod = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rental period?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?resource=rental-period&id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Deleted successfully');
        fetchRentalPeriods();
      } else {
        showMessage('error', data.error);
      }
    } catch (err) {
      showMessage('error', 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  // Attributes API
  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?resource=attributes&includeValues=true`);
      const data = await res.json();
      if (data.success) {
        setAttributes(data.data);
      } else {
        showMessage('error', data.error);
      }
    } catch (err) {
      showMessage('error', 'Failed to fetch attributes');
    } finally {
      setLoading(false);
    }
  };

  const createAttribute = async () => {
    setLoading(true);
    try {
      const validValues = attributeForm.values.filter(v => v.value.trim());
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'attribute',
          name: attributeForm.name,
          displayType: attributeForm.displayType,
          values: validValues.length > 0 ? validValues : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Attribute created successfully');
        setAttributeForm({
          name: '',
          displayType: 'RADIO',
          values: [{ value: '', extraPrice: 0 }],
        });
        fetchAttributes();
      } else {
        showMessage('error', data.error);
      }
    } catch (err) {
      showMessage('error', 'Failed to create attribute');
    } finally {
      setLoading(false);
    }
  };

  const deleteAttribute = async (id: number) => {
    if (!confirm('Delete this attribute and all its values?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?resource=attribute&id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Deleted successfully');
        fetchAttributes();
      } else {
        showMessage('error', data.error);
      }
    } catch (err) {
      showMessage('error', 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const addValueField = () => {
    setAttributeForm({
      ...attributeForm,
      values: [...attributeForm.values, { value: '', extraPrice: 0 }],
    });
  };

  const removeValueField = (index: number) => {
    setAttributeForm({
      ...attributeForm,
      values: attributeForm.values.filter((_, i) => i !== index),
    });
  };

  const updateValueField = (index: number, field: 'value' | 'extraPrice', val: any) => {
    const newValues = [...attributeForm.values];
    newValues[index][field] = field === 'extraPrice' ? parseFloat(val) || 0 : val;
    setAttributeForm({ ...attributeForm, values: newValues });
  };

  const quickCreatePresets = () => {
    const presets = [
      {
        name: 'Color',
        displayType: 'IMAGE' as DisplayType,
        values: [
          { value: 'Red', extraPrice: 0 },
          { value: 'Blue', extraPrice: 0 },
          { value: 'Green', extraPrice: 0 },
          { value: 'Black', extraPrice: 0 },
          { value: 'White', extraPrice: 0 },
          { value: 'Silver', extraPrice: 0 },
          { value: 'Gold', extraPrice: 100 },
        ],
      },
      {
        name: 'Size',
        displayType: 'PILLS' as DisplayType,
        values: [
          { value: 'Small', extraPrice: 0 },
          { value: 'Medium', extraPrice: 0 },
          { value: 'Large', extraPrice: 50 },
          { value: 'X-Large', extraPrice: 100 },
        ],
      },
      {
        name: 'Material',
        displayType: 'RADIO' as DisplayType,
        values: [
          { value: 'Cotton', extraPrice: 0 },
          { value: 'Polyester', extraPrice: 0 },
          { value: 'Leather', extraPrice: 200 },
          { value: 'Silk', extraPrice: 300 },
        ],
      },
    ];
    return presets;
  };

  const loadPreset = async (preset: any) => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'attribute',
          ...preset,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', `${preset.name} attribute created!`);
        fetchAttributes();
      } else {
        showMessage('error', data.error);
      }
    } catch (err) {
      showMessage('error', 'Failed to create preset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Archivo+Black&display=swap');
        
        * {
          font-family: 'Space Mono', monospace;
        }
        
        h1, h2, h3 {
          font-family: 'Archivo Black', sans-serif;
          letter-spacing: -0.02em;
        }
      `}</style>

      {/* Header */}
      <header className="mb-12 border-b-4 border-yellow-400 pb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl md:text-7xl font-black mb-2 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
            ADMIN CONTROL
          </h1>
          <p className="text-zinc-400 text-sm">Rental Management System Dashboard</p>
        </div>
        <Link
          href="/super-admin"
          className="px-6 py-3 bg-zinc-800 border-4 border-yellow-400 text-yellow-400 font-black hover:bg-zinc-700 flex items-center gap-2"
        >
          <Shield className="w-5 h-5" /> SUPER ADMIN
        </Link>
      </header>

      {/* Notifications */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-black px-6 py-4 rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] z-50 animate-slide-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span className="font-bold">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-none border-4 border-black shadow-[8px_8px_0_0_#000] z-50 animate-slide-in">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5" />
            <span className="font-bold">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('periods')}
          className={`px-8 py-4 text-xl font-black border-4 border-black transition-all ${
            activeTab === 'periods'
              ? 'bg-yellow-400 text-black shadow-[8px_8px_0_0_#000] translate-x-0 translate-y-0'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 shadow-[4px_4px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:translate-x-[-4px] hover:translate-y-[-4px]'
          }`}
        >
          RENTAL PERIODS
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`px-8 py-4 text-xl font-black border-4 border-black transition-all ${
            activeTab === 'attributes'
              ? 'bg-pink-500 text-white shadow-[8px_8px_0_0_#000] translate-x-0 translate-y-0'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 shadow-[4px_4px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:translate-x-[-4px] hover:translate-y-[-4px]'
          }`}
        >
          ATTRIBUTES
        </button>
      </div>

      {/* Rental Periods Tab */}
      {activeTab === 'periods' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Form */}
          <div className="border-4 border-yellow-400 bg-zinc-900 p-6 shadow-[12px_12px_0_0_rgba(250,204,21,0.5)]">
            <h2 className="text-3xl font-black mb-6 text-yellow-400">CREATE PERIOD</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-400">NAME</label>
                <input
                  type="text"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border-2 border-zinc-700 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  placeholder="e.g., Hourly"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-400">DURATION</label>
                  <input
                    type="number"
                    value={periodForm.duration}
                    onChange={(e) => setPeriodForm({ ...periodForm, duration: parseInt(e.target.value) || 1 })}
                    className="w-full bg-zinc-950 border-2 border-zinc-700 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-400">UNIT</label>
                  <select
                    value={periodForm.unit}
                    onChange={(e) => setPeriodForm({ ...periodForm, unit: e.target.value as PeriodUnit })}
                    className="w-full bg-zinc-950 border-2 border-zinc-700 px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="HOUR">HOUR</option>
                    <option value="DAY">DAY</option>
                    <option value="WEEK">WEEK</option>
                    <option value="MONTH">MONTH</option>
                    <option value="YEAR">YEAR</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={periodForm.isActive}
                  onChange={(e) => setPeriodForm({ ...periodForm, isActive: e.target.checked })}
                  className="w-5 h-5 bg-zinc-950 border-2 border-zinc-700"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-zinc-400">ACTIVE</label>
              </div>

              <button
                onClick={createRentalPeriod}
                disabled={loading || !periodForm.name}
                className="w-full bg-yellow-400 text-black px-6 py-4 font-black text-lg border-4 border-black shadow-[8px_8px_0_0_#000] hover:shadow-[12px_12px_0_0_#000] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'CREATING...' : '+ CREATE PERIOD'}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="border-4 border-yellow-400 bg-zinc-900 p-6 shadow-[12px_12px_0_0_rgba(250,204,21,0.5)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-yellow-400">PERIODS LIST</h2>
              <button
                onClick={fetchRentalPeriods}
                className="p-2 bg-zinc-800 border-2 border-zinc-700 hover:bg-zinc-700"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {rentalPeriods.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No periods yet. Create one!</p>
              ) : (
                rentalPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="bg-zinc-950 border-2 border-zinc-700 p-4 hover:border-yellow-400 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-white">{period.name}</h3>
                        <p className="text-sm text-zinc-400">
                          {period.duration} {period.unit}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 border ${period.isActive ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                            {period.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          {period._count && period._count.rentalPrices > 0 && (
                            <span className="text-xs px-2 py-1 border border-blue-500 text-blue-500">
                              {period._count.rentalPrices} PRICES
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateRentalPeriod(period.id, { isActive: !period.isActive })}
                          className="p-2 bg-yellow-400 text-black border-2 border-black hover:bg-yellow-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRentalPeriod(period.id)}
                          className="p-2 bg-red-500 text-white border-2 border-black hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attributes Tab */}
      {activeTab === 'attributes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Form */}
          <div className="border-4 border-pink-500 bg-zinc-900 p-6 shadow-[12px_12px_0_0_rgba(236,72,153,0.5)]">
            <h2 className="text-3xl font-black mb-6 text-pink-500">CREATE ATTRIBUTE</h2>

            {/* Quick Presets */}
            <div className="mb-6 p-4 bg-zinc-950 border-2 border-zinc-700">
              <p className="text-sm font-bold mb-3 text-zinc-400">QUICK PRESETS</p>
              <div className="flex flex-wrap gap-2">
                {quickCreatePresets().map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset)}
                    className="px-4 py-2 bg-pink-500 text-white border-2 border-black font-bold text-sm hover:bg-pink-600"
                  >
                    + {preset.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-400">NAME</label>
                <input
                  type="text"
                  value={attributeForm.name}
                  onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border-2 border-zinc-700 px-4 py-3 text-white focus:border-pink-500 focus:outline-none"
                  placeholder="e.g., Color"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-400">DISPLAY TYPE</label>
                <select
                  value={attributeForm.displayType}
                  onChange={(e) => setAttributeForm({ ...attributeForm, displayType: e.target.value as DisplayType })}
                  className="w-full bg-zinc-950 border-2 border-zinc-700 px-4 py-3 text-white focus:border-pink-500 focus:outline-none"
                >
                  <option value="RADIO">RADIO</option>
                  <option value="PILLS">PILLS</option>
                  <option value="CHECKBOX">CHECKBOX</option>
                  <option value="IMAGE">IMAGE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-400">VALUES</label>
                <div className="space-y-2">
                  {attributeForm.values.map((val, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={val.value}
                        onChange={(e) => updateValueField(idx, 'value', e.target.value)}
                        className="flex-1 bg-zinc-950 border-2 border-zinc-700 px-3 py-2 text-white focus:border-pink-500 focus:outline-none"
                        placeholder="Value name"
                      />
                      <input
                        type="number"
                        value={val.extraPrice}
                        onChange={(e) => updateValueField(idx, 'extraPrice', e.target.value)}
                        className="w-24 bg-zinc-950 border-2 border-zinc-700 px-3 py-2 text-white focus:border-pink-500 focus:outline-none"
                        placeholder="Price"
                      />
                      {attributeForm.values.length > 1 && (
                        <button
                          onClick={() => removeValueField(idx)}
                          className="p-2 bg-red-500 text-white border-2 border-black hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addValueField}
                  className="mt-2 w-full py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-400 font-bold hover:bg-zinc-700 hover:text-white"
                >
                  + ADD VALUE
                </button>
              </div>

              <button
                onClick={createAttribute}
                disabled={loading || !attributeForm.name}
                className="w-full bg-pink-500 text-white px-6 py-4 font-black text-lg border-4 border-black shadow-[8px_8px_0_0_#000] hover:shadow-[12px_12px_0_0_#000] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'CREATING...' : '+ CREATE ATTRIBUTE'}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="border-4 border-pink-500 bg-zinc-900 p-6 shadow-[12px_12px_0_0_rgba(236,72,153,0.5)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-pink-500">ATTRIBUTES LIST</h2>
              <button
                onClick={fetchAttributes}
                className="p-2 bg-zinc-800 border-2 border-zinc-700 hover:bg-zinc-700"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {attributes.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No attributes yet. Create one!</p>
              ) : (
                attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="bg-zinc-950 border-2 border-zinc-700 p-4 hover:border-pink-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-white">{attr.name}</h3>
                        <p className="text-sm text-zinc-400">Display: {attr.displayType}</p>
                        {attr._count && (
                          <span className="text-xs px-2 py-1 border border-pink-500 text-pink-500 inline-block mt-2">
                            {attr._count.values} VALUES
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteAttribute(attr.id)}
                        className="p-2 bg-red-500 text-white border-2 border-black hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {attr.values && attr.values.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-800">
                        <p className="text-xs font-bold text-zinc-500 mb-2">VALUES:</p>
                        <div className="flex flex-wrap gap-2">
                          {attr.values.map((val) => (
                            <span
                              key={val.id}
                              className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-xs text-white"
                            >
                              {val.value}
                              {val.extraPrice > 0 && (
                                <span className="ml-2 text-yellow-400">+${val.extraPrice}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}