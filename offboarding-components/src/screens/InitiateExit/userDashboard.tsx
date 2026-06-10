import { useEffect, useState } from 'react';
import axios from 'axios';
import OffuiCards from '../../components/Cards/offuiCards';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import OffuiForms from '../../components/StepperForm/offuiForms';
import OffuiIESubmitCard from '../../components/SubmitCard/offuiIESubmitCard';
import defaultTimelineData, { type TimelineItem } from '../../components/ProcessTimeline/processTimelineData';
import './userDashboard.css';
import type { FormField } from '../../components/StepperForm/offuiFormData';

const JWT_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJlbWFpbCI6IkRlZXBha0tAY2xhcml1bS50ZWNoIiwiZW1wSWQiOjEyMjUsImRlc2lnbmF0aW9uIjoiVHJhaW5lZSBTb2Z0d2FyZSBFbmdpbmVlciIsImlhdCI6MTc4MTEyMzkyMiwiZXhwIjoxNzgxMTI3NTIyfQ.iu6_Iellw3uk7acCddYrFMXhyM5PDV-A0J-T2RBHlMqBIzaZ64MI3caC2IpEqda5wURZxKAIfJ8uONDq2fW9XA';
const API_URL = 'http://localhost:5206/api/EmsData';

// Shape of the submit API response
interface SubmitResponse {
  statusCode: string;
  message: string;
  time: string;   // "HH:mm:ss"
  date: string;   // "YYYY-MM-DD"
}

const UserDashboard = () => {
  const [empData, setEmpData] = useState<Record<string, string>>({
    employeeId: '',
    fullName: '',
    email: '',
    designation: '',
    DateOfJoining: '',
    ReportingManager: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitDate, setSubmitDate] = useState('');
  const [submitTime, setSubmitTime] = useState('');
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(defaultTimelineData);

  // Fetch employee data from EMS on mount
  useEffect(() => {
    axios
      .get(API_URL, {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
        withCredentials: true,
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        const data = list[0];
        if (!data) {
          console.warn('No employee data returned');
          return;
        }
        setEmpData((prev) => ({
          ...prev,
          employeeId: data.empId ?? '',
          fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
          email: data.email ?? '',
          designation: data.desg ?? '',
          DateOfJoining: data.doj
            ? new Date(data.doj).toISOString().split('T')[0]
            : '',
          ReportingManager: data.reportingManager ?? '',
        }));
      })
      .catch((err) => {
        console.error('Failed to fetch employee data:', err);
      });
  }, []);

  const handleSubmit = async (data: Record<string, string>) => {
    try {
      const res = await fetch('http://localhost:5206/api/submission/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: data.employeeId,
          action: 'Resignation Submitted',
          performedBy: data.fullName ?? data.employeeId,
          employeeData: data,
          stageBefore: null,
          stageAfter: 'exit_interview',
        }),
      });

      if (res.status === 201) {
        const payload: SubmitResponse = await res.json();

        if (payload.statusCode === '201' && payload.message === 'Resignation Submitted') {
          // Mark first timeline item as completed
          setTimelineItems((prev) =>
            prev.map((item, idx) =>
              idx === 0
                ? {
                    ...item,
                    status: 'completed',
                    subtitle: `Confirmed on ${payload.date}`,
                  }
                : item
            )
          );

          setSubmitDate(payload.date);
          setSubmitTime(payload.time);
          setSubmitted(true);
        }
      }
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  const fields: FormField[] = [
    {
      name: 'employeeId',
      label: 'Employee ID',
      type: 'text',
      placeholder: 'Enter Employee ID',
      value: empData.employeeId,
    },
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter Full Name',
      value: empData.fullName,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'Enter Email',
      value: empData.email,
    },
    {
      name: 'designation',
      label: 'Designation',
      type: 'text',
      placeholder: 'Designation',
      value: empData.desg,
    },
    {
      name: 'DateOfJoining',
      label: 'Date of Joining',
      type: 'date',
      value: empData.DateOfJoining,
    },
    {
      name: 'ReportingManager',
      label: 'Reporting Manager',
      type: 'text',
      placeholder: 'Reporting Manager',
      value: empData.ReportingManager,
    },
  ];

  return (
    <>
      <section className="offui-ie">
        {/* Left — Process Timeline (dynamic) */}
        <div className="offui-ie-left">
          <ProcessTimeline items={timelineItems} />
        </div>

        {/* Right */}
        <div className="offui-ie-right">
          <div className="offui-ie-right-form">
            {submitted ? (
              /* Show success card in place of the form */
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
            <OffuiCards
              title="Notice Period"
              value="30 Days"
              subtitle="Standard contractual obligation"
            />
            <OffuiCards
              title="No. Of Leaves Pending"
              value="12"
              subtitle="Privilege and Casual leaves combined"
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default UserDashboard;