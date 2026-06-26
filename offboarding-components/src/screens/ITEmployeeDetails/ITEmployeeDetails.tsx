// src/screens/ITEmployeeDetails/ITEmployeeDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import defaultTimelineData, { type TimelineItem } from '../../components/ProcessTimeline/processTimelineData';
import type { SubmissionLogEntry, ManagerApprovalRecord } from '../../types/hr';
import type { ItClearanceInfo, RevocationStatus } from '../../types/it';
import { createApiClient } from '../../utils/apiClient';
import { formatDateMDY, getInitials } from '../../utils';
import { getStageLabel, buildHrTimeline } from '../../utils/hr';
import { IT_DESIGNATIONS } from '../../utils/itAuth';
import { API_ENDPOINTS } from '../../config/api';
import './ITEmployeeDetails.css';

const api = createApiClient('it');

// ── Placeholder IT identity ───────────────────────────────────────
// Replace with JWT-decoded identity once IT auth is fully integrated.
const CURRENT_IT_USER = { empId: '1180', fullName: 'IT Administrator' };

// ── Asset checklist config ────────────────────────────────────────
const ASSET_CHECKLIST = [
  { key: 'corporateLaptop' as const, label: 'Corporate Laptop',  sublabel: 'MacBook Pro 16" (Serial: 9431-A)' },
  { key: 'mobileDevice'   as const, label: 'Mobile Device',      sublabel: 'iPhone 14 Pro (Serial: 4420-X)' },
  { key: 'securityBadge'  as const, label: 'Security Badge',     sublabel: 'Active Access Card (ID: 1022)' },
  { key: 'accessCards'    as const, label: 'Access Cards',       sublabel: 'Parking & Storage Room Keys' },
] as const;

// ── Access revocation config ──────────────────────────────────────
const REVOCATION_ITEMS = [
  { key: 'corporateEmail' as const, label: 'Corporate Email (G-Suite)',        defaultStatus: 'suspended' as RevocationStatus },
  { key: 'cloudInfra'     as const, label: 'Cloud Infrastructure (AWS)',       defaultStatus: 'pending'   as RevocationStatus },
  { key: 'vpnAccess'      as const, label: 'Internal VPN Access',              defaultStatus: 'revoked'   as RevocationStatus },
  { key: 'internalTools'  as const, label: 'Internal Tools (Jira/Confluence)', defaultStatus: 'pending'   as RevocationStatus },
] as const;

type AssetKey      = typeof ASSET_CHECKLIST[number]['key'];
type RevocationKey = typeof REVOCATION_ITEMS[number]['key'];

// ── Access denied ─────────────────────────────────────────────────
const ItAccessDenied = ({ desg }: { desg: string | null }) => (
  <section className="offui-itd">
    <div className="offui-itd-left" />
    <div className="offui-itd-right">
      <div style={{ background: '#fff5f5', border: '1.5px solid #fca5a5', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>Access Restricted</p>
        <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6' }}>
          This screen is only available to IT staff.
          {desg && <> Your current designation (<strong>{desg}</strong>) does not have access.</>}
        </p>
        <p style={{ margin: '8px 0 0', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#98a2b3', letterSpacing: '0.04em' }}>
          AUTHORISED DESIGNATIONS: {IT_DESIGNATIONS.join(' · ')}
        </p>
      </div>
    </div>
  </section>
);

// ── Badge component ───────────────────────────────────────────────
const RevocationBadge = ({ status }: { status: string }) => (
  <span className={`offui-itd-status-badge offui-itd-status-badge--${status}`}>
    {status}
  </span>
);

// ── Main component ────────────────────────────────────────────────
const ITEmployeeDetails = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate  = useNavigate();

  // ── Access check ─────────────────────────────────────────────
  const [accessLoading, setAccessLoading] = useState(true);
  const [authorized,    setAuthorized]    = useState(false);
  const [userDesg,      setUserDesg]      = useState<string | null>(null);

  useEffect(() => {
    api.get(API_ENDPOINTS.emsData)
      .then((res) => {
        const raw  = res.data;
        const data = Array.isArray(raw) ? raw[0] : raw;
        const desg: string | null = data?.desg ?? null;
        setUserDesg(desg);
        setAuthorized(IT_DESIGNATIONS.includes(desg ?? ''));
      })
      .catch(() => setAuthorized(false))
      .finally(() => setAccessLoading(false));
  }, []);

  // ── Data ─────────────────────────────────────────────────────
  const [logs,        setLogs]        = useState<SubmissionLogEntry[]>([]);
  const [approvals,   setApprovals]   = useState<ManagerApprovalRecord[]>([]);
  const [itClearance, setItClearance] = useState<ItClearanceInfo | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // ── HR initiation state ───────────────────────────────────────
  const [isHrInitiated, setIsHrInitiated] = useState(false);
  const [hrInitiatedAt, setHrInitiatedAt] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────
  const [assetChecked, setAssetChecked] = useState<Record<AssetKey, boolean>>({
    corporateLaptop: false,
    mobileDevice:    false,
    securityBadge:   false,
    accessCards:     false,
  });

  const [revocationStatus, setRevocationStatus] = useState<Record<RevocationKey, RevocationStatus>>(
    Object.fromEntries(REVOCATION_ITEMS.map((r) => [r.key, r.defaultStatus])) as Record<RevocationKey, RevocationStatus>
  );

  const [deviceSerial,   setDeviceSerial]   = useState('');
  const [secondaryNotes, setSecondaryNotes] = useState('');
  const [itComments,     setItComments]     = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [actionError,    setActionError]    = useState('');

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
      .catch(() => setError("Could not load this employee's offboarding record. Please try again."))
      .finally(() => setLoading(false));
  }, [empId, authorized]);

  // ── Latest submission log for this employee ───────────────────
  const employeeLogs = logs
    .filter((l) => l.employeeId === empId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestLog = employeeLogs[0] ?? null;

  // ── Manager approval ──────────────────────────────────────────
  const approval = approvals.find((a) => a.employeeId === empId && a.isActive) ?? null;

  // ── Fetch HR initiation + IT clearance once log is known ──────
  useEffect(() => {
    if (!latestLog || !authorized) return;

    // FIX: fetch real HR initiation data instead of guessing from stageAfter
    api
      .get(API_ENDPOINTS.getHrInitiation(latestLog.id))
      .then((res) => {
        if (res.data.isInitiated) {
          setIsHrInitiated(true);
          setHrInitiatedAt(res.data.data?.initiatedAt ?? null);
        }
      })
      .catch((err) => console.error('Failed to check HR initiation status:', err));

    api
      .get<ItClearanceInfo>(API_ENDPOINTS.getItClearance(latestLog.id))
      .then((res) => {
        setItClearance(res.data);
        // Pre-fill form if already cleared
        if (res.data.isCleared && res.data.data) {
          const d = res.data.data;
          setAssetChecked({
            corporateLaptop: d.corporateLaptopReturned,
            mobileDevice:    d.mobileDeviceReturned,
            securityBadge:   d.securityBadgeReturned,
            accessCards:     d.accessCardsReturned,
          });
          setRevocationStatus({
            corporateEmail: (d.corporateEmailStatus as RevocationStatus) ?? 'pending',
            cloudInfra:     (d.cloudInfraStatus     as RevocationStatus) ?? 'pending',
            vpnAccess:      (d.vpnAccessStatus      as RevocationStatus) ?? 'pending',
            internalTools:  (d.internalToolsStatus  as RevocationStatus) ?? 'pending',
          });
          setDeviceSerial(d.deviceSerialNumber ?? '');
          setSecondaryNotes(d.secondaryAssetNotes ?? '');
          setItComments(d.itComments ?? '');
        }
      })
      .catch((err) => console.error('Failed to check IT clearance status:', err));
  }, [latestLog?.id, authorized]);

  const fullName   = latestLog?.employeeName ?? approval?.employeeName ?? empId ?? '';
  const isItCleared = itClearance?.isCleared === true;

  // ── Timeline ─────────────────────────────────────────────────
  // FIX: pass isItCleared + itClearedAt so item[3] advances to "completed"
  // after submit, and item[4] moves to "in-progress".
  const timeline: TimelineItem[] = latestLog
    ? buildHrTimeline(
        true,
        latestLog.createdAt,
        approval !== null,
        approval?.approvedAt ?? null,
        isHrInitiated,
        hrInitiatedAt,
        isItCleared,
        itClearance?.data?.clearedAt ?? null,
      )
    : defaultTimelineData;

  // ── IT Clearance submit ────────────────────────────────────────
  const handleApproveClearance = async () => {
    if (!latestLog || !empId) return;

    setSubmitting(true);
    setActionError('');

    try {
      const payload = {
        submissionLogId: latestLog.id,
        employeeId:      empId,
        itEmpId:         CURRENT_IT_USER.empId,
        itName:          CURRENT_IT_USER.fullName,

        corporateLaptopReturned: assetChecked.corporateLaptop,
        mobileDeviceReturned:    assetChecked.mobileDevice,
        securityBadgeReturned:   assetChecked.securityBadge,
        accessCardsReturned:     assetChecked.accessCards,

        corporateEmailStatus: revocationStatus.corporateEmail,
        cloudInfraStatus:     revocationStatus.cloudInfra,
        vpnAccessStatus:      revocationStatus.vpnAccess,
        internalToolsStatus:  revocationStatus.internalTools,

        deviceSerialNumber:  deviceSerial.trim() || null,
        secondaryAssetNotes: secondaryNotes.trim() || null,
        itComments:          itComments.trim() || null,

        employeeName: fullName,
        designation:  approval?.designation ?? null,
        department:   approval?.department ?? null,
      };

      const res = await api.post(API_ENDPOINTS.itClearance, payload);

      if (res.status === 201) {
        // FIX: store the full response so clearedAt is available for the timeline subtitle
        setItClearance({ isCleared: true, data: res.data });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosErr.response?.status === 409) {
        setActionError(axiosErr.response.data?.message ?? 'IT clearance has already been recorded.');
        if (latestLog) {
          api.get<ItClearanceInfo>(API_ENDPOINTS.getItClearance(latestLog.id))
            .then((r) => setItClearance(r.data))
            .catch(console.error);
        }
      } else {
        setActionError(axiosErr.response?.data?.message ?? 'IT clearance submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle asset checkbox (only when not already cleared) ─────
  const toggleAsset = (key: AssetKey) => {
    if (isItCleared) return;
    setAssetChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Access states ─────────────────────────────────────────────
  if (accessLoading) return <div className="offui-itd-loading">Verifying access…</div>;
  if (!authorized)   return <ItAccessDenied desg={userDesg} />;
  if (loading)       return <div className="offui-itd-loading">Loading employee record…</div>;
  if (error)         return <div className="offui-itd-loading">{error}</div>;
  if (!latestLog)    return <div className="offui-itd-loading">No offboarding record found for this employee.</div>;

  const isBlocked = !isHrInitiated;

  return (
    <section className="offui-itd">

      {/* Left — Timeline */}
      <div className="offui-itd-left">
        <button className="offui-itd-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <ProcessTimeline items={timeline} />
      </div>

      {/* Right */}
      <div className="offui-itd-right">

        {/* Header card */}
        <div className="offui-itd-header-card">
          <div className="offui-itd-avatar">{getInitials(fullName)}</div>
          <div>
            <h2 className="offui-itd-header-name">{fullName}</h2>
            <p className="offui-itd-header-sub">
              {empId}{approval?.designation ? ` · ${approval.designation}` : ''}
            </p>
          </div>
          <span className="offui-itd-header-badge">{getStageLabel(latestLog.stageAfter)}</span>
        </div>

        {/* ── IT Asset Checklist ──────────────────────────────── */}
        <div className="offui-itd-card">
          <h3 className="offui-itd-card-title">
            <span className="offui-itd-card-title-icon">☑</span>
            IT Asset Checklist
          </h3>
          <div className="offui-itd-checklist-grid">
            {ASSET_CHECKLIST.map((item) => {
              const checked = assetChecked[item.key];
              return (
                <div
                  key={item.key}
                  className={`offui-itd-checklist-item ${checked ? 'checked' : ''} ${isItCleared ? 'disabled' : ''}`}
                  onClick={() => toggleAsset(item.key)}
                >
                  <div className={`offui-itd-checkbox ${checked ? 'checked' : ''}`}>
                    {checked && <span className="offui-itd-checkbox-tick">✓</span>}
                  </div>
                  <div>
                    <p className="offui-itd-checklist-label">{item.label}</p>
                    <p className="offui-itd-checklist-sublabel">{item.sublabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-column row: Access Revocation + Asset Verification */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* ── Access Revocation ─────────────────────────────── */}
          <div className="offui-itd-card">
            <h3 className="offui-itd-card-title">
              <span className="offui-itd-card-title-icon">🔒</span>
              Access Revocation
            </h3>
            <div className="offui-itd-revocation-list">
              {REVOCATION_ITEMS.map((item) => (
                <div key={item.key} className="offui-itd-revocation-row">
                  <span className="offui-itd-revocation-label">{item.label}</span>
                  {isItCleared ? (
                    <RevocationBadge status={revocationStatus[item.key]} />
                  ) : (
                    <select
                      className="offui-itd-revocation-select"
                      value={revocationStatus[item.key]}
                      onChange={(e) =>
                        setRevocationStatus((prev) => ({
                          ...prev,
                          [item.key]: e.target.value as RevocationStatus,
                        }))
                      }
                      disabled={isBlocked}
                    >
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Asset Verification ───────────────────────────── */}
          <div className="offui-itd-card">
            <h3 className="offui-itd-card-title">
              <span className="offui-itd-card-title-icon">🖥</span>
              Asset Verification
            </h3>
            <div className="offui-itd-asset-grid">
              <div className="offui-itd-field offui-itd-field--full">
                <label>Device Serial Number</label>
                <input
                  type="text"
                  placeholder="Enter verified serial number…"
                  value={deviceSerial}
                  onChange={(e) => setDeviceSerial(e.target.value)}
                  disabled={isItCleared || isBlocked}
                />
              </div>
              <div className="offui-itd-field offui-itd-field--full">
                <label>Secondary Asset Notes</label>
                <textarea
                  placeholder="e.g., adapters, cases, peripherals…"
                  value={secondaryNotes}
                  onChange={(e) => setSecondaryNotes(e.target.value)}
                  disabled={isItCleared || isBlocked}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── IT Final Comments ──────────────────────────────────── */}
        <div className="offui-itd-card">
          <h3 className="offui-itd-card-title">IT Final Comments</h3>
          <div className="offui-itd-field">
            <label>Internal Audit Notes</label>
            <textarea
              className="offui-itd-comments-textarea"
              placeholder="Enter specific notes regarding hardware condition or data transfer exceptions…"
              value={itComments}
              onChange={(e) => setItComments(e.target.value)}
              disabled={isItCleared || isBlocked}
            />
          </div>
        </div>

        {/* ── Status / Action area ──────────────────────────────── */}
        {isItCleared ? (
          <div className="offui-itd-done-card">
            <span className="offui-itd-done-icon">✓</span>
            <div>
              <p className="offui-itd-done-title">IT clearance approved</p>
              <p className="offui-itd-done-sub">
                Cleared on {formatDateMDY(itClearance?.data?.clearedAt ?? null)} by {itClearance?.data?.itName ?? itClearance?.data?.itEmpId} · Waiting for further approvals
              </p>
            </div>
          </div>
        ) : isBlocked ? (
          <div className="offui-itd-blocked">
            <span className="offui-itd-blocked-icon">⚠</span>
            <div>
              <p className="offui-itd-blocked-title">Awaiting HR Initiation</p>
              <p className="offui-itd-blocked-body">
                IT clearance becomes available once the HR team has initiated the offboarding process.
              </p>
            </div>
          </div>
        ) : (
          <div className="offui-itd-actions">
            <button className="offui-itd-clarify-btn" onClick={() => navigate(-1)}>
              ✉ Request Clarification
            </button>
            <button
              className="offui-itd-approve-btn"
              onClick={handleApproveClearance}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : '✓ Approve IT Clearance'}
            </button>
          </div>
        )}

        {actionError && (
          <div className="offui-itd-error">
            <span className="offui-itd-blocked-icon">⚠</span>
            <div>
              <p className="offui-itd-error-title">Action Error</p>
              <p className="offui-itd-error-body">{actionError}</p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default ITEmployeeDetails;