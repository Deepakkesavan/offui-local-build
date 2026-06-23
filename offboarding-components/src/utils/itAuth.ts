// ─────────────────────────────────────────────────────────────────
//  IT AUTH UTILITY
//  src/utils/itAuth.ts
//
//  Provides:
//    IT_DESIGNATIONS  — the exact designation strings that grant
//                       access to the IT Dashboard and IT Employee
//                       Details screens.
//    isItDesignation  — predicate used by the hook
//    useItAccess      — React hook returning { loading, authorized, userDesg }
// ─────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { createApiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

// ── Allowed IT designations ────────────────────────────────────────
export const IT_DESIGNATIONS: readonly string[] = [
  'Associate Software Engineer',
] as const;

export const isItDesignation = (desg: string | null | undefined): boolean =>
  desg != null && IT_DESIGNATIONS.includes(desg);

// ── Hook ──────────────────────────────────────────────────────────

interface ItAccessResult {
  loading: boolean;
  authorized: boolean;
  userDesg: string | null;
}

const api = createApiClient('it');

export const useItAccess = (): ItAccessResult => {
  const [loading,    setLoading]    = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userDesg,   setUserDesg]   = useState<string | null>(null);

  useEffect(() => {
    api
      .get(API_ENDPOINTS.emsData)
      .then((res) => {
        const raw  = res.data;
        const data = Array.isArray(raw) ? raw[0] : raw;
        const desg: string | null = data?.desg ?? null;
        setUserDesg(desg);
        setAuthorized(isItDesignation(desg));
      })
      .catch((err) => {
        console.error('[useItAccess] Failed to fetch EMS profile:', err);
        setAuthorized(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, authorized, userDesg };
};