import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import processTimelineData, {
  type TimelineItem,
} from '../../components/ProcessTimeline/processTimelineData';
import './EmployeeRecord.css';

// ── Types ──────────────────────────────────────────────────────────
interface SubmissionInfo {
  isSubmitted: boolean;
  employeeId: string | null;
  action: string | null;
  performedBy: string | null;
  stageBefore: string | null;
  stageAfter: string | null;
  time: string | null;
  date: string | null;
  submissionLogId?: string;
}

interface ApprovalInfo {
  isApproved: boolean;
  data?: {
    id: string;
    managerComments: string | null;
    approvedAt: string;
  };
}

interface TeamMember {
  empId: string;
  fullName: string;
  desg: string;
  project: string | null;
  grade: string | null;
  email: string | null;
  gender: string | null;
  doj: string | null;
  isOffboarding: boolean;
  submissionLogId: string | null;
  resignationDate: string | null;
  isManagerApproved: boolean;
}

// ── Config ─────────────────────────────────────────────────────────
const JWT_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZ3VzdGluamVuaWxyYWpwQGNsYXJpdW0udGVjaCIsImVtcElkIjoxMDgxLCJkZXNpZ25hdGlvbiI6IlRlY2huaWNhbCBMZWFkIiwiaWF0IjoxNzgxNTA5MTMzLCJleHAiOjE4ODE1MTI3MzN9.olD9wXz3AT4e38U8MwIai_cNHaKRHSgV83CRAr8HN1oyhpD7WyszZ3lmZgjMfjYUEf-hA8z7uSjPgFIT1X5G1w';
const BASE_URL         = 'http://localhost:5206';
const MANAGER_INFO_URL = `${BASE_URL}/api/managerinfo`;

const axiosInstance = axios.create({
  headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  withCredentials: true,
});

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
};

// ── Component ──────────────────────────────────────────────────────
const EmployeeRecord = () => {
  const { empId }  = useParams<{ empId: string }>();
  const navigate   = useNavigate();

  const [member,      setMember]      = useState<TeamMember | null>(null);
  const [submission,  setSubmission]  = useState<SubmissionInfo | null>(null);
  const [approval,    setApproval]    = useState<ApprovalInfo | null>(null);
  const [managerInfo, setManagerInfo] = useState<{ empId: string; fullName: string } | null>(null);
  const [comments,    setComments]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [timeline,    setTimeline]    = useState<TimelineItem[]>(processTimelineData);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!empId) return;

    // 1. Get team member + manager info
    axiosInstance.get(MANAGER_INFO_URL).then((res) => {
      const mgr = res.data;
      setManagerInfo({ empId: mgr.empId, fullName: mgr.fullName });

      const found: TeamMember = mgr.totalMembers?.find(
        (m: TeamMember) => m.empId === empId
      );
      if (!found) return;
      setMember(found);

      // 2. Get submission details
      if (found.submissionLogId) {
        // Get approval status
        axiosInstance
          .get<ApprovalInfo>(`${BASE_URL}/api/GetApproveOffboarding/${found.submissionLogId}`)
          .then((r) => {
            setApproval(r.data);
            if (r.data.isApproved) {
              setTimeline(processTimelineData);
            }
          })
          .catch(console.error);
      }

      // Get submission log details
      axiosInstance
        .get<SubmissionInfo>(`${BASE_URL}/api/submission/getsubmit?employeeId=${empId}`)
        .then((r) => setSubmission(r.data))
        .catch(console.error);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [empId]);

  const handleApprove = async () => {
    if (!member || !member.submissionLogId || !managerInfo) return;
    setSubmitting(true);

    try {
      const payload = {
        submissionLogId:  member.submissionLogId,
        employeeId:       member.empId,
        managerEmpId:     managerInfo.empId,
        managerName:      managerInfo.fullName,
        managerComments:  comments.trim() || null,
        employeeName:     member.fullName,
        designation:      member.desg,
        department:       member.project ?? null,
        resignationDate:  member.resignationDate ? new Date(member.resignationDate) : null,
        lastWorkingDay:   null,
        reasonForLeaving: null,
      };

      const res = await axiosInstance.post(`${BASE_URL}/api/ApproveOffboarding`, payload);

      if (res.status === 201) {
        setApproval({ isApproved: true, data: res.data });
        setTimeline(processTimelineData);
      }
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="offui-er-loading">Loading employee record…</div>;
  if (!member) return <div className="offui-er-loading">Employee not found.</div>;

  const alreadyApproved = approval?.isApproved === true;

  return (
    <section className="offui-er">

      {/* Left — Process Timeline */}
      <div className="offui-er-left">
        <button className="offui-er-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <ProcessTimeline items={timeline} />
      </div>

      {/* Right — Employee Details Review */}
      <div className="offui-er-right">

        <div className="offui-er-form-card">
          <h2 className="offui-er-form-title">Employee Details Review</h2>
          <p className="offui-er-form-subtitle">
            Verify the core information and provide your final approval comments.
          </p>

          <div className="offui-er-grid">
            {/* Row 1 */}
            <div className="offui-er-field">
              <label>Employee Name</label>
              <input type="text" value={member.fullName} disabled />
            </div>
            <div className="offui-er-field">
              <label>Employee ID</label>
              <input type="text" value={member.empId} disabled />
            </div>

            {/* Row 2 */}
            <div className="offui-er-field offui-er-field--full">
              <label>Department / Project</label>
              <input type="text" value={member.project ?? '—'} disabled />
            </div>

            {/* Row 3 */}
            <div className="offui-er-field">
              <label>Resignation Date</label>
              <input type="text" value={formatDate(member.resignationDate)} disabled />
            </div>
            <div className="offui-er-field">
              <label>Last Working Day</label>
              <input type="text" value="—" disabled />
            </div>

            {/* Row 4 */}
            <div className="offui-er-field offui-er-field--full">
              <label>Reason for Leaving</label>
              <textarea
                value={submission?.action ?? 'Resignation submitted via offboarding portal'}
                disabled
                rows={3}
              />
            </div>

            {/* Row 5 — Manager comments (editable unless already approved) */}
            <div className="offui-er-field offui-er-field--full">
              <label>Manager's Final Comments</label>
              {alreadyApproved ? (
                <textarea
                  value={approval?.data?.managerComments ?? '(No comments provided)'}
                  disabled
                  rows={4}
                />
              ) : (
                <textarea
                  placeholder="Enter any final notes regarding this offboarding request…"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              )}
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="offui-er-info-cards">
          <div className="offui-er-info-card">
            <div className="offui-er-info-icon offui-er-info-icon--teal">🗓</div>
            <div>
              <p className="offui-er-info-label">Notice Period</p>
              <p className="offui-er-info-value">30 Days</p>
              <p className="offui-er-info-sub">STANDARD POLICY</p>
            </div>
          </div>
          <div className="offui-er-info-card">
            <div className="offui-er-info-icon offui-er-info-icon--grey">✂</div>
            <div>
              <p className="offui-er-info-label">Vacation Balance</p>
              <p className="offui-er-info-value">8.5 Days</p>
              <p className="offui-er-info-sub">TO BE ENCASHED</p>
            </div>
          </div>
        </div>

        {/* Action area */}
        {alreadyApproved ? (
          <div className="offui-er-approved-card">
            <span className="offui-er-approved-icon">✓</span>
            <div>
              <p className="offui-er-approved-title">You have approved this offboarding</p>
              <p className="offui-er-approved-sub">
                Approved on {formatDate(approval?.data?.approvedAt ?? null)} · Waiting for HR Initiation
              </p>
            </div>
          </div>
        ) : (
          <div className="offui-er-actions">
            <button
              className="offui-er-approve-btn"
              onClick={handleApprove}
              disabled={submitting}
            >
              {submitting ? 'Approving…' : '✓ Approve Offboarding'}
            </button>
            <button
              className="offui-er-clarify-btn"
              onClick={() => navigate(-1)}
            >
              ✉ Request Clarification
            </button>
          </div>
        )}

        {/* High priority alert */}
        <div className="offui-er-alert">
          <span className="offui-er-alert-icon">⚠</span>
          <div>
            <p className="offui-er-alert-title">High Priority Access Alert</p>
            <p className="offui-er-alert-body">
              {member.fullName} currently has system access that requires manual decommissioning
              by the IT department before final sign-off.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default EmployeeRecord;