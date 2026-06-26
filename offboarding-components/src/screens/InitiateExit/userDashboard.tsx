import { useEffect, useState } from 'react';
import OffuiCards from '../../components/Cards/offuiCards';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import OffuiForms from '../../components/StepperForm/offuiForms';
import OffuiIESubmitCard from '../../components/SubmitCard/offuiIESubmitCard';
import defaultTimelineData, { type TimelineItem } from '../../components/ProcessTimeline/processTimelineData';
import type { FormField } from '../../components/StepperForm/offuiFormData';
import type { SubmissionInfo, ApprovalInfo } from '../../types';
import { createApiClient } from '../../utils/apiClient';
import { buildTimeline, toInputDate } from '../../utils';
import { API_ENDPOINTS } from '../../config/api';
import './userDashboard.css';

const api = createApiClient('employee');

const UserDashboard = () => {
  const [empData, setEmpData] = useState({
    employeeId:       '',
    fullName:         '',
    email:            '',
    designation:      '',
    DateOfJoining:    '',
    ReportingManager: '',
  });

  const [submitted,         setSubmitted]         = useState(false);
  const [submitDate,        setSubmitDate]         = useState<string | null>(null);
  const [submitTime,        setSubmitTime]         = useState('');
  const [isManagerApproved, setIsManagerApproved] = useState(false);
  const [approvedAt,        setApprovedAt]         = useState<string | null>(null);
  const [isHrInitiated,     setIsHrInitiated]     = useState(false);
  const [hrInitiatedAt,     setHrInitiatedAt]     = useState<string | null>(null);
  const [isItCleared,       setIsItCleared]       = useState(false);
  const [itClearedAt,       setItClearedAt]       = useState<string | null>(null);
  const [timelineItems,     setTimelineItems]      = useState<TimelineItem[]>(defaultTimelineData);
  const [empLoaded,         setEmpLoaded]          = useState(false);

  // Rebuild timeline whenever any stage state changes
  useEffect(() => {
    setTimelineItems(
      buildTimeline(
        submitted,
        submitDate,
        isManagerApproved,
        approvedAt,
        isHrInitiated,
        hrInitiatedAt,
        isItCleared,
        itClearedAt,
      )
    );
  }, [submitted, submitDate, isManagerApproved, approvedAt, isHrInitiated, hrInitiatedAt, isItCleared, itClearedAt]);

  // ── Step 1: fetch employee data ──────────────────────────────────
  useEffect(() => {
    api
      .get(API_ENDPOINTS.emsData)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        const data = list[0];
        if (!data) return;
        setEmpData({
          employeeId:       String(data.empId ?? ''),
          fullName:         `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
          email:            data.email ?? '',
          designation:      data.desg ?? '',
          DateOfJoining:    toInputDate(data.doj),
          ReportingManager: data.reportingManager ?? '',
        });
        setEmpLoaded(true);
      })
      .catch((err) => console.error('Failed to fetch employee data:', err));
  }, []);

  // ── Step 2: check prior submission → approval → HR initiation → IT clearance ──
  useEffect(() => {
    if (!empLoaded || !empData.employeeId) return;

    api
      .get<SubmissionInfo>(`${API_ENDPOINTS.getSubmit}?employeeId=${empData.employeeId}`)
      .then((res) => {
        const data = res.data;
        if (!data.isSubmitted) return;

        setSubmitDate(data.date ?? null);
        setSubmitTime(data.time ?? '');
        setSubmitted(true);

        const logId = data.submissionLogId;
        if (!logId) return;

        // ── Step 3: manager approval ─────────────────────────────
        api
          .get<ApprovalInfo>(API_ENDPOINTS.getApproval(logId))
          .then((ar) => {
            if (ar.data.isApproved) {
              setIsManagerApproved(true);
              setApprovedAt(ar.data.data?.approvedAt ?? null);
            }

            // ── Step 4: HR initiation ──────────────────────────
            return api.get(API_ENDPOINTS.getHrInitiation(logId));
          })
          .then((hr) => {
            if (hr.data.isInitiated) {
              setIsHrInitiated(true);
              setHrInitiatedAt(hr.data.data?.initiatedAt ?? null);
            }

            // ── Step 5: IT clearance ───────────────────────────
            return api.get(API_ENDPOINTS.getItClearance(logId));
          })
          .then((it) => {
            if (it.data.isCleared) {
              setIsItCleared(true);
              setItClearedAt(it.data.data?.clearedAt ?? null);
            }
          })
          .catch((err) => console.error('Failed to check downstream stages:', err));
      })
      .catch((err) => console.error('Failed to check submission status:', err));
  }, [empLoaded, empData.employeeId]);

  // ── Submit handler ───────────────────────────────────────────────
  const handleSubmit = async (data: Record<string, string>) => {
    try {
      const payload = {
        employeeId:  data.employeeId,
        action:      'record_created',
        performedBy: data.fullName || data.employeeId,
        employeeData: null,
        stageBefore:  data.stageBefore || null,
        stageAfter:   'exit_interview',
      };

      const res = await api.post(API_ENDPOINTS.submit, payload);

      if (res.status === 200 || res.status === 201) {
        setSubmitDate(res.data.date ?? new Date().toISOString().split('T')[0]);
        setSubmitTime(res.data.time ?? new Date().toTimeString().split(' ')[0]);
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