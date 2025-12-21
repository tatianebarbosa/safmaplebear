/**
 * Service for managing justifications via backend API
 */

import { apiGet, apiPost } from "./apiClient";
import type { Justification } from "@/types/schoolLicense";

const NETLIFY_BASE =
  (typeof import.meta !== "undefined" && (import.meta.env as any)?.VITE_NETLIFY_BASE) || "";
const API_TOKEN =
  (typeof import.meta !== "undefined" && (import.meta.env as any)?.VITE_API_TOKEN) || "";

interface JustificationResponse {
  success: boolean;
  data?: Justification[];
  message?: string;
}

interface CreateJustificationResponse {
  success: boolean;
  data?: Justification;
  message?: string;
}

/**
 * Fetch all justifications or filter by school ID
 */
export async function fetchJustifications(
  schoolId?: string
): Promise<Justification[]> {
  try {
    const url = schoolId
      ? `${NETLIFY_BASE}/.netlify/functions/justifications?school_id=${schoolId}`
      : `${NETLIFY_BASE}/.netlify/functions/justifications`;

    const response = await apiGet<JustificationResponse>(url, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok || !response.data?.success) {
      console.error("Failed to fetch justifications:", response.error);
      return [];
    }

    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching justifications:", error);
    return [];
  }
}

/**
 * Create a new justification
 */
export async function createJustification(
  justification: Omit<Justification, "id" | "timestamp">
): Promise<Justification | null> {
  try {
    const url = `${NETLIFY_BASE}/.netlify/functions/justifications`;

    const response = await apiPost<CreateJustificationResponse>(
      url,
      {
        schoolId: justification.schoolId,
        schoolName: justification.schoolName,
        oldUser: justification.oldUser,
        newUser: justification.newUser,
        reason: justification.reason,
        performedBy: justification.performedBy,
      },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
    );

    if (!response.ok || !response.data?.success) {
      console.error("Failed to create justification:", response.error);
      return null;
    }

    return response.data.data || null;
  } catch (error) {
    console.error("Error creating justification:", error);
    return null;
  }
}

/**
 * Migrate justifications from localStorage to backend
 * This is a one-time migration function
 */
export async function migrateJustificationsToBackend(
  localJustifications: Justification[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const justification of localJustifications) {
    const result = await createJustification({
      schoolId: justification.schoolId,
      schoolName: justification.schoolName,
      oldUser: justification.oldUser,
      newUser: justification.newUser,
      reason: justification.reason,
      performedBy: justification.performedBy,
    });

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
