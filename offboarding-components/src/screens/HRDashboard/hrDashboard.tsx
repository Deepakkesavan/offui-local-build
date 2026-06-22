// src/screens/HRDashboard/hrDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OffuiCards from '../../components/Cards/offuiCards';
import HrTeamTable from '../../components/HRTeamTable/hrTeamTable';
import type { SubmissionLogEntry, ManagerApprovalRecord, HrOffboardingMember } from '../../types/hr';
import { createApiClient } from '../../utils/apiClient';
import { buildActivityFeed, getStageLabel, isPreManagerApproval, isPendingHrApproval } from '../../utils/hr';
import { useHrAccess, HR_DESIGNATIONS } from '../../utils/hrAuth';
import { API_ENDPOINTS } from '../../config/api';
import './hrDashboard.css';

const api = createApiClient('hr');

// ── Access-denied state ───────────────────────────────────────────
// Shown when the logged-in user's designation is not in the HR allow-list.
// Deliberately minimal — no navigation hints, just a clear message.
const HrAccessDenied = ({ desg }: { desg: string | null }) => (
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
      <p style={{
        margin: 0,
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        fontWeight: 700,
        color: '#dc2626',
      }}>
        Access Restricted
      </p>
      <p style={{
        margin: 0,
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#7f1d1d',
        lineHeight: '1.6',
      }}>
        The HR Dashboard is only available to HR staff.
        {desg && (
          <>
            {' '}Your current designation (<strong>{desg}</strong>) does not have access to this screen.
          </>
        )}
      </p>
      <p style={{
        margin: '8px 0 0',
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: '12px',
        fontWeight: 600,
        color: '#98a2b3',
        letterSpacing: '0.04em',
      }}>
        AUTHORISED DESIGNATIONS: {HR_DESIGNATIONS.join(' · ')}
      </p>
    </div>
  </section>
);

// ── Main component ────────────────────────────────────────────────
const HRDashboard = () => {
  const navigate = useNavigate();

  // ── Access gate — must resolve before any data fetch ──────────
  const { loading: accessLoading, authorized, userDesg } = useHrAccess();

  const [logs,      setLogs]      = useState<SubmissionLogEntry[]>([]);
  const [approvals, setApprovals] = useState<ManagerApprovalRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Only load dashboard data once we know the user is authorised
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
        console.error('Failed to load HR dashboard data:', err);
        setError('Could not load offboarding records. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [authorized]);

  // ── Access check states ───────────────────────────────────────
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
    return <HrAccessDenied desg={userDesg} />;
  }

  // ── Derive: one row per employee, latest stage only ─────────────
  const latestByEmployee = new Map<string, SubmissionLogEntry>();
  for (const log of logs) {
    const existing = latestByEmployee.get(log.employeeId);
    if (!existing || new Date(log.createdAt) > new Date(existing.createdAt)) {
      latestByEmployee.set(log.employeeId, log);
    }
  }
  const latestEntries = Array.from(latestByEmployee.values());

  // ── Stat card counts ──────────────────────────────────────────
  const activeRequestsCount   = latestEntries.filter((e) => isPreManagerApproval(e.stageAfter)).length;
  const pendingApprovalsCount = latestEntries.filter((e) => isPendingHrApproval(e.stageAfter)).length;

  // ── Last working day lookup (from ManagerApproval table) ───────
  const lastWorkingDayByEmployee = new Map<string, string | null>();
  for (const approval of approvals) {
    if (approval.isActive) {
      lastWorkingDayByEmployee.set(approval.employeeId, approval.lastWorkingDay);
    }
  }

  // ── Offboarding Records table data ──────────────────────────────
  const members: HrOffboardingMember[] = latestEntries.map((entry) => ({
    empId:          entry.employeeId,
    fullName:       entry.employeeName ?? entry.employeeId,
    lastWorkingDay: lastWorkingDayByEmployee.get(entry.employeeId) ?? null,
    stage:          entry.stageAfter ?? 'exit_interview',
    stageLabel:     getStageLabel(entry.stageAfter),
  }));

  const activityFeed = buildActivityFeed(logs);

  const handleViewTasks = (member: HrOffboardingMember) => {
    navigate(`/HREmployeeDetails/${member.empId}`);
  };

  return (
    <section className="offui-hrd">
      {/* Row 1 — Stat cards */}
      <div className="offui-hrd-stats">
        <OffuiCards
          title="Active Requests"
          value={String(activeRequestsCount)}
          subtitle="Awaiting reporting manager approval"
        />
        <OffuiCards
          title="Pending Approvals"
          value={String(pendingApprovalsCount)}
          subtitle="Manager-approved, awaiting HR sign-off"
        />
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
            <button className="offui-hrd-view-all-btn" onClick={() => navigate('/HRActivity')}>
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

export default HRDashboard;