// ─────────────────────────────────────────────────────────────────
//  DEPARTMENT DASHBOARD CONFIG
//  src/config/dashboardConfig.ts
//
//  A thin descriptor object that parameterises the shared
//  DepartmentDashboard shell for HR, IT, or any future department.
//  Pass one of these to <DepartmentDashboard config={...} /> instead
//  of having per-department page components with identical layouts.
// ─────────────────────────────────────────────────────────────────

export interface DashboardStatCard {
  title: string;
  subtitle: string;
  /** Which stageAfter values count toward this card */
  stages: string[];
}

export interface DepartmentDashboardConfig {
  /** Human-readable name shown in the page heading */
  departmentName: string;
  /** axios role key from JWT_TOKENS */
  apiRole: 'hr' | 'it';
  /** Allowed designations for access guard */
  allowedDesignations: readonly string[];
  /** Stat cards (up to 2) */
  statCards: [DashboardStatCard, DashboardStatCard];
  /** Route to navigate to when "View Tasks" is clicked */
  detailRoute: (empId: string) => string;
}

// ── HR config ─────────────────────────────────────────────────────
export const HR_DASHBOARD_CONFIG: DepartmentDashboardConfig = {
  departmentName: 'HR',
  apiRole: 'hr',
  allowedDesignations: [
    'Team Lead - HR',
    'Senior Manager - Human Resources',
    'Senior Exectuive - Talent Acquisition',
  ],
  statCards: [
    {
      title: 'Active Requests',
      subtitle: 'Awaiting reporting manager approval',
      stages: ['exit_interview', ''],
    },
    {
      title: 'Pending Approvals',
      subtitle: 'Manager-approved, awaiting HR sign-off',
      stages: ['manager_approved'],
    },
  ],
  detailRoute: (empId) => `/HREmployeeDetails/${empId}`,
};

// ── IT config ─────────────────────────────────────────────────────
export const IT_DASHBOARD_CONFIG: DepartmentDashboardConfig = {
  departmentName: 'IT',
  apiRole: 'it',
  allowedDesignations: ['Associate Software Engineer'],
  statCards: [
    {
      title: 'Pending IT Clearance',
      subtitle: 'HR-initiated, awaiting IT sign-off',
      stages: ['hr_initiation'],
    },
    {
      title: 'Cleared',
      subtitle: 'IT clearance completed',
      stages: ['department_clearance'],
    },
  ],
  detailRoute: (empId) => `/ITEmployeeDetails/${empId}`,
};