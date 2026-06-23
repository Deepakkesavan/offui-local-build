// src/screens/DepartmentDashboard/DepartmentDashboard.tsx
//
// Shared dashboard shell used by both the HR Dashboard and IT Dashboard.
// The department-specific details (API role, allowed designations, stat cards,
// detail route) are injected via the `config` prop using DepartmentDashboardConfig.
//
// Usage:
//   <DepartmentDashboard config={HR_DASHBOARD_CONFIG} />
//   <DepartmentDashboard config={IT_DASHBOARD_CONFIG} />

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OffuiCards from '../../components/Cards/offuiCards';
import HrTeamTable from '../../components/HRTeamTable/hrTeamTable';
import type { SubmissionLogEntry, ManagerApprovalRecord, HrOffboardingMember } from '../../types/hr';
import { createApiClient } from '../../utils/apiClient';
import { buildActivityFeed, getStageLabel } from '../../utils/hr';
import { API_ENDPOINTS } from '../../config/api';
import type { DepartmentDashboardConfig } from '../../config/dashboardConfig';
import '../HRDashboard/hrDashboard.css';

// ── Access-denied banner ──────────────────────────────────────────
const AccessDenied = ({
  desg,
  departmentName,
  allowedDesignations,
}: {
  desg: string | null;
  departmentName: string;
  allowedDesignations: readonly string[];
}) => (
  <section className="offui-hrd">
    <div style={{
      background: '#fff5f5',
      border: '1.5px solid #fca5a5',
      borderRadius: '8px',
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '560px',
    }}>
      <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
        Access Restricted
      </p>
      <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' }}>
        The {departmentName} Dashboard is only available to {departmentName} staff.
        {desg && <> Your current designation (<strong>{desg}</strong>) does not have access to this screen.</>}
      </p>
      <p style={{ margin: '8px 0 0', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#98a2b3', letterSpacing: '0.04em' }}>
        AUTHORISED DESIGNATIONS: {allowedDesignations.join(' · ')}
      </p>
    </div>
  </section>
);

// ── Props ─────────────────────────────────────────────────────────
interface DepartmentDashboardProps {
  config: DepartmentDashboardConfig;
}

// ── Main component ────────────────────────────────────────────────
const DepartmentDashboard = ({ config }: DepartmentDashboardProps) => {
  const navigate = useNavigate();
  const api = createApiClient(config.apiRole);

  // ── Access check — fetch EMS profile ────────────────────────
  const [accessLoading, setAccessLoading] = useState(true);
  const [authorized,    setAuthorized]    = useState(false);
  const [userDesg,      setUserDesg]      = useState<string | null>(null);

  useEffect(() => {
    api
      .get(API_ENDPOINTS.emsData)
      .then((res) => {
        const raw  = res.data;
        const data = Array.isArray(raw) ? raw[0] : raw;
        const desg: string | null = data?.desg ?? null;
        setUserDesg(desg);
        setAuthorized(config.allowedDesignations.includes(desg ?? ''));
      })
      .catch(() => setAuthorized(false))
      .finally(() => setAccessLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Data ─────────────────────────────────────────────────────
  const [logs,      setLogs]      = useState<SubmissionLogEntry[]>([]);
  const [approvals, setApprovals] = useState<ManagerApprovalRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!authorized) return;

    Promise.all([
      api.get<SubmissionLogEntry[]>(API_ENDPOINTS.allSubmissionLogs),
      api.get<ManagerApprovalRecord[]>(API_ENDPOINTS.allManagerApprovals),
    ])
      .then(([logsRes, approvalsRes]) => {
        setLogs(logsRes.data ?? []);
        setApprovals(approvalsRes.data ?? []);
      })
      .catch((err) => {
        console.error(`Failed to load ${config.departmentName} dashboard data:`, err);
        setError('Could not load offboarding records. Please try again.');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  // ── Access states ─────────────────────────────────────────────
  if (accessLoading) {
    return (
      <section className="offui-hrd">
        <div className="offui-hrd-activity" style={{ padding: '48px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#667085' }}>
          Verifying access…
        </div>
      </section>
    );
  }

  if (!authorized) {
    return (
      <AccessDenied
        desg={userDesg}
        departmentName={config.departmentName}
        allowedDesignations={config.allowedDesignations}
      />
    );
  }

  // ── Derive latest-stage-per-employee ─────────────────────────
  const latestByEmployee = new Map<string, SubmissionLogEntry>();
  for (const log of logs) {
    const existing = latestByEmployee.get(log.employeeId);
    if (!existing || new Date(log.createdAt) > new Date(existing.createdAt)) {
      latestByEmployee.set(log.employeeId, log);
    }
  }
  const latestEntries = Array.from(latestByEmployee.values());

  // ── Stat card counts ──────────────────────────────────────────
  const countForCard = (stages: string[]) =>
    latestEntries.filter((e) => stages.includes(e.stageAfter ?? '')).length;

  // ── Last working day lookup ───────────────────────────────────
  const lastWorkingDayByEmployee = new Map<string, string | null>();
  for (const approval of approvals) {
    if (approval.isActive) {
      lastWorkingDayByEmployee.set(approval.employeeId, approval.lastWorkingDay);
    }
  }

  // ── Table rows ────────────────────────────────────────────────
  const members: HrOffboardingMember[] = latestEntries.map((entry) => ({
    empId:          entry.employeeId,
    fullName:       entry.employeeName ?? entry.employeeId,
    lastWorkingDay: lastWorkingDayByEmployee.get(entry.employeeId) ?? null,
    stage:          entry.stageAfter ?? 'exit_interview',
    stageLabel:     getStageLabel(entry.stageAfter),
  }));

  const activityFeed = buildActivityFeed(logs);

  const handleViewTasks = (member: HrOffboardingMember) => {
    navigate(config.detailRoute(member.empId));
  };

  return (
    <section className="offui-hrd">
      {/* Row 1 — Stat cards */}
      <div className="offui-hrd-stats">
        {config.statCards.map((card) => (
          <OffuiCards
            key={card.title}
            title={card.title}
            value={String(countForCard(card.stages))}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      {/* Row 2 — Activity + Records */}
      <div className="offui-hrd-main">
        {/* Recent Activity */}
        <div>
          <h2 className="offui-hrd-section-title">Recent Activity</h2>
          <div className="offui-hrd-activity">
            <div className="offui-hrd-activity-list">
              {loading ? (
                <div className="offui-hrd-activity-empty">Loading activity…</div>
              ) : activityFeed.length === 0 ? (
                <div className="offui-hrd-activity-empty">No activity yet.</div>
              ) : (
                activityFeed.map((item) => (
                  <div key={item.id} className="offui-hrd-activity-item">
                    <span className="offui-hrd-activity-dot" />
                    <div className="offui-hrd-activity-body">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <span>{item.timeLabel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="offui-hrd-view-all-btn" onClick={() => navigate(`/${config.departmentName}Activity`)}>
              View All Activity
            </button>
          </div>
        </div>

        {/* Offboarding Records */}
        <div className="offui-hrd-records">
          <div className="offui-hrd-section-header">
            <h2 className="offui-hrd-section-title">Offboarding Records</h2>
          </div>
          <HrTeamTable
            members={members}
            loading={loading}
            error={error}
            pageSize={4}
            onViewRecord={handleViewTasks}
          />
        </div>
      </div>
    </section>
  );
};

export default DepartmentDashboard;