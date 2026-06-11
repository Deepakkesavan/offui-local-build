import { useEffect, useState } from 'react';
import axios from 'axios';
import OffuiCards from '../../components/Cards/offuiCards';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import OffuiForms from '../../components/StepperForm/offuiForms';
import OffuiIESubmitCard from '../../components/SubmitCard/offuiIESubmitCard';
import defaultTimelineData, { type TimelineItem } from '../../components/ProcessTimeline/processTimelineData';
import './userDashboard.css';
import type { FormField } from '../../components/StepperForm/offuiFormData';

const JWT_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJEZWVwYWtLQGNsYXJpdW0udGVjaCIsImVtcElkIjoxMjI1LCJkZXNpZ25hdGlvbiI6IlRyYWluZWUgU29mdHdhcmUgRW5naW5lZXIiLCJpYXQiOjE3ODExNjI3NDIsImV4cCI6MTc4MTE2NjM0Mn0.scQrMWSdm_a3kOkFJ8HJsyinxB2bqGp7Ix_AYiJBR3uZK3tI3yCnxcx217QnI-49MoFd8hJEET6vEPZQpQVdBQ';
const API_URL = 'http://localhost:5206/api/EmsData';
const SUBMIT_URL = 'http://localhost:5206/api/submission/submit';

const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${JWT_TOKEN}`,
  },
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

  const [submitted, setSubmitted] = useState(false);
  const [submitDate, setSubmitDate] = useState('');
  const [submitTime, setSubmitTime] = useState('');
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(defaultTimelineData);

  useEffect(() => {
    axiosInstance
      .get(API_URL)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        const data = list[0];

        if (!data) {
          console.warn('No employee data returned');
          return;
        }

        setEmpData({
          employeeId: data.empId ?? '',
          fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
          email: data.email ?? '',
          designation: data.desg ?? '',                                         // ← fixed key
          DateOfJoining: data.doj
            ? new Date(data.doj).toISOString().split('T')[0]
            : '',
          ReportingManager: data.reportingManager ?? '',
        });
      })
      .catch((err) => {
        console.error('Failed to fetch employee data:', err);
      });
  }, []);

  const handleSubmit = async (data: Record<string, string>) => {
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];

      const payload = {
        employeeId: data.employeeId,        // was: employeeID: data.empId
        action: 'record_created',
        performedBy: data.fullName || data.employeeId,
        employeeData: null,
        stageBefore: null,
        stageAfter: 'exit_interview',
      };

      const res = await axiosInstance.post(SUBMIT_URL, payload);

      if (res.status === 200 || res.status === 201) {
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
      value: empData.designation,              // ← was empData.desg (undefined)
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