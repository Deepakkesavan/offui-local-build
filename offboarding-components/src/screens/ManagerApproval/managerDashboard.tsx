import ProcessTimeline from '../../components/ProcessTimeline/processTimeline'
import OffuiForms from '../../components/StepperForm/offuiForms'
import './managerDashboard.css';
import OffuiCards from '../../components/Cards/offuiCards';


const managerDashboard = () => {
    const handleSubmit = (data: Record<string, string>) => {
    console.log('Form Data:', data);
  };
  return (
    <>
      <section className='offui-ma'>
        <div className='offui-ma-left'>
          <ProcessTimeline />
        </div>

        <div className='offui-ma-right'>
          <div className='offui-ma-right-form'>
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
                    {
                      label: 'IT',
                      value: 'it',
                    },
                    {
                      label: 'HR',
                      value: 'hr',
                    },
                    {
                      label: 'Finance',
                      value: 'finance',
                    },
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
          </div>

          <div className='offui-ma-right-cards'>
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
  )
}

export default managerDashboard
