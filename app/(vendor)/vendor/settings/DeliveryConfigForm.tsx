"use client";

import { useState } from "react";
import {
  updateVendorDeliveryConfig,
  type VendorDeliveryConfigRecord,
  type UpdateDeliveryConfigInput,
} from "./action";
import type { DeliveryChargeType } from "@/generated/prisma/enums";
import { Truck } from "lucide-react";

const CHARGE_TYPES: { value: DeliveryChargeType; label: string }[] = [
  { value: "FLAT", label: "Flat fee" },
  { value: "PER_KM", label: "Per km" },
  { value: "FREE", label: "Free delivery" },
];

interface DeliveryConfigFormProps {
  initial: VendorDeliveryConfigRecord | null;
}

export default function DeliveryConfigForm({ initial }: DeliveryConfigFormProps) {
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(
    initial?.isDeliveryEnabled ?? true
  );
  const [chargeType, setChargeType] = useState<DeliveryChargeType>(
    initial?.chargeType ?? "FLAT"
  );
  const [flatCharge, setFlatCharge] = useState(
    initial?.flatCharge != null ? String(initial.flatCharge) : ""
  );
  const [ratePerKm, setRatePerKm] = useState(
    initial?.ratePerKm != null ? String(initial.ratePerKm) : ""
  );
  const [freeAboveAmount, setFreeAboveAmount] = useState(
    initial?.freeAboveAmount != null ? String(initial.freeAboveAmount) : ""
  );
  const [maxDeliveryKm, setMaxDeliveryKm] = useState(
    initial?.maxDeliveryKm != null ? String(initial.maxDeliveryKm) : ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    const payload: UpdateDeliveryConfigInput = {
      isDeliveryEnabled,
      chargeType,
      flatCharge: chargeType === "FLAT" && flatCharge !== "" ? parseFloat(flatCharge) : null,
      ratePerKm: chargeType === "PER_KM" && ratePerKm !== "" ? parseFloat(ratePerKm) : null,
      freeAboveAmount: freeAboveAmount !== "" ? parseFloat(freeAboveAmount) : null,
      maxDeliveryKm: maxDeliveryKm !== "" ? parseFloat(maxDeliveryKm) : null,
    };

    const result = await updateVendorDeliveryConfig(payload);
    setSaving(false);
    if (result.success) {
      setMessage({ type: "success", text: "Delivery settings saved." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to save." });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isDeliveryEnabled"
          checked={isDeliveryEnabled}
          onChange={(e) => setIsDeliveryEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isDeliveryEnabled" className="text-sm font-medium text-gray-900">
          Enable delivery for my store
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Charge type
        </label>
        <div className="flex flex-wrap gap-4">
          {CHARGE_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="chargeType"
                value={value}
                checked={chargeType === value}
                onChange={() => setChargeType(value)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {chargeType === "FLAT" && (
        <div>
          <label htmlFor="flatCharge" className="block text-sm font-medium text-gray-700 mb-1">
            Flat delivery charge (₹)
          </label>
          <input
            id="flatCharge"
            type="number"
            min="0"
            step="0.01"
            value={flatCharge}
            onChange={(e) => setFlatCharge(e.target.value)}
            className="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 100"
          />
        </div>
      )}

      {chargeType === "PER_KM" && (
        <>
          <div>
            <label htmlFor="ratePerKm" className="block text-sm font-medium text-gray-700 mb-1">
              Rate per km (₹)
            </label>
            <input
              id="ratePerKm"
              type="number"
              min="0"
              step="0.01"
              value={ratePerKm}
              onChange={(e) => setRatePerKm(e.target.value)}
              className="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <label htmlFor="maxDeliveryKm" className="block text-sm font-medium text-gray-700 mb-1">
              Max delivery distance (km, optional)
            </label>
            <input
              id="maxDeliveryKm"
              type="number"
              min="0"
              step="0.1"
              value={maxDeliveryKm}
              onChange={(e) => setMaxDeliveryKm(e.target.value)}
              className="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Charge is capped at this distance. Leave blank for no cap.
            </p>
          </div>
        </>
      )}

      {(chargeType === "FLAT" || chargeType === "PER_KM") && (
        <div>
          <label htmlFor="freeAboveAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Free delivery above order amount (₹, optional)
          </label>
          <input
            id="freeAboveAmount"
            type="number"
            min="0"
            step="0.01"
            value={freeAboveAmount}
            onChange={(e) => setFreeAboveAmount(e.target.value)}
            className="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 2000"
          />
          <p className="mt-1 text-xs text-gray-500">
            If order subtotal is at least this amount, delivery charge is waived.
          </p>
        </div>
      )}

      {chargeType === "FREE" && (
        <p className="text-sm text-gray-600">
          Customers will not be charged for delivery. You can optionally set &quot;Free delivery above order amount&quot; when using Flat or Per km to waive charges above a threshold.
        </p>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save delivery settings"}
      </button>
    </form>
  );
}
