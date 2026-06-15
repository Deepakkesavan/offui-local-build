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
const API_URL    = 'http://localhost:5206/api/EmsData';
const SUBMIT_URL = 'http://localhost:5206/api/submission/submit';
const GET_SUBMIT_URL = 'http://localhost:5206/api/submission/getsubmit';

const axiosInstance = axios.create({
  headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  withCredentials: true,
});

const UserDashboard = () => {
  const [empData, setEmpData] = useState<Record<string, string>>({
    employeeId: '',
    fullName: '',
    email: '',
    designation: '',
    DateOfJoining: '',
    ReportingManager: '',
  });

  const [submitted, setSubmitted]     = useState(false);
  const [submitDate, setSubmitDate]   = useState('');
  const [submitTime, setSubmitTime]   = useState('');
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(defaultTimelineData);
  const [empLoaded, setEmpLoaded]     = useState(false); // guard: wait for empId before checking

  // ── Step 1: fetch employee info ──────────────────────────────────
  useEffect(() => {
    axiosInstance
      .get(API_URL)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        const data = list[0];
        if (!data) return;

        setEmpData({
          employeeId:      String(data.empId ?? ''),
          fullName:        `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
          email:           data.email ?? '',
          designation:     data.desg ?? '',
          DateOfJoining:   data.doj ? new Date(data.doj).toISOString().split('T')[0] : '',
          ReportingManager: data.reportingManager ?? '',
        });
        setEmpLoaded(true);
      })
      .catch((err) => console.error('Failed to fetch employee data:', err));
  }, []);

  // ── Step 2: once we have the employeeId, check prior submission ──
  useEffect(() => {
    if (!empLoaded || !empData.employeeId) return;

    axiosInstance
      .get(`${GET_SUBMIT_URL}?employeeId=${empData.employeeId}`)
      .then((res) => {
        const data = res.data;
        if (data.isSubmitted) {
          // Restore the success state so the card shows instead of the form
          setSubmitDate(data.date ?? '');
          setSubmitTime(data.time ?? '');
          setTimelineItems((prev) =>
            prev.map((item, idx) =>
              idx === 0
                ? { ...item, status: 'completed', subtitle: `Confirmed on ${data.date}` }
                : item
            )
          );
          setSubmitted(true);
        }
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
        stageBefore:  null,
        stageAfter:   'exit_interview',
      };

      const res = await axiosInstance.post(SUBMIT_URL, payload);

      if (res.status === 200 || res.status === 201) {
        const date = res.data.date ?? new Date().toISOString().split('T')[0];
        const time = res.data.time ?? new Date().toTimeString().split(' ')[0];

        setTimelineItems((prev) =>
          prev.map((item, idx) =>
            idx === 0
              ? { ...item, status: 'completed', subtitle: `Confirmed on ${date}` }
              : item
          )
        );
        setSubmitDate(date);
        setSubmitTime(time);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  const fields: FormField[] = [
    { name: 'employeeId',      label: 'Employee ID',       type: 'text', placeholder: 'Enter Employee ID',  value: empData.employeeId },
    { name: 'fullName',        label: 'Full Name',          type: 'text', placeholder: 'Enter Full Name',    value: empData.fullName },
    { name: 'email',           label: 'Email',              type: 'text', placeholder: 'Enter Email',        value: empData.email },
    { name: 'designation',     label: 'Designation',        type: 'text', placeholder: 'Designation',        value: empData.designation },
    { name: 'DateOfJoining',   label: 'Date of Joining',    type: 'date',                                    value: empData.DateOfJoining },
    { name: 'ReportingManager',label: 'Reporting Manager',  type: 'text', placeholder: 'Reporting Manager',  value: empData.ReportingManager },
  ];

  return (
    <section className="offui-ie">
      <div className="offui-ie-left">
        <ProcessTimeline items={timelineItems} />
      </div>

      <div className="offui-ie-right">
        <div className="offui-ie-right-form">
          {submitted ? (
            <OffuiIESubmitCard date={submitDate} time={submitTime} />
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
          <OffuiCards title="Notice Period"        value="30 Days" subtitle="Standard contractual obligation" />
          <OffuiCards title="No. Of Leaves Pending" value="12"    subtitle="Privilege and Casual leaves combined" />
        </div>
      </div>
    </section>
  );
};

export default UserDashboard;