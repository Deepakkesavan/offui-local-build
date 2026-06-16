import defaultTimelineData, {
  type TimelineItem,
} from '../components/ProcessTimeline/processTimelineData';

// ── Date formatting ────────────────────────────────────────────────

/** MM/DD/YYYY — used inside forms and detail views */
export const formatDateMDY = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
};

/** DD Mon YYYY — used in tables */
export const formatDateDMY = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** YYYY-MM-DD string → Date object for form inputs */
export const toInputDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

// ── Notice period ──────────────────────────────────────────────────

/** Submission date + 30 days → readable label */
export const calcFinalDay = (submissionDate: string | null): string => {
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

// ── Action code → label ────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  record_created:   'Resignation submitted via offboarding portal',
  exit_interview:   'Exit interview completed',
  manager_approved: 'Approved by reporting manager',
  hr_initiation:    'HR initiation in progress',
};

export const formatAction = (action: string | null | undefined): string =>
  action ? (ACTION_LABELS[action] ?? action) : 'Resignation submitted via offboarding portal';

// ── Initials ───────────────────────────────────────────────────────

export const getInitials = (name: string): string =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// ── Timeline builder ───────────────────────────────────────────────

/**
 * Index map (matches processTimelineData order):
 *   0 — Resignation Submitted
 *   1 — Reporting Manager Approval
 *   2 — Offboarding Initiated
 *   3 — IT Department Approval
 *   4 — Admin Approval
 *   5 — Finance Approval
 *   6 — HR Approval
 *   7 — Final Day
 */
export const buildTimeline = (
  isSubmitted: boolean,
  submissionDate: string | null,
  isManagerApproved: boolean,
  approvedAt: string | null,
): TimelineItem[] => {
  const items: TimelineItem[] = defaultTimelineData.map((item) => ({ ...item }));

  if (isSubmitted) {
    items[0] = {
      ...items[0],
      status: 'completed',
      subtitle: submissionDate
        ? `Submitted on ${formatDateMDY(submissionDate)}`
        : 'Submitted',
    };
  }

  if (isSubmitted && !isManagerApproved) {
    items[1] = { ...items[1], status: 'in-progress', subtitle: 'Awaiting manager approval' };
  }

  if (isManagerApproved) {
    items[1] = {
      ...items[1],
      status: 'completed',
      subtitle: approvedAt ? `Approved on ${formatDateMDY(approvedAt)}` : 'Manager approved',
    };
    items[2] = { ...items[2], status: 'in-progress', subtitle: 'Pending HR Initiation' };
  }

  items[7] = { ...items[7], subtitle: calcFinalDay(submissionDate) };

  return items;
};