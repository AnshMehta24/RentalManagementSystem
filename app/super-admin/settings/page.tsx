"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Check,
  Loader2,
  Edit2,
  Trash2,
  Plus,
  X,
  Calendar,
  Tag,
} from "lucide-react";

let tempIdCounter = -1;
function nextTempId() {
  return tempIdCounter--;
}

const SETTINGS_API = "/api/super-admin/settings";
const ADMIN_API = "/api/admin";

const UNITS = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"] as const;
const DISPLAY_TYPES = ["RADIO", "PILLS", "CHECKBOX", "IMAGE"] as const;

type PeriodUnit = (typeof UNITS)[number];
type DisplayType = (typeof DISPLAY_TYPES)[number];

interface RentalPeriodRow {
  id: number;
  name: string;
  duration: number;
  unit: PeriodUnit;
  isActive: boolean;
  _count: { rentalPrices: number };
}

interface AttributeValueRow {
  id: number;
  value: string;
  extraPrice: number;
  _count?: { variantAttributeValues: number };
}

interface AttributeRow {
  id: number;
  name: string;
  displayType: DisplayType;
  values: AttributeValueRow[];
  _count: { values: number };
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function SuperAdminSettingsPage() {
  const [periods, setPeriods] = useState<RentalPeriodRow[]>([]);
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [periodModal, setPeriodModal] = useState<"add" | "edit" | null>(null);
  const [periodForm, setPeriodForm] = useState<Partial<RentalPeriodRow>>({
    name: "",
    duration: 1,
    unit: "HOUR",
    isActive: true,
  });

  const [attrModal, setAttrModal] = useState<"add" | "edit" | null>(null);
  const [attrForm, setAttrForm] = useState<{
    id?: number;
    name: string;
    displayType: DisplayType;
    values: { id?: number; value: string; extraPrice: number }[];
  }>({ name: "", displayType: "RADIO", values: [{ value: "", extraPrice: 0 }] });

  const clearFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  };
  const showError = (msg: string) => {
    setError(msg);
    setSuccess(null);
    setTimeout(() => setError(null), 5000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    clearFeedback();
    try {
      const [pRes, aRes] = await Promise.all([
        fetch(`${SETTINGS_API}?resource=rental-periods`),
        fetch(`${SETTINGS_API}?resource=attributes`),
      ]);
      const pJson = await pRes.json();
      const aJson = await aRes.json();
      if (!pJson.success) throw new Error(pJson.error || "Failed to load periods");
      if (!aJson.success) throw new Error(aJson.error || "Failed to load attributes");
      setPeriods(pJson.data ?? []);
      setAttributes(aJson.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [clearFeedback]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openAddPeriod = () => {
    setPeriodForm({ name: "", duration: 1, unit: "HOUR", isActive: true });
    setPeriodModal("add");
  };

  const openEditPeriod = (p: RentalPeriodRow) => {
    setPeriodForm({ ...p });
    setPeriodModal("edit");
  };

  const createPeriod = async () => {
    if (!periodForm.name?.trim()) {
      showError("Name is required");
      return;
    }
    setBusy(true);
    clearFeedback();
    try {
      const res = await fetch(ADMIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "rental-period",
          name: periodForm.name.trim(),
          duration: Number(periodForm.duration) || 1,
          unit: periodForm.unit ?? "HOUR",
          isActive: periodForm.isActive ?? true,
        }),
      });
      const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
      if (!json.success) throw new Error(json.error || json.message || "Create failed");
      showSuccess("Rental period created");
      setPeriodModal(null);
      fetchAll();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const updatePeriod = async () => {
    if (!periodForm.id || !periodForm.name?.trim()) {
      showError("Name is required");
      return;
    }
    setBusy(true);
    clearFeedback();
    try {
      const res = await fetch(ADMIN_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "rental-period",
          id: periodForm.id,
          name: periodForm.name.trim(),
          duration: Number(periodForm.duration) || 1,
          unit: periodForm.unit ?? "HOUR",
          isActive: periodForm.isActive ?? true,
        }),
      });
      const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
      if (!json.success) throw new Error(json.error || json.message || "Update failed");
      showSuccess("Rental period updated");
      setPeriodModal(null);
      fetchAll();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const deletePeriod = async (p: RentalPeriodRow) => {
    if (!confirm(`Delete "${p.name}"? Periods with existing prices cannot be deleted.`)) return;
    setBusy(true);
    clearFeedback();
    try {
      const res = await fetch(`${ADMIN_API}?resource=rental-period&id=${p.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
      if (!json.success) throw new Error(json.error || json.message || "Delete failed");
      showSuccess("Rental period deleted");
      fetchAll();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const openAddAttr = () => {
    setAttrForm({
      name: "",
      displayType: "RADIO",
      values: [{ value: "", extraPrice: 0 }],
    });
    setAttrModal("add");
  };

  const openEditAttr = (a: AttributeRow) => {
    setAttrForm({
      id: a.id,
      name: a.name,
      displayType: a.displayType,
      values:
        a.values?.length > 0
          ? a.values.map((v) => ({ id: v.id, value: v.value, extraPrice: v.extraPrice }))
          : [{ value: "", extraPrice: 0 }],
    });
    setAttrModal("edit");
  };

  const addAttrValueRow = () => {
    setAttrForm((prev) => ({
      ...prev,
      values: [...prev.values, { value: "", extraPrice: 0 }],
    }));
  };

  const removeAttrValueRow = (idx: number, inUse?: boolean) => {
    if (inUse) {
      showError("Cannot remove value that is in use by product variants");
      return;
    }
    setAttrForm((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== idx),
    }));
  };

  const updateAttrValueRow = (idx: number, field: "value" | "extraPrice", val: string | number) => {
    setAttrForm((prev) => {
      const v = [...prev.values];
      v[idx] = { ...v[idx], [field]: field === "extraPrice" ? Number(val) || 0 : val };
      return { ...prev, values: v };
    });
  };

  const createAttribute = async () => {
    if (!attrForm.name.trim()) {
      showError("Attribute name is required");
      return;
    }
    const validValues = attrForm.values
      .filter((v) => v.value.trim())
      .map((v) => ({ value: v.value.trim(), extraPrice: Number(v.extraPrice) || 0 }));
    setBusy(true);
    clearFeedback();
    try {
      const res = await fetch(ADMIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "attribute",
          name: attrForm.name.trim(),
          displayType: attrForm.displayType,
          values: validValues.length > 0 ? validValues : undefined,
        }),
      });
      const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
      if (!json.success) throw new Error(json.error || json.message || "Create failed");
      showSuccess("Attribute created");
      setAttrModal(null);
      fetchAll();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const updateAttribute = async () => {
    if (!attrForm.id || !attrForm.name.trim()) {
      showError("Attribute name is required");
      return;
    }
    const validValues = attrForm.values.filter((v) => v.value.trim());
    setBusy(true);
    clearFeedback();
    try {
      const res = await fetch(SETTINGS_API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "attributes",
          attributes: [
            {
              id: attrForm.id,
              name: attrForm.name.trim(),
              displayType: attrForm.displayType,
              values: validValues.map((v) => ({
                ...(v.id && v.id > 0 ? { id: v.id } : {}),
                value: v.value.trim(),
                extraPrice: Number(v.extraPrice) || 0,
              })),
            },
          ],
        }),
      });
      const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
      if (!json.success) throw new Error(json.error || json.message || "Update failed");
      showSuccess("Attribute updated");
      setAttrModal(null);
      fetchAll();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteAttribute = async (a: AttributeRow) => {
    const inUse = a.values?.some((v) => (v._count?.variantAttributeValues ?? 0) > 0);
    if (inUse) {
      showError("Cannot delete: attribute has values in use by product variants");
      return;
    }
    if (!confirm(`Delete attribute "${a.name}" and all its values?`)) return;
    setBusy(true);
    clearFeedback();
    try {
      const res = await fetch(`${ADMIN_API}?resource=attribute&id=${a.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
      if (!json.success) throw new Error(json.error || json.message || "Delete failed");
      showSuccess("Attribute deleted");
      fetchAll();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const attrHasValuesInUse = (a: AttributeRow) =>
    a.values?.some((v) => (v._count?.variantAttributeValues ?? 0) > 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage rental periods and product attributes (Add, Edit, Delete)
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {(error || success) && (
        <div
          className={`p-4 rounded-lg text-sm font-medium border flex items-center gap-2 ${
            error
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {success && <Check className="w-5 h-5 shrink-0" />}
          {error || success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Rental Periods</h2>
                <p className="text-xs text-gray-500">Hour, Day, Week, Month options</p>
              </div>
            </div>
            <button
              onClick={openAddPeriod}
              disabled={busy}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="p-6">
            {loading && periods.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : periods.length === 0 ? (
              <p className="text-center py-12 text-gray-500">No rental periods. Click Add to create.</p>
            ) : (
              <div className="space-y-2">
                {periods.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <span className="text-sm text-gray-500">
                        {p.duration} {p.unit}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-gray-400 mr-1">
                        {p._count?.rentalPrices ?? 0} prices
                      </span>
                      <button
                        onClick={() => openEditPeriod(p)}
                        disabled={busy}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePeriod(p)}
                        disabled={busy || (p._count?.rentalPrices ?? 0) > 0}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          (p._count?.rentalPrices ?? 0) > 0
                            ? "Cannot delete: in use"
                            : "Delete"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Attributes</h2>
                <p className="text-xs text-gray-500">Color, Size, Material, etc.</p>
              </div>
            </div>
            <button
              onClick={openAddAttr}
              disabled={busy}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 text-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="p-6">
            {loading && attributes.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : attributes.length === 0 ? (
              <p className="text-center py-12 text-gray-500">No attributes. Click Add to create.</p>
            ) : (
              <div className="space-y-4">
                {attributes.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{a.name}</span>
                        <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                          {a.displayType}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditAttr(a)}
                          disabled={busy}
                          className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAttribute(a)}
                          disabled={busy || attrHasValuesInUse(a)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            attrHasValuesInUse(a)
                              ? "Cannot delete: values in use"
                              : "Delete"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.values?.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-md text-sm text-gray-700"
                        >
                          {v.value}
                          {v.extraPrice > 0 && (
                            <span className="text-emerald-600 font-medium">+₹{v.extraPrice}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={periodModal !== null}
        onClose={() => setPeriodModal(null)}
        title={periodModal === "add" ? "Add Rental Period" : "Edit Rental Period"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={periodForm.name ?? ""}
              onChange={(e) => setPeriodForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Hourly"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                type="number"
                min={1}
                value={periodForm.duration ?? 1}
                onChange={(e) =>
                  setPeriodForm((p) => ({ ...p, duration: parseInt(e.target.value, 10) || 1 }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={periodForm.unit ?? "HOUR"}
                onChange={(e) =>
                  setPeriodForm((p) => ({ ...p, unit: e.target.value as PeriodUnit }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={periodForm.isActive ?? true}
              onChange={(e) => setPeriodForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setPeriodModal(null)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={periodModal === "add" ? createPeriod : updatePeriod}
              disabled={busy || !periodForm.name?.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {periodModal === "add" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={attrModal !== null}
        onClose={() => setAttrModal(null)}
        title={attrModal === "add" ? "Add Attribute" : "Edit Attribute"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attribute Name</label>
            <input
              type="text"
              value={attrForm.name}
              onChange={(e) => setAttrForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Color"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Type</label>
            <select
              value={attrForm.displayType}
              onChange={(e) =>
                setAttrForm((p) => ({ ...p, displayType: e.target.value as DisplayType }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            >
              {DISPLAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Values (₹ extra)</label>
              <button
                type="button"
                onClick={addAttrValueRow}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                + Add value
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {attrForm.values.map((v, idx) => {
                const inUse =
                  attrModal === "edit" &&
                  typeof v.id === "number" &&
                  v.id > 0 &&
                  (attributes
                    .find((a) => a.id === attrForm.id)
                    ?.values?.find((av) => av.id === v.id)?._count?.variantAttributeValues ?? 0) > 0;
                return (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => updateAttrValueRow(idx, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={v.extraPrice}
                      onChange={(e) =>
                        updateAttrValueRow(idx, "extraPrice", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttrValueRow(idx, inUse)}
                      disabled={inUse}
                      className={`p-2 rounded-lg ${
                        inUse
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                      title={inUse ? "In use" : "Remove"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setAttrModal(null)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={attrModal === "add" ? createAttribute : updateAttribute}
              disabled={busy || !attrForm.name.trim()}
              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {attrModal === "add" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
