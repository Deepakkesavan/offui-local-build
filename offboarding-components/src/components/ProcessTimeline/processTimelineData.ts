export type TimelineStatus = 'completed' | 'in-progress' | 'pending';

export interface TimelineItem {
  title: string;
  subtitle: string;
  status: TimelineStatus;
}

const processTimelineData: TimelineItem[] = [
  {
    title: 'Resignation Submitted',
    subtitle: 'Pending confirmation',
    status: 'in-progress',
  },
  {
    title: 'Reporting Manager Approval',
    subtitle: 'Pending Manager approval',
    status: 'pending',
  },
  {
    title: 'Offboarding Initiated',
    subtitle: 'Pending HR Initiation',
    status: 'pending',
  },
  {
    title: 'IT Department Approval',
    subtitle: 'Pending equipment return (MacBook, Badge)',
    status: 'pending',
  },
  {
    title: 'Admin Approval',
    subtitle: 'Awaiting Admin sign-off',
    status: 'pending',
  },
  {
    title: 'Finance Approval',
    subtitle: 'Awaiting Finance sign-off',
    status: 'pending',
  },
  {
    title: 'HR Approval',
    subtitle: 'Awaiting HR sign-off',
    status: 'pending',
  },
  {
    title: 'Final Day',
    subtitle: 'Not yet scheduled',
    status: 'pending',
  },
];

export default processTimelineData;