"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Trash2, X, Check, Plus } from "lucide-react";
import { updateAddress, deleteAddress, saveAddress } from "@/app/(customer)/actions/checkout";

export type AddressItem = {
  id: number;
  type: string;
  name: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
};

function formatAddress(a: AddressItem): string {
  const parts = [a.name, a.line1, a.line2, a.city, a.state, a.country, a.pincode].filter(
    Boolean
  );
  return parts.join(", ");
}

const emptyNewAddress = {
  type: "SHIPPING" as "SHIPPING" | "BILLING",
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  isDefault: false,
};

export default function AddressList({ addresses }: { addresses: AddressItem[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyNewAddress);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    isDefault: boolean;
  } | null>(null);

  function startEdit(addr: AddressItem) {
    setEditingId(addr.id);
    setError(null);
    setFormData({
      name: addr.name ?? "",
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      state: addr.state,
      country: addr.country,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData(null);
    setError(null);
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId || !formData) return;
    setError(null);
    const result = await updateAddress(editingId, {
      name: formData.name || null,
      line1: formData.line1,
      line2: formData.line2 || null,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pincode: formData.pincode,
      isDefault: formData.isDefault,
    });
    if (result.success) {
      cancelEdit();
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update address");
    }
  }

  async function handleDelete(addressId: number) {
    if (!confirm("Remove this address?")) return;
    setDeletingId(addressId);
    setError(null);
    const result = await deleteAddress(addressId);
    setDeletingId(null);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Failed to delete address");
    }
  }

  function cancelAdd() {
    setShowAddForm(false);
    setNewAddress(emptyNewAddress);
    setError(null);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    const result = await saveAddress({
      type: newAddress.type,
      name: newAddress.name || null,
      line1: newAddress.line1,
      line2: newAddress.line2 || null,
      city: newAddress.city,
      state: newAddress.state,
      country: newAddress.country,
      pincode: newAddress.pincode,
      isDefault: newAddress.isDefault || addresses.length === 0,
    });
    setAdding(false);
    if (result.success) {
      cancelAdd();
      router.refresh();
    } else {
      setError(result.error ?? "Failed to add address");
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Saved addresses</h2>
      </div>
      <div className="p-6">
        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {showAddForm ? (
          <form onSubmit={handleAdd} className="mb-6 p-4 rounded-lg border border-gray-200 bg-blue-50/30 border-blue-200 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Add new address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address type *
                </label>
                <select
                  value={newAddress.type}
                  onChange={(e) =>
                    setNewAddress((prev) => ({
                      ...prev,
                      type: e.target.value as "SHIPPING" | "BILLING",
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="SHIPPING">Shipping</option>
                  <option value="BILLING">Billing</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Contact name"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.line1}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, line1: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address line 2 (optional)
                </label>
                <input
                  type="text"
                  value={newAddress.line2}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, line2: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, state: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.country}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, country: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.pincode}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, pincode: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new-address-default"
                  checked={newAddress.isDefault}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, isDefault: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="new-address-default" className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={adding}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {adding ? "Adding…" : "Add address"}
              </button>
              <button
                type="button"
                onClick={cancelAdd}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add another address
          </button>
        )}

        {addresses.length === 0 && !showAddForm ? (
          <p className="text-gray-500 text-sm">
            No saved addresses yet. Add one below or at checkout when placing an order.
          </p>
        ) : addresses.length > 0 ? (
          <ul className="space-y-4">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition"
              >
                {editingId === addr.id && formData ? (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Name (optional)
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => prev && { ...prev, name: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="Contact name"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Address line 1 *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.line1}
                          onChange={(e) =>
                            setFormData((prev) => prev && { ...prev, line1: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Address line 2 (optional)
                        </label>
                        <input
                          type="text"
                          value={formData.line2}
                          onChange={(e) =>
                            setFormData((prev) => prev && { ...prev, line2: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) =>
                            setFormData((prev) => prev && { ...prev, city: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) =>
                            setFormData((prev) => prev && { ...prev, state: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Country *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.country}
                          onChange={(e) =>
                            setFormData((prev) => prev && { ...prev, country: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.pincode}
                          onChange={(e) =>
                            setFormData((prev) => prev && { ...prev, pincode: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`default-${addr.id}`}
                          checked={formData.isDefault}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev ? { ...prev, isDefault: e.target.checked } : null
                            )
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`default-${addr.id}`} className="text-sm text-gray-700">
                          Set as default address
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                          {addr.type.replace("_", " ")}
                        </span>
                        {addr.isDefault && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(addr)}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                          aria-label="Edit address"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(addr.id)}
                          disabled={deletingId === addr.id}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition disabled:opacity-50"
                          aria-label="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900">{formatAddress(addr)}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
