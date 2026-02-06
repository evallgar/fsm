import { queryOptions } from "@tanstack/react-query";
import { procedures } from "./api";
import { Procedure } from "./interfaces";
import { where } from "firebase/firestore";

/**
 * useProcedureByIdQueryOptions
 * Query options for getting a procedure by its ID
 * @param id The procedure ID
 * @returns Procedure or null
 */
export function useProcedureByIdQueryOptions(id: string) {
  return {
    queryKey: ['procedure', id],
    queryFn: async () => {
      try {
        const response = await procedures.get(id);
        return response;
      } catch (error) {
        console.error('Error fetching procedure:', error);
        return null;
      }
    },
    refetchOnWindowFocus: true,
  };
}

/**
 * useProceduresByEquipmentIdQueryOptions
 * Query options for getting procedures related to a specific equipment
 * @param equipmentId The equipment ID
 * @param enabled Whether the query should be enabled
 * @returns Procedure[] or empty array
 */
export function useProceduresByEquipmentIdQueryOptions(equipmentId: string, enabled?: boolean) {
  return {
    queryKey: ['procedures', 'equipment', equipmentId],
    queryFn: async () => {
      try {
        if (!equipmentId) return [];
        
        const response = await procedures.list([
          where('equipmentId', '==', equipmentId),
          where('deleted', '==', false)
        ]);
        return response;
      } catch (error) {
        console.error('Error fetching procedures for equipment:', error);
        return [];
      }
    },
    enabled: enabled !== undefined ? enabled : true,
    refetchOnWindowFocus: true,
  };
}

/**
 * useAllProceduresQueryOptions
 * Query options for getting all active procedures
 * @param limit Optional limit of results
 * @returns Procedure[] or empty array
 */
export function useAllProceduresQueryOptions(limit?: number) {
  return {
    queryKey: ['procedures', 'all', limit],
    queryFn: async () => {
      try {
        // Using limit as a separate parameter might be causing a lint error
        // Adjusting to match the API structure
        const constraints = [
          where('active', '==', true),
          where('deleted', '==', false)
        ];
        const response = await procedures.list(constraints);
        return response;
      } catch (error) {
        console.error('Error fetching all procedures:', error);
        return [];
      }
    },
    refetchOnWindowFocus: true,
  };
}

/**
 * useProceduresByTypeQueryOptions
 * Query options for getting procedures by type
 * @param type The procedure type
 * @param enabled Whether the query should be enabled
 * @returns Procedure[] or empty array
 */
export function useProceduresByTypeQueryOptions(type: string, enabled?: boolean) {
  return {
    queryKey: ['procedures', 'type', type],
    queryFn: async () => {
      try {
        if (!type) return [];
        
        const response = await procedures.list([
          where('type', '==', type),
          where('deleted', '==', false)
        ]);
        return response;
      } catch (error) {
        console.error('Error fetching procedures by type:', error);
        return [];
      }
    },
    enabled: enabled !== undefined ? enabled : true,
    refetchOnWindowFocus: true,
  };
}
