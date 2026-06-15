import { useEffect, useState } from 'react';
import axios from 'axios';
import OffuiCards from '../../components/Cards/offuiCards';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import OffuiForms from '../../components/StepperForm/offuiForms';
import OffuiIESubmitCard from '../../components/SubmitCard/offuiIESubmitCard';
import defaultTimelineData, { type TimelineItem } from '../../components/ProcessTimeline/processTimelineData';
import './userDashboard.css';
import type { FormField } from '../../components/StepperForm/offuiFormData';

const JWT_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJub2JlbGZyYW5rbGlubEBjbGFyaXVtLnRlY2giLCJlbXBJZCI6MTIzMiwiZGVzaWduYXRpb24iOiJUcmFpbmVlIFNvZnR3YXJlIEVuZ2luZWVyIiwiaWF0IjoxNzgxNTA5MTMzLCJleHAiOjE4ODE1MTI3MzN9.JLPXsPNhHHc5tpc2nngY9P0bMYvDCD0jhX5HKImZGKQ3MKAECfmwq7BwmviDPfnu1DwP10X8VfXgufUKD8rHVw';
const API_URL        = 'http://localhost:5206/api/EmsData';
const SUBMIT_URL     = 'http://localhost:5206/api/submission/submit';
const GET_SUBMIT_URL = 'http://localhost:5206/api/submission/getsubmit';
const BASE_URL       = 'http://localhost:5206';

const axiosInstance = axios.create({
  headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  withCredentials: true,
});

// ── Helpers ────────────────────────────────────────────────────────
const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? String(iso)
    : `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
};

/** Submission date + 30 days notice period */
const calcFinalDay = (submissionDate: string | null): string => {
  if (!submissionDate) return 'Not yet scheduled';
  const d = new Date(submissionDate);
  if (isNaN(d.getTime())) return 'Not yet scheduled';
  d.setDate(d.getDate() + 30);
  return `Scheduled for ${d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

/**
 * Builds the full 8-step timeline from known state.
 *
 * Index map:
 *   0 — Resignation Submitted
 *   1 — Reporting Manager Approval
 *   2 — Offboarding Initiated
 *   3 — IT Department Approval
 *   4 — Admin Approval
 *   5 — Finance Approval
 *   6 — HR Approval
 *   7 — Final Day
 */
const buildTimeline = (
  isSubmitted: boolean,
  submissionDate: string | null,
  isManagerApproved: boolean,
  approvedAt: string | null,
): TimelineItem[] => {
  const items: TimelineItem[] = defaultTimelineData.map((item) => ({ ...item }));

  // Stage 0 — Resignation Submitted
  if (isSubmitted) {
    items[0] = {
      ...items[0],
      status: 'completed',
      subtitle: submissionDate
        ? `Submitted on ${formatDate(submissionDate)}`
        : 'Submitted',
    };
  }

  // Stage 1 — Reporting Manager Approval
  if (isSubmitted && !isManagerApproved) {
    items[1] = {
      ...items[1],
      status: 'in-progress',
      subtitle: 'Awaiting manager approval',
    };
  }

  if (isManagerApproved) {
    items[1] = {
      ...items[1],
      status: 'completed',
      subtitle: approvedAt
        ? `Approved on ${formatDate(approvedAt)}`
        : 'Manager approved',
    };
    // Stage 2 becomes in-progress once manager approves
    items[2] = {
      ...items[2],
      status: 'in-progress',
      subtitle: 'Pending HR Initiation',
    };
  }

  // Stage 7 — Final Day from submission date + 30 days
  items[7] = {
    ...items[7],
    subtitle: calcFinalDay(submissionDate),
  };

  return items;
};

// ── Component ──────────────────────────────────────────────────────
const UserDashboard = () => {
  const [empData, setEmpData] = useState<Record<string, string>>({
    employeeId: '',
    fullName: '',
    email: '',
    designation: '',
    DateOfJoining: '',
    ReportingManager: '',
  });

  const [submitted,      setSubmitted]      = useState(false);
  const [submitDate,     setSubmitDate]      = useState<string | null>(null);
  const [submitTime,     setSubmitTime]      = useState('');
  const [submissionLogId, setSubmissionLogId] = useState<string | null>(null);
  const [isManagerApproved, setIsManagerApproved] = useState(false);
  const [approvedAt,     setApprovedAt]      = useState<string | null>(null);
  const [timelineItems,  setTimelineItems]   = useState<TimelineItem[]>(defaultTimelineData);
  const [empLoaded,      setEmpLoaded]       = useState(false);

  // Rebuild timeline whenever submission or approval state changes
  useEffect(() => {
    setTimelineItems(
      buildTimeline(submitted, submitDate, isManagerApproved, approvedAt)
    );
  }, [submitted, submitDate, isManagerApproved, approvedAt]);

  // ── Step 1: fetch employee info ──────────────────────────────────
  useEffect(() => {
    axiosInstance
      .get(API_URL)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        const data = list[0];
        if (!data) return;
        setEmpData({
          employeeId:       String(data.empId ?? ''),
          fullName:         `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
          email:            data.email ?? '',
          designation:      data.desg ?? '',
          DateOfJoining:    data.doj ? new Date(data.doj).toISOString().split('T')[0] : '',
          ReportingManager: data.reportingManager ?? '',
        });
        setEmpLoaded(true);
      })
      .catch((err) => console.error('Failed to fetch employee data:', err));
  }, []);

  // ── Step 2: check prior submission + approval ────────────────────
  useEffect(() => {
    if (!empLoaded || !empData.employeeId) return;

    axiosInstance
      .get(`${GET_SUBMIT_URL}?employeeId=${empData.employeeId}`)
      .then((res) => {
        const data = res.data;
        if (!data.isSubmitted) return;

        const date  = data.date  ?? null;
        const time  = data.time  ?? '';
        const logId = data.submissionLogId ?? null;

        setSubmitDate(date);
        setSubmitTime(time);
        setSubmissionLogId(logId);
        setSubmitted(true);

        // ── Step 3: check manager approval status ──────────────
        if (logId) {
          axiosInstance
            .get(`${BASE_URL}/api/GetApproveOffboarding/${logId}`)
            .then((ar) => {
              if (ar.data.isApproved) {
                setIsManagerApproved(true);
                setApprovedAt(ar.data.data?.approvedAt ?? null);
              }
            })
            .catch((err) => console.error('Failed to check approval:', err));
        }
      })
      .catch((err) => console.error('Failed to check submission status:', err));
  }, [empLoaded, empData.employeeId]);

  // ── Submit handler ───────────────────────────────────────────────
  const handleSubmit = async (data: Record<string, string>) => {
    try {
      const payload = {
        employeeId:   data.employeeId,
        action:       'record_created',
        performedBy:  data.fullName || data.employeeId,
        employeeData: null,
        stageBefore:  null,
        stageAfter:   'exit_interview',
      };

      const res = await axiosInstance.post(SUBMIT_URL, payload);

      if (res.status === 200 || res.status === 201) {
        const date  = res.data.date ?? new Date().toISOString().split('T')[0];
        const time  = res.data.time ?? new Date().toTimeString().split(' ')[0];
        const logId = res.data.submissionLogId ?? null;

        setSubmitDate(date);
        setSubmitTime(time);
        setSubmissionLogId(logId);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  const fields: FormField[] = [
    { name: 'employeeId',       label: 'Employee ID',      type: 'text', placeholder: 'Enter Employee ID',  value: empData.employeeId },
    { name: 'fullName',         label: 'Full Name',         type: 'text', placeholder: 'Enter Full Name',    value: empData.fullName },
    { name: 'email',            label: 'Email',             type: 'text', placeholder: 'Enter Email',        value: empData.email },
    { name: 'designation',      label: 'Designation',       type: 'text', placeholder: 'Designation',        value: empData.designation },
    { name: 'DateOfJoining',    label: 'Date of Joining',   type: 'date',                                    value: empData.DateOfJoining },
    { name: 'ReportingManager', label: 'Reporting Manager', type: 'text', placeholder: 'Reporting Manager',  value: empData.ReportingManager },
  ];

  // suppress unused warning — kept for potential future polling
  void submissionLogId;

  return (
    <section className="offui-ie">
      <div className="offui-ie-left">
        <ProcessTimeline items={timelineItems} />
      </div>

      <div className="offui-ie-right">
        <div className="offui-ie-right-form">
          {submitted ? (
            <OffuiIESubmitCard date={submitDate ?? ''} time={submitTime} />
          ) : (
            <OffuiForms
              key={empData.employeeId}
              title="Employee Details"
              subtitle="Please verify your information"
              submitLabel="Submit"
              onSubmit={handleSubmit}
              fields={fields}
            />
          )}
        </div>

        <div className="offui-ie-right-cards">
          <OffuiCards title="Notice Period"         value="30 Days" subtitle="Standard contractual obligation" />
          <OffuiCards title="No. Of Leaves Pending" value="12"      subtitle="Privilege and Casual leaves combined" />
        </div>
      </div>
    </section>
  );
};

export default UserDashboard;