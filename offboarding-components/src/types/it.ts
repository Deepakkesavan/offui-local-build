// ── IT Clearance types ─────────────────────────────────────────────
// Mirrors the shape returned by POST /api/ItDepartment and
// GET /api/GetItClearance/{submissionLogId}.

export interface ItClearanceData {
  id: string;
  submissionLogId: string;
  employeeId: string;
  itEmpId: string;
  itName: string | null;

  corporateLaptopReturned: boolean;
  mobileDeviceReturned: boolean;
  securityBadgeReturned: boolean;
  accessCardsReturned: boolean;

  corporateEmailStatus: string | null;
  cloudInfraStatus: string | null;
  vpnAccessStatus: string | null;
  internalToolsStatus: string | null;

  deviceSerialNumber: string | null;
  secondaryAssetNotes: string | null;
  itComments: string | null;

  employeeName: string | null;
  designation: string | null;
  department: string | null;
  clearedAt: string;
  isActive: boolean;
}

export interface ItClearanceInfo {
  isCleared: boolean;
  data?: ItClearanceData;
}

// ── IT asset checklist item shape ─────────────────────────────────
export interface AssetChecklistItem {
  key: 'corporateLaptop' | 'mobileDevice' | 'securityBadge' | 'accessCards';
  label: string;
  sublabel: string;
}

// ── Access revocation item shape ───────────────────────────────────
export type RevocationStatus = 'suspended' | 'revoked' | 'pending';

export interface AccessRevocationItem {
  key: 'corporateEmail' | 'cloudInfra' | 'vpnAccess' | 'internalTools';
  label: string;
  status: RevocationStatus;
}