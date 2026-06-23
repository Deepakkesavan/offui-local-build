// src/screens/HREmployeeDetails/HREmployeeDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import OffuiCards from '../../components/Cards/offuiCards';
import defaultTimelineData, { type TimelineItem } from '../../components/ProcessTimeline/processTimelineData';
import type {
  SubmissionLogEntry,
  ManagerApprovalRecord,
  HrInitiationInfo,
} from '../../types/hr';
import { createApiClient } from '../../utils/apiClient';
import { formatDateMDY, getInitials, toInputDate } from '../../utils';
import { getStageLabel, buildHrTimeline } from '../../utils/hr';
import { useHrAccess, HR_DESIGNATIONS } from '../../utils/hrAuth';
import { API_ENDPOINTS } from '../../config/api';
import './HREmployeeDetails.css';

const api = createApiClient('hr');

const CURRENT_HR_USER = { empId: '1081', fullName: 'HR Administrator' };

// ── Helpers ────────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD string that is `days` days after the given ISO date. */
const addDays = (iso: string | null | undefined, days: number): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// ── Access-denied state ───────────────────────────────────────────
const HrAccessDenied = ({ desg }: { desg: string | null }) => (
  <section className="offui-hed">
    <div className="offui-hed-left" />
    <div className="offui-hed-right">
      <div style={{
        background: '#fff5f5',
        border: '1.5px solid #fca5a5',
        borderRadius: '8px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
          Access Restricted
        </p>
        <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' }}>
          This screen is only available to HR staff.
          {desg && <> Your current designation (<strong>{desg}</strong>) does not have access.</>}
        </p>
        <p style={{ margin: '8px 0 0', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#98a2b3', letterSpacing: '0.04em' }}>
          AUTHORISED DESIGNATIONS: {HR_DESIGNATIONS.join(' · ')}
        </p>
      </div>
    </div>
  </section>
);

// ── Main component ────────────────────────────────────────────────
const HREmployeeDetails = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate  = useNavigate();

  const { loading: accessLoading, authorized, userDesg } = useHrAccess();

  const [logs,         setLogs]         = useState<SubmissionLogEntry[]>([]);
  const [approvals,    setApprovals]    = useState<ManagerApprovalRecord[]>([]);
  const [hrInitiation, setHrInitiation] = useState<HrInitiationInfo | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [comments,      setComments]      = useState('');
  // Last working day — editable by HR, pre-filled to resignation + 90 days
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [actionError,   setActionError]   = useState('');

  useEffect(() => {
    if (!empId || !authorized) return;

    Promise.all([
      api.get<SubmissionLogEntry[]>(API_ENDPOINTS.allSubmissionLogs),
      api.get<ManagerApprovalRecord[]>(API_ENDPOINTS.allManagerApprovals),
    ])
      .then(([logsRes, approvalsRes]) => {
        setLogs(logsRes.data ?? []);
        setApprovals(approvalsRes.data ?? []);
      })
      .catch((err) => {
        console.error('Failed to load HR employee details:', err);
        setError("Could not load this employee's offboarding record. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [empId, authorized]);

  // ── Latest submission log for this employee ──────────────────
  const employeeLogs = logs
    .filter((l) => l.employeeId === empId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestLog = employeeLogs[0] ?? null;

  // ── Manager approval ─────────────────────────────────────────
  const approval = approvals.find((a) => a.employeeId === empId && a.isActive) ?? null;

  // ── Pre-fill last working day once we have the submission log ─
  // Priority: manager-set LWD (if any) → resignation date + 90 days → submission date + 90 days
  useEffect(() => {
    if (!latestLog) return;

    const managerLwd = approval?.lastWorkingDay
      ? toInputDate(approval.lastWorkingDay)
      : '';

    const calculated = managerLwd
      || addDays(approval?.resignationDate ?? latestLog.createdAt, 90);

    setLastWorkingDay(calculated);
  }, [latestLog?.id, approval?.lastWorkingDay, approval?.resignationDate]);

  // ── HR initiation check ───────────────────────────────────────
  useEffect(() => {
    if (!latestLog || !authorized) return;

    api
      .get<HrInitiationInfo>(API_ENDPOINTS.getHrInitiation(latestLog.id))
      .then((res) => {
        setHrInitiation(res.data);
        // If already initiated, show the stored LWD
        if (res.data.isInitiated && res.data.data?.lastWorkingDay) {
          setLastWorkingDay(toInputDate(res.data.data.lastWorkingDay));
        }
      })
      .catch((err) => console.error('Failed to check HR initiation status:', err));
  }, [latestLog?.id, authorized]);

  const isManagerApproved =
    latestLog?.stageAfter === 'manager_approved' ||
    latestLog?.stageAfter === 'hr_initiation'    ||
    approval !== null;
  const isHrInitiated = hrInitiation?.isInitiated === true;

  const fullName = latestLog?.employeeName ?? approval?.employeeName ?? empId ?? '';

  const timeline: TimelineItem[] = latestLog
    ? buildHrTimeline(
        true,
        latestLog.createdAt,
        approval !== null,
        approval?.approvedAt ?? null,
        isHrInitiated,
        hrInitiation?.data?.initiatedAt ?? null,
      )
    : defaultTimelineData;

  // ── Initiate handler ─────────────────────────────────────────
  const handleInitiate = async () => {
    if (!latestLog || !empId) return;

    setSubmitting(true);
    setActionError('');

    try {
      const payload = {
        submissionLogId: latestLog.id,
        employeeId:      empId,
        hrEmpId:         CURRENT_HR_USER.empId,
        hrName:          CURRENT_HR_USER.fullName,
        hrComments:      comments.trim() || null,
        employeeName:    fullName,
        designation:     approval?.designation ?? null,
        department:      approval?.department ?? null,
        // Send the HR-confirmed last working day (may have been edited)
        lastWorkingDay:  lastWorkingDay ? new Date(lastWorkingDay) : null,
      };

      const res = await api.post(API_ENDPOINTS.hrInitiation, payload);

      if (res.status === 201) {
        setHrInitiation({ isInitiated: true, data: res.data });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosErr.response?.status === 409) {
        setActionError(axiosErr.response.data?.message ?? 'This step has already been completed.');
        if (latestLog) {
          api
            .get<HrInitiationInfo>(API_ENDPOINTS.getHrInitiation(latestLog.id))
            .then((r) => setHrInitiation(r.data))
            .catch(console.error);
        }
      } else {
        setActionError(axiosErr.response?.data?.message ?? 'Initiation failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Access check rendering ────────────────────────────────────
  if (accessLoading) return <div className="offui-hed-loading">Verifying access…</div>;
  if (!authorized)   return <HrAccessDenied desg={userDesg} />;
  if (loading)       return <div className="offui-hed-loading">Loading employee record…</div>;
  if (error)         return <div className="offui-hed-loading">{error}</div>;
  if (!latestLog)    return <div className="offui-hed-loading">No offboarding record found for this employee.</div>;

  // Displayed resignation date: prefer manager-recorded, fall back to submission timestamp
  const resignationDateDisplay = formatDateMDY(
    approval?.resignationDate ?? latestLog.createdAt
  );

  return (
    <section className="offui-hed">
      {/* Left — Process Timeline */}
      <div className="offui-hed-left">
        <button className="offui-hed-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <ProcessTimeline items={timeline} />
      </div>

      {/* Right */}
      <div className="offui-hed-right">

        {/* Header */}
        <div className="offui-hed-header-card">
          <div className="offui-hed-avatar">{getInitials(fullName)}</div>
          <div>
            <h2 className="offui-hed-name">{fullName}</h2>
            <p className="offui-hed-sub">
              {empId}{approval?.designation ? ` · ${approval.designation}` : ''}
            </p>
          </div>
          <span className="offui-hed-stage-badge">{getStageLabel(latestLog.stageAfter)}</span>
        </div>

        {/* Info cards */}
        <div className="offui-hed-info-cards">
          <OffuiCards
            title="Last Working Day"
            value={
              isHrInitiated && hrInitiation?.data?.lastWorkingDay
                ? formatDateMDY(hrInitiation.data.lastWorkingDay)
                : lastWorkingDay
                  ? formatDateMDY(lastWorkingDay)
                  : '—'
            }
            subtitle={
              isHrInitiated
                ? 'Confirmed by HR'
                : 'Calculated · 90 days from resignation'
            }
          />
          <OffuiCards
            title="Manager Approval"
            value={approval ? 'Approved' : 'Pending'}
            subtitle={
              approval
                ? `By ${approval.managerName ?? approval.managerEmpId}`
                : 'Awaiting manager sign-off'
            }
          />
        </div>

        {/* Snapshot */}
        <div className="offui-hed-snapshot">
          <h2>Offboarding Snapshot</h2>
          <div className="offui-hed-grid">
            <div className="offui-hed-field">
              <label>Employee ID</label>
              <input type="text" value={empId ?? ''} disabled />
            </div>
            <div className="offui-hed-field">
              <label>Department / Project</label>
              <input type="text" value={approval?.department ?? '—'} disabled />
            </div>
            <div className="offui-hed-field">
              <label>Resignation Date</label>
              <input type="text" value={resignationDateDisplay} disabled />
            </div>
            <div className="offui-hed-field">
              <label>Last Working Day</label>
              <input
                type="text"
                value={
                  isHrInitiated && hrInitiation?.data?.lastWorkingDay
                    ? formatDateMDY(hrInitiation.data.lastWorkingDay)
                    : lastWorkingDay
                      ? formatDateMDY(lastWorkingDay)
                      : '—'
                }
                disabled
              />
            </div>
            <div className="offui-hed-field offui-hed-field--full">
              <label>Manager's Comments</label>
              <textarea
                value={approval?.managerComments ?? '(No comments provided)'}
                disabled
              />
            </div>
          </div>
        </div>

        {/* HR Initiation action */}
        {isHrInitiated ? (
          <div className="offui-hed-done-card">
            <span className="offui-hed-done-icon">✓</span>
            <div>
              <p className="offui-hed-done-title">HR process initiated</p>
              <p className="offui-hed-done-sub">
                Initiated on{' '}
                {formatDateMDY(hrInitiation?.data?.initiatedAt ?? null)} by{' '}
                {hrInitiation?.data?.hrName ?? hrInitiation?.data?.hrEmpId} ·
                Last working day set to{' '}
                {hrInitiation?.data?.lastWorkingDay
                  ? formatDateMDY(hrInitiation.data.lastWorkingDay)
                  : '—'}
              </p>
            </div>
          </div>
        ) : !isManagerApproved ? (
          <div className="offui-hed-blocked">
            <span className="offui-hed-blocked-icon">⚠</span>
            <div>
              <p className="offui-hed-blocked-title">Awaiting Manager Approval</p>
              <p className="offui-hed-blocked-body">
                This offboarding hasn't been approved by the reporting manager yet.
                HR initiation becomes available once that approval is recorded.
              </p>
            </div>
          </div>
        ) : (
          <div className="offui-hed-action-card">
            <h2>Initiate HR Process</h2>
            <p>
              The reporting manager has approved this offboarding. Confirm the last
              working day, add any notes, and start the HR initiation stage.
            </p>

            {/* ── Last Working Day — editable by HR ── */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#667085',
              }}>
                Last Working Day
              </label>
              <input
                type="date"
                value={lastWorkingDay}
                onChange={(e) => setLastWorkingDay(e.target.value)}
                style={{
                  height: '44px',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0 12px',
                  border: '1px solid #cfd6dc',
                  borderRadius: '4px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#344054',
                  background: '#ffffff',
                  marginBottom: '4px',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#005a58')}
                onBlur={(e)  => (e.target.style.borderColor = '#cfd6dc')}
              />
              <p style={{
                margin: '4px 0 0',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#98a2b3',
              }}>
                Pre-filled as 90 days from resignation date. Adjust if needed.
              </p>
            </div>

            <textarea
              className="offui-hed-comments"
              placeholder="Optional notes for this initiation…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <button
              className="offui-hed-initiate-btn"
              onClick={handleInitiate}
              disabled={submitting || !lastWorkingDay}
            >
              {submitting ? 'Initiating…' : '✓ Initiate HR Process'}
            </button>
          </div>
        )}

        {actionError && (
          <div className="offui-hed-error">
            <span className="offui-hed-blocked-icon">⚠</span>
            <div>
              <p className="offui-hed-error-title">Action Error</p>
              <p className="offui-hed-error-body">{actionError}</p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default HREmployeeDetails;