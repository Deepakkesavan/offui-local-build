export type TimelineStatus = 'completed' | 'in-progress' | 'pending';

export interface TimelineItem {
  title: string;
  subtitle: string;
  status: TimelineStatus;
}

// Default data — "Resignation Submitted" starts as in-progress.
// The userDashboard swaps it to 'completed' after a successful POST.
const processTimelineData: TimelineItem[] = [
  {
    title: 'Resignation Submitted',
    subtitle: 'Pending confirmation',
    status: 'in-progress',    // ← was 'completed'; changes to 'completed' post-submit
  },
  {
    title: 'Asset Recovery',
    subtitle: 'Pending equipment return (MacBook, Badge)',
    status: 'pending',
  },
  {
    title: 'Clearance Approvals',
    subtitle: 'Awaiting Finance and IT sign-off',
    status: 'pending',
  },
  {
    title: 'Final Day',
    subtitle: 'Scheduled for Oct 31, 2023',
    status: 'pending',
  },
];

export default processTimelineData;