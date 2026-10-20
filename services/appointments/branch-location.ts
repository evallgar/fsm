import { request } from "@/lib/onemap-api";

export interface BranchPoint {
  latitude: number;
  longitude: number;
}

/** "CIRCLE (25.74 -100.40, 50)" -> its centre. */
function circleCentre(area?: string): BranchPoint | undefined {
  const match = /CIRCLE\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*,/i.exec(area ?? "");
  if (!match) return undefined;
  const point = { latitude: Number(match[1]), longitude: Number(match[2]) };
  return point.latitude === 0 && point.longitude === 0 ? undefined : point;
}

/**
 * Where a branch is now: the centre of its geofence. A work order only keeps a copy of its branch from the day it was
 * saved, so this is how the map finds a location that was set afterwards. Needs access to the geofence; without it
 * (or when the branch has none) nothing is returned.
 */
export async function branchPoint(branchId: string | number): Promise<BranchPoint | undefined> {
  const id = Number(branchId);
  if (!id) return undefined;
  try {
    const branch = await request<{ attributes?: { geofenceId?: number | string } }>("GET", `/branches/${id}`);
    const geofenceId = Number(branch.attributes?.geofenceId);
    if (!geofenceId) return undefined;
    const geofence = await request<{ area?: string }>("GET", `/geofences/${geofenceId}`);
    return circleCentre(geofence.area);
  } catch {
    return undefined;
  }
}
