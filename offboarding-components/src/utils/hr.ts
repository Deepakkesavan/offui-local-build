import type { SubmissionLogEntry, OffboardingStage } from '../types/hr';
import { buildTimeline as buildBaseTimeline } from './index';
import type { TimelineItem } from '../components/ProcessTimeline/processTimelineData';

// ── Stage → human label ──────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  exit_interview:       'Exit Interview',
  manager_approved:     'Manager Approval',
  hr_initiation:        'HR Initiation',
  department_clearance: 'Department Clearance',
  final_approval:       'Final Approval',
};

export const getStageLabel = (stage: string | null | undefined): string =>
  stage ? (STAGE_LABELS[stage] ?? stage) : 'Exit Interview';

export const isPreManagerApproval = (stage: string | null | undefined): boolean =>
  stage === 'exit_interview' || stage === null || stage === undefined;

export const isPendingHrApproval = (stage: string | null | undefined): boolean =>
  stage === 'manager_approved';

// ── Recent Activity feed ─────────────────────────────────────────
export interface ActivityFeedItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
}

const ACTION_TITLES: Record<string, string> = {
  record_created:   'New Request',
  exit_interview:   'Exit Interview Submitted',
  manager_approved: 'Approval Required',
  hr_initiation:    'HR Initiation Started',
};

export const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';

  const diffMs    = Date.now() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins} MINUTE${diffMins === 1 ? '' : 'S'} AGO`;
  if (diffHours < 24) return `${diffHours} HOUR${diffHours === 1 ? '' : 'S'} AGO`;
  if (diffDays === 1) return 'YESTERDAY';
  if (diffDays < 7)   return `${diffDays} DAYS AGO`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};

export const buildActivityFeed = (logs: SubmissionLogEntry[]): ActivityFeedItem[] => {
  return [...logs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((log) => ({
      id: log.id,
      title: ACTION_TITLES[log.action] ?? log.action,
      description: log.employeeName
        ? `${log.employeeName} (${log.employeeId}) — ${getStageLabel(log.stageAfter)}`
        : `Employee ${log.employeeId} — ${getStageLabel(log.stageAfter)}`,
      timeLabel: formatRelativeTime(log.createdAt),
    }));
};

// ── HR + IT aware timeline ───────────────────────────────────────
// Wraps the shared buildTimeline and additionally handles:
//   item[2] — HR Initiation  (completed when isHrInitiated)
//   item[3] — IT Clearance   (completed when isItCleared)   ← FIX
//   item[4] — Admin Approval (in-progress once IT clears)   ← FIX
export const buildHrTimeline = (
  isSubmitted: boolean,
  submissionDate: string | null,
  isManagerApproved: boolean,
  approvedAt: string | null,
  isHrInitiated: boolean,
  initiatedAt: string | null,
  isItCleared: boolean = false,       // FIX: new param
  itClearedAt: string | null = null,  // FIX: new param
): TimelineItem[] => {
  const items = buildBaseTimeline(isSubmitted, submissionDate, isManagerApproved, approvedAt);

  if (isHrInitiated) {
    items[2] = {
      ...items[2],
      status: 'completed',
      subtitle: initiatedAt
        ? `Initiated on ${new Date(initiatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : 'HR initiation complete',
    };

    if (isItCleared) {
      // FIX: IT done — mark item[3] complete, advance item[4] to in-progress
      items[3] = {
        ...items[3],
        status: 'completed',
        subtitle: itClearedAt
          ? `Cleared on ${new Date(itClearedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'IT clearance complete',
      };
      items[4] = { ...items[4], status: 'in-progress', subtitle: 'Pending Admin sign-off' };
    } else {
      items[3] = { ...items[3], status: 'in-progress', subtitle: 'Pending IT clearance' };
    }
  }

  return items;
};

export type { OffboardingStage };