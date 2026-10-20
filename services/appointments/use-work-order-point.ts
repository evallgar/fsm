import { useQuery } from "@tanstack/react-query";
import { branchPoint, BranchPoint } from "./branch-location";
import { WorkOrder } from "./interfaces";

const usable = (p?: { latitude?: number; longitude?: number } | null): p is BranchPoint =>
  typeof p?.latitude === "number" && typeof p?.longitude === "number" && !(p.latitude === 0 && p.longitude === 0);

/**
 * Where a work order is: the location saved on it, or else the branch's own location now (the saved copy can be older
 * than the branch's location). `point` stays undefined when there is none, e.g. no geofence or no access to it.
 */
export function useWorkOrderPoint(workOrder?: WorkOrder): { point?: BranchPoint; lookingUp: boolean } {
  const saved = workOrder?.location?.location;
  const savedUsable = usable(saved);
  const { data: current, isLoading } = useQuery({
    queryKey: ["branch-point", workOrder?.branchId],
    queryFn: () => branchPoint(workOrder!.branchId),
    enabled: !!workOrder?.branchId && !savedUsable,
    staleTime: 5 * 60 * 1000,
  });
  return { point: savedUsable ? saved : current, lookingUp: !savedUsable && isLoading };
}
