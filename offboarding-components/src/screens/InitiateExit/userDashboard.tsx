import { useState } from 'react';
import OffuiCards from '../../components/Cards/offuiCards';
import ProcessTimeline from '../../components/ProcessTimeline/processTimeline';
import OffuiForms from '../../components/StepperForm/offuiForms';
import OffuiIESubmitCard from '../../components/SubmitCard/offuiIESubmitCard';
import defaultTimelineData, { type TimelineItem } from '../../components/ProcessTimeline/processTimelineData';
import './userDashboard.css';

// Shape of the API response
interface SubmitResponse {
  statusCode: string;
  message: string;
  time: string;   // "HH:mm:ss"
  date: string;   // "YYYY-MM-DD"
}

const UserDashboard = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitDate, setSubmitDate] = useState('');
  const [submitTime, setSubmitTime] = useState('');
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(defaultTimelineData);

  const handleSubmit = async (data: Record<string, string>) => {
    try {
      const res = await fetch('/offapi/api/submission/submit', {
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

        // Guard: only accept the expected message
        if (payload.statusCode === '201' && payload.message === 'Resignation Submitted') {
          // Mark first timeline item as completed
          setTimelineItems(prev =>
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

  return (
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
              title="Employee Details"
              subtitle="Please verify your information"
              submitLabel="Submit"
              onSubmit={handleSubmit}
              fields={[
                {
                  name: 'employeeId',
                  label: 'Employee ID',
                  type: 'text',
                  placeholder: 'Enter Employee ID',
                  value: 'EMP001',
                },
                {
                  name: 'fullName',
                  label: 'Full Name',
                  type: 'text',
                  placeholder: 'Enter Full Name',
                  value: null,
                },
                {
                  name: 'email',
                  label: 'Email',
                  type: 'text',
                  placeholder: 'Enter Email',
                  value: '',
                },
                {
                  name: 'department',
                  label: 'Department',
                  type: 'select',
                  placeholder: 'Select Department',
                  value: '',
                  options: [
                    { label: 'IT',      value: 'it'      },
                    { label: 'HR',      value: 'hr'      },
                    { label: 'Finance', value: 'finance' },
                  ],
                },
                {
                  name: 'lastWorkingDay',
                  label: 'Last Working Day',
                  type: 'date',
                  value: '',
                },
                {
                  name: 'reason',
                  label: 'Reason For Leaving',
                  type: 'text',
                  placeholder: 'Enter reason...',
                  value: '',
                },
              ]}
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
  );
};

export default UserDashboard;