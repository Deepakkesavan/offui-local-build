import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import OffuiCards from '../../components/Cards/offuiCards';
import OffuiForms from '../../components/StepperForm/offuiForms';
import processTimelineData, {
  type TimelineItem,
} from '../../components/ProcessTimeline/processTimelineData';
import type { FormField } from '../../components/StepperForm/offuiFormData';
import './EmployeeRecord.css';

// ── Types ──────────────────────────────────────────────────────────
interface SubmissionInfo {
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
  resignationDate: string | null;
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
  return isNaN(d.getTime())
    ? iso
    : `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
};

/** Maps raw backend action codes to readable labels */
const formatAction = (action: string | null | undefined): string => {
  if (!action) return 'Resignation submitted via offboarding portal';
  const map: Record<string, string> = {
    record_created:   'Resignation submitted via offboarding portal',
    exit_interview:   'Exit interview completed',
    manager_approved: 'Approved by reporting manager',
    hr_initiation:    'HR initiation in progress',
  };
  return map[action] ?? action;
};

// ── Component ──────────────────────────────────────────────────────
const EmployeeRecord = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate  = useNavigate();

  const [member,       setMember]       = useState<TeamMember | null>(null);
  const [submission,   setSubmission]   = useState<SubmissionInfo | null>(null);
  const [approval,     setApproval]     = useState<ApprovalInfo | null>(null);
  const [managerInfo,  setManagerInfo]  = useState<{ empId: string; fullName: string } | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [timeline,     setTimeline]     = useState<TimelineItem[]>(processTimelineData);
  const [loading,      setLoading]      = useState(true);
  const [approveError, setApproveError] = useState('');

  useEffect(() => {
    if (!empId) return;

    // 1. Fetch manager info + locate the team member
    axiosInstance
      .get(MANAGER_INFO_URL)
      .then((res) => {
        const mgr = res.data;
        setManagerInfo({ empId: mgr.empId, fullName: mgr.fullName });

        const found: TeamMember | undefined = mgr.totalMembers?.find(
          (m: TeamMember) => m.empId === empId
        );
        if (found) setMember(found);
      })
      .catch(console.error);

    // 2. Fetch submission — returns submissionLogId from the updated backend
    axiosInstance
      .get<SubmissionInfo>(`${BASE_URL}/api/submission/getsubmit?employeeId=${empId}`)
      .then((r) => {
        setSubmission(r.data);

        // 3. If submitted, check approval status using the logId
        const logId = r.data.submissionLogId;
        if (r.data.isSubmitted && logId) {
          axiosInstance
            .get<ApprovalInfo>(`${BASE_URL}/api/GetApproveOffboarding/${logId}`)
            .then((ar) => {
              setApproval(ar.data);
              if (ar.data.isApproved) {
                setTimeline((prev) =>
                  prev.map((item, idx) =>
                    idx === 0 ? { ...item, status: 'completed' } : item
                  )
                );
              }
            })
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [empId]);

  // ── Approve handler ────────────────────────────────────────────
  const handleApprove = async (formData: Record<string, string>) => {
    if (!member || !managerInfo) return;

    const submissionLogId = submission?.submissionLogId;
    if (!submissionLogId) {
      setApproveError('Cannot approve: no resignation submission found for this employee.');
      return;
    }

    setSubmitting(true);
    setApproveError('');

    try {
      const payload = {
        submissionLogId,
        employeeId:       member.empId,
        managerEmpId:     managerInfo.empId,
        managerName:      managerInfo.fullName,
        managerComments:  formData.managerComments?.trim() || null,
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
        setTimeline((prev) =>
          prev.map((item, idx) =>
            idx === 0 ? { ...item, status: 'completed' } : item
          )
        );
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosErr.response?.status === 409) {
        setApproveError('This resignation has already been approved.');
        if (submission?.submissionLogId) {
          axiosInstance
            .get<ApprovalInfo>(
              `${BASE_URL}/api/GetApproveOffboarding/${submission.submissionLogId}`
            )
            .then((r) => setApproval(r.data))
            .catch(console.error);
        }
      } else {
        setApproveError(
          axiosErr.response?.data?.message ?? 'Approval failed. Please try again.'
        );
      }
      console.error('Approval failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="offui-er-loading">Loading employee record…</div>;
  if (!member) return <div className="offui-er-loading">Employee not found.</div>;

  const alreadyApproved = approval?.isApproved === true;

  // ── Form fields ────────────────────────────────────────────────
  // fullWidth is set explicitly per field so the grid looks correct:
  //   Row 1: Employee Name | Employee ID
  //   Row 2: Department    | Resignation Date
  //   Row 3: Last Working Day (half) | [empty half]
  //   Row 4: Reason for Leaving      (full — textarea)
  //   Row 5: Manager's Comments      (full — textarea)
  const formFields: FormField[] = [
    {
      name:      'employeeName',
      label:     'Employee Name',
      type:      'text',
      value:     member.fullName,
      fullWidth: false,
    },
    {
      name:      'employeeId',
      label:     'Employee ID',
      type:      'text',
      value:     member.empId,
      fullWidth: false,
    },
    {
      name:      'department',
      label:     'Department / Project',
      type:      'text',
      value:     member.project ?? '—',
      fullWidth: false,
    },
    {
      name:      'resignationDate',
      label:     'Resignation Date',
      type:      'text',
      value:     formatDate(member.resignationDate),
      fullWidth: false,
    },
    {
      name:      'lastWorkingDay',
      label:     'Last Working Day',
      type:      'text',
      value:     '—',
      fullWidth: false,   // ← explicit false keeps it half-width
    },
    {
      name:      'reasonForLeaving',
      label:     'Reason for Leaving',
      type:      'textarea',
      // Human-readable label instead of raw action code
      value:     formatAction(submission?.action),
      fullWidth: true,
    },
    {
      name:        'managerComments',
      label:       "Manager's Final Comments",
      type:        'textarea',
      placeholder: 'Enter any final notes regarding this offboarding request…',
      fullWidth:   true,
      // When approved: pass the saved comments as value → triggers the readOnly guard
      // When pending:  leave value undefined → field stays editable
      value: alreadyApproved
        ? (approval?.data?.managerComments ?? '(No comments provided)')
        : undefined,
    },
  ];

  return (
    <section className="offui-er">

      {/* Left — Process Timeline */}
      <div className="offui-er-left">
        <button className="offui-er-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <ProcessTimeline items={timeline} />
      </div>

      {/* Right */}
      <div className="offui-er-right">

        {/* Form */}
        <OffuiForms
          title="Employee Details Review"
          subtitle={
            alreadyApproved
              ? 'This offboarding has been approved. All fields are locked.'
              : 'Verify the core information and provide your final approval comments.'
          }
          submitLabel={
            alreadyApproved
              ? 'Approved ✓'
              : submitting
              ? 'Approving…'
              : '✓ Approve Offboarding'
          }
          fields={formFields}
          onSubmit={alreadyApproved ? () => {} : handleApprove}
          submitDisabled={alreadyApproved || submitting}
        />

        {/* Approval error banner */}
        {approveError && (
          <div className="offui-er-alert">
            <span className="offui-er-alert-icon">⚠</span>
            <div>
              <p className="offui-er-alert-title">Approval Error</p>
              <p className="offui-er-alert-body">{approveError}</p>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="offui-er-info-cards">
          <OffuiCards title="Notice Period"    value="30 Days"  subtitle="Standard policy" />
          <OffuiCards title="Vacation Balance" value="8.5 Days" subtitle="To be encashed" />
        </div>

        {/* Approved confirmation */}
        {alreadyApproved && (
          <div className="offui-er-approved-card">
            <span className="offui-er-approved-icon">✓</span>
            <div>
              <p className="offui-er-approved-title">You have approved this offboarding</p>
              <p className="offui-er-approved-sub">
                Approved on {formatDate(approval?.data?.approvedAt ?? null)} · Waiting for HR Initiation
              </p>
            </div>
          </div>
        )}

        {/* Clarify — only before approval */}
        {!alreadyApproved && (
          <div className="offui-er-actions">
            <button className="offui-er-clarify-btn" onClick={() => navigate(-1)}>
              ✉ Request Clarification
            </button>
          </div>
        )}

        {/* Access alert */}
        <div className="offui-er-alert">
          <span className="offui-er-alert-icon">⚠</span>
          <div>
            <p className="offui-er-alert-title">High Priority Access Alert</p>
            <p className="offui-er-alert-body">
              {member.fullName} currently has system access that requires manual
              decommissioning by the IT department before final sign-off.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default EmployeeRecord;