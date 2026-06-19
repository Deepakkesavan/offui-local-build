// ── HR Dashboard types ─────────────────────────────────────────────
// These mirror the shapes returned by the existing offboarding-prc-api
// endpoints (SubmissionLogController, ApproveOffboardingController)
// plus a couple of HR-specific aggregate/view shapes.

// Raw row as stored in off.SubmissionLogs — one row per submit action.
// The API currently only exposes "latest submission per employee" via
// GetSubmit, so for the "all employees" log feed we read the same
// table shape but expect an array (see hrApi.getAllSubmissionLogs).
export interface SubmissionLogEntry {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  action: string;
  performedBy: string | null;
  stageBefore: string | null;
  stageAfter: string | null;
  createdAt: string; // ISO timestamp
}

// Mirrors ManagerApprovalDto from the API (DTOs/ManagerApprovalDTOs.cs)
export interface ManagerApprovalRecord {
  id: string;
  submissionLogId: string;
  employeeId: string;
  managerEmpId: string;
  managerName: string | null;
  managerComments: string | null;
  employeeName: string | null;
  designation: string | null;
  department: string | null;
  resignationDate: string | null;
  lastWorkingDay: string | null;
  reasonForLeaving: string | null;
  approvedAt: string;
  isActive: boolean;
}

// Offboarding stage keys, in pipeline order (matches StageAfter values
// used across SubmissionLogService / ApproveOffboardingController).
export type OffboardingStage =
  | 'exit_interview'
  | 'manager_approved'
  | 'hr_initiation'
  | 'department_clearance'
  | 'final_approval';

// One row in the HR "All Offboarding Employees" table.
export interface HrOffboardingMember {
  empId: string;
  fullName: string;
  lastWorkingDay: string | null; // sourced from ManagerApproval.lastWorkingDay
  stage: OffboardingStage | string;
  stageLabel: string;
}

// ── HR Initiation ────────────────────────────────────────────────
// Mirrors HrInitiationDto from the API (DTOs/HrInitiationDTOs.cs).
// Same isX/data envelope shape as ApprovalInfo/ApprovalData, returned
// by GET /api/GetHRInitiation/{submissionLogId}.
export interface HrInitiationData {
  id: string;
  submissionLogId: string;
  employeeId: string;
  hrEmpId: string;
  hrName: string | null;
  hrComments: string | null;
  employeeName: string | null;
  designation: string | null;
  department: string | null;
  lastWorkingDay: string | null;
  initiatedAt: string;
  isActive: boolean;
}

export interface HrInitiationInfo {
  isInitiated: boolean;
  data?: HrInitiationData;
}