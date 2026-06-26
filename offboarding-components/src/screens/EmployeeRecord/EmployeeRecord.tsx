import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import OffuiCards from '../../components/Cards/offuiCards';
import OffuiForms from '../../components/StepperForm/offuiForms';
import defaultTimelineData, { type TimelineItem } from '../../components/ProcessTimeline/processTimelineData';
import type { FormField } from '../../components/StepperForm/offuiFormData';
import type { TeamMember, SubmissionInfo, ApprovalInfo } from '../../types';
import { createApiClient } from '../../utils/apiClient';
import { buildTimeline, formatDateMDY, formatAction } from '../../utils';
import { API_ENDPOINTS } from '../../config/api';
import './EmployeeRecord.css';

const api = createApiClient('manager');

const EmployeeRecord = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate  = useNavigate();

  const [member,        setMember]        = useState<TeamMember | null>(null);
  const [submission,    setSubmission]    = useState<SubmissionInfo | null>(null);
  const [approval,      setApproval]      = useState<ApprovalInfo | null>(null);
  const [managerInfo,   setManagerInfo]   = useState<{ empId: string; fullName: string } | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [timeline,      setTimeline]      = useState<TimelineItem[]>(defaultTimelineData);
  const [loading,       setLoading]       = useState(true);
  const [approveError,  setApproveError]  = useState('');

  const [isHrInitiated, setIsHrInitiated] = useState(false);
  const [hrInitiatedAt, setHrInitiatedAt] = useState<string | null>(null);
  const [isItCleared,   setIsItCleared]   = useState(false);
  const [itClearedAt,   setItClearedAt]   = useState<string | null>(null);

  // Rebuild timeline whenever any stage state changes
  useEffect(() => {
    setTimeline(
      buildTimeline(
        submission?.isSubmitted ?? false,
        submission?.date ?? null,
        approval?.isApproved ?? false,
        approval?.data?.approvedAt ?? null,
        isHrInitiated,
        hrInitiatedAt,
        isItCleared,
        itClearedAt,
      )
    );
  }, [submission, approval, isHrInitiated, hrInitiatedAt, isItCleared, itClearedAt]);

  useEffect(() => {
    if (!empId) return;

    // 1. Manager info + locate team member
    api
      .get(API_ENDPOINTS.managerInfo)
      .then((res) => {
        const mgr = res.data;
        setManagerInfo({ empId: mgr.empId, fullName: mgr.fullName });
        const found: TeamMember | undefined = mgr.totalMembers?.find(
          (m: TeamMember) => m.empId === empId
        );
        if (found) setMember(found);
      })
      .catch(console.error);

    // 2. Submission status → approval → HR initiation → IT clearance
    api
      .get<SubmissionInfo>(`${API_ENDPOINTS.getSubmit}?employeeId=${empId}`)
      .then((r) => {
        setSubmission(r.data);

        const logId = r.data.submissionLogId;
        if (!r.data.isSubmitted || !logId) return;

        // 3. Manager approval
        api
          .get<ApprovalInfo>(API_ENDPOINTS.getApproval(logId))
          .then((ar) => {
            setApproval(ar.data);

            // 4. HR initiation
            return api.get(API_ENDPOINTS.getHrInitiation(logId));
          })
          .then((hr) => {
            if (hr.data.isInitiated) {
              setIsHrInitiated(true);
              setHrInitiatedAt(hr.data.data?.initiatedAt ?? null);
            }

            // 5. IT clearance
            return api.get(API_ENDPOINTS.getItClearance(logId));
          })
          .then((it) => {
            if (it.data.isCleared) {
              setIsItCleared(true);
              setItClearedAt(it.data.data?.clearedAt ?? null);
            }
          })
          .catch(console.error);
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

      const res = await api.post(API_ENDPOINTS.approveOffboarding, payload);

      if (res.status === 201) {
        setApproval({ isApproved: true, data: res.data });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosErr.response?.status === 409) {
        setApproveError('This resignation has already been approved.');
        if (submission?.submissionLogId) {
          api
            .get<ApprovalInfo>(API_ENDPOINTS.getApproval(submission.submissionLogId))
            .then((r) => setApproval(r.data))
            .catch(console.error);
        }
      } else {
        setApproveError(
          axiosErr.response?.data?.message ?? 'Approval failed. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="offui-er-loading">Loading employee record…</div>;
  if (!member) return <div className="offui-er-loading">Employee not found.</div>;

  const alreadyApproved = approval?.isApproved === true;

  const formFields: FormField[] = [
    { name: 'employeeName',    label: 'Employee Name',           type: 'text',     value: member.fullName,                                     fullWidth: false },
    { name: 'employeeId',      label: 'Employee ID',             type: 'text',     value: member.empId,                                        fullWidth: false },
    { name: 'department',      label: 'Department / Project',    type: 'text',     value: member.project ?? '—',                               fullWidth: false },
    { name: 'resignationDate', label: 'Resignation Date',        type: 'text',     value: formatDateMDY(member.resignationDate),               fullWidth: false },
    { name: 'lastWorkingDay',  label: 'Last Working Day',        type: 'text',     value: '—',                                                 fullWidth: false },
    { name: 'reasonForLeaving',label: 'Reason for Leaving',      type: 'textarea', value: formatAction(submission?.action),                    fullWidth: true  },
    {
      name: 'managerComments',
      label: "Manager's Final Comments",
      type: 'textarea',
      placeholder: 'Enter any final notes regarding this offboarding request…',
      fullWidth: true,
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

        <OffuiForms
          title="Employee Details Review"
          subtitle={
            alreadyApproved
              ? 'This offboarding has been approved. All fields are locked.'
              : 'Verify the core information and provide your final approval comments.'
          }
          submitLabel={
            alreadyApproved ? 'Approved ✓' : submitting ? 'Approving…' : '✓ Approve Offboarding'
          }
          fields={formFields}
          onSubmit={alreadyApproved ? () => {} : handleApprove}
          submitDisabled={alreadyApproved || submitting}
        />

        {approveError && (
          <div className="offui-er-alert">
            <span className="offui-er-alert-icon">⚠</span>
            <div>
              <p className="offui-er-alert-title">Approval Error</p>
              <p className="offui-er-alert-body">{approveError}</p>
            </div>
          </div>
        )}

        <div className="offui-er-info-cards">
          <OffuiCards title="Notice Period"    value="30 Days"  subtitle="Standard policy" />
          <OffuiCards title="Vacation Balance" value="8.5 Days" subtitle="To be encashed" />
        </div>

        {alreadyApproved && (
          <div className="offui-er-approved-card">
            <span className="offui-er-approved-icon">✓</span>
            <div>
              <p className="offui-er-approved-title">You have approved this offboarding</p>
              <p className="offui-er-approved-sub">
                Approved on {formatDateMDY(approval?.data?.approvedAt ?? null)} · Waiting for HR Initiation
              </p>
            </div>
          </div>
        )}

        {!alreadyApproved && (
          <div className="offui-er-actions">
            <button className="offui-er-clarify-btn" onClick={() => navigate(-1)}>
              ✉ Request Clarification
            </button>
          </div>
        )}

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