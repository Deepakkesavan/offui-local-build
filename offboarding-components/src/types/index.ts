// ── Employee / Team ────────────────────────────────────────────────

export interface TeamMember {
  empId: string;
  fullName: string;
  desg: string;
  project: string | null;
  grade: string | null;
  email: string | null;
  gender: string | null;
  doj: string | null;
  isOffboarding: boolean;
  resignationDate?: string | null;
}

export interface ManagerInfo {
  empId: string;
  fullName: string;
  desg: string;
  email: string | null;
  project: string | null;
  grade: string | null;
  managerEmpCode: string | null;
  reportingManager: string | null;
  isReportingManager: boolean;
  noOfTotalMembers: string;
  noOfActive: string;
  noOfOffboarding: string;
  totalMembers: TeamMember[];
}

export interface EmpDetail {
  empId: string;
  fullName: string;
  desg: string;
  project: string | null;
  grade: string | null;
  email: string | null;
  gender: string | null;
  doj: string | null;
  isOffboarding: boolean;
}

// ── Submission / Approval ──────────────────────────────────────────

export interface SubmissionInfo {
  isSubmitted: boolean;
  submissionLogId?: string | null;
  employeeId: string | null;
  action: string | null;
  performedBy: string | null;
  stageBefore: string | null;
  stageAfter: string | null;
  time: string | null;
  date: string | null;
}

export interface ApprovalData {
  id: string;
  managerComments: string | null;
  approvedAt: string;
}

export interface ApprovalInfo {
  isApproved: boolean;
  data?: ApprovalData;
}