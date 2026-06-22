// ─────────────────────────────────────────────────────────────────
//  HR AUTH UTILITY
//  src/utils/hrAuth.ts
//
//  Provides:
//    HR_DESIGNATIONS  — the exact designation strings that grant
//                       access to the HR Dashboard and HR Employee
//                       Details screens.
//    isHrDesignation  — predicate used by the hook and anywhere
//                       else a quick check is needed.
//    useHrAccess      — React hook that fetches the logged-in
//                       user's EMS profile, checks their designation,
//                       and returns { loading, authorized, userDesg }.
//
//  Usage in a screen:
//    const { loading, authorized, userDesg } = useHrAccess();
//    if (loading) return <div className="offui-hed-loading">Checking access…</div>;
//    if (!authorized) return <HrAccessDenied desg={userDesg} />;
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { createApiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

// ── Allowed HR designations ────────────────────────────────────────
// Exact strings as they appear in the EMS `desg` field.
// Matching is case-sensitive to avoid accidental over-grants.
export const HR_DESIGNATIONS: readonly string[] = [
  'Team Lead - HR',
  'Senior Manager - Human Resources',
  'Senior Exectuive - Talent Acquisition', // intentional spelling matches EMS data
] as const;

export const isHrDesignation = (desg: string | null | undefined): boolean =>
  desg != null && HR_DESIGNATIONS.includes(desg);

// ── Hook ──────────────────────────────────────────────────────────

interface HrAccessResult {
  /** True while the EMS profile fetch is in flight. */
  loading: boolean;
  /** True if the logged-in user's designation is in HR_DESIGNATIONS. */
  authorized: boolean;
  /** The resolved designation string (or null if fetch failed / not yet resolved). */
  userDesg: string | null;
}

const api = createApiClient('hr');

export const useHrAccess = (): HrAccessResult => {
  const [loading,    setLoading]    = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userDesg,   setUserDesg]   = useState<string | null>(null);

  useEffect(() => {
    api
      .get(API_ENDPOINTS.emsData)
      .then((res) => {
        // EmsData returns a single EmpInfo object (or wraps it in an array
        // depending on the endpoint — handle both shapes safely).
        const raw  = res.data;
        const data = Array.isArray(raw) ? raw[0] : raw;
        const desg: string | null = data?.desg ?? null;

        setUserDesg(desg);
        setAuthorized(isHrDesignation(desg));
      })
      .catch((err) => {
        console.error('[useHrAccess] Failed to fetch EMS profile:', err);
        setAuthorized(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, authorized, userDesg };
};