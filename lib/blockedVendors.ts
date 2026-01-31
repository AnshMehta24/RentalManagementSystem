import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const FILENAME = "blocked-vendors.json";

function getDataPath(): string {
  return path.join(process.cwd(), "data", FILENAME);
}

/**
 * Get list of blocked vendor IDs (no schema change).
 * Also checks env SUPER_ADMIN_BLOCKED_VENDORS (comma-separated) for override.
 */
export async function getBlockedVendorIds(): Promise<number[]> {
  const envIds = process.env.SUPER_ADMIN_BLOCKED_VENDORS;
  if (envIds && envIds.trim()) {
    return envIds.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
  }
  try {
    const p = getDataPath();
    const data = await readFile(p, "utf-8");
    const ids = JSON.parse(data) as number[];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export async function setBlockedVendorIds(ids: number[]): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(getDataPath(), JSON.stringify(ids, null, 2), "utf-8");
}

export async function blockVendor(vendorId: number): Promise<void> {
  const ids = await getBlockedVendorIds();
  if (ids.includes(vendorId)) return;
  await setBlockedVendorIds([...ids, vendorId]);
}

export async function unblockVendor(vendorId: number): Promise<void> {
  const ids = await getBlockedVendorIds();
  await setBlockedVendorIds(ids.filter((id) => id !== vendorId));
}

export async function isVendorBlocked(vendorId: number): Promise<boolean> {
  const ids = await getBlockedVendorIds();
  return ids.includes(vendorId);
}
