import { useState } from 'react';
import type { HrOffboardingMember } from '../../types/hr';
import { formatDateDMY, getInitials } from '../../utils';
import './hrTeamTable.css';

// ── Column config ──────────────────────────────────────────────────

const COLUMNS = ['Employee', 'Last Working Day', 'Status', 'Action'] as const;

// ── Props ──────────────────────────────────────────────────────────

interface HrTeamTableProps {
  members: HrOffboardingMember[];
  loading?: boolean;
  error?: string;
  pageSize?: number;
  onViewRecord: (member: HrOffboardingMember) => void;
}

// ── Pagination helpers ─────────────────────────────────────────────

const buildPageList = (page: number, totalPages: number): (number | '...')[] => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, '...', totalPages];
  if (page >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', page - 1, page, page + 1, '...', totalPages];
};

// ── Component ──────────────────────────────────────────────────────

const HrTeamTable = ({
  members,
  loading = false,
  error = '',
  pageSize = 5,
  onViewRecord,
}: HrTeamTableProps) => {
  const [page, setPage] = useState(1);

  const total = members.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSlice = members.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="offui-htt">
      {/* Header */}
      <div className="offui-htt-header">
        {COLUMNS.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="offui-htt-state">Loading offboarding records…</div>
      ) : error ? (
        <div className="offui-htt-state">{error}</div>
      ) : total === 0 ? (
        <div className="offui-htt-state">No offboarding records found.</div>
      ) : (
        pageSlice.map((member) => (
          <div key={member.empId} className="offui-htt-row">
            {/* Name + EmpId */}
            <div className="offui-htt-emp-cell">
              <div className="offui-htt-avatar">{getInitials(member.fullName)}</div>
              <div>
                <p className="offui-htt-emp-name">{member.fullName}</p>
                <p className="offui-htt-emp-id">{member.empId}</p>
              </div>
            </div>

            {/* Last working day — comes from ManagerApproval.lastWorkingDay */}
            <span className="offui-htt-cell">
              {member.lastWorkingDay ? formatDateDMY(member.lastWorkingDay) : '—'}
            </span>

            {/* Status badge */}
            <span>
              <span className={`offui-htt-badge offui-htt-badge--${member.stage}`}>
                {member.stageLabel}
              </span>
            </span>

            {/* Action */}
            <div className="offui-htt-action-cell">
              <button className="offui-htt-action-btn" onClick={() => onViewRecord(member)}>
                View Tasks
              </button>
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {!loading && !error && total > pageSize && (
        <div className="offui-htt-footer">
          <span className="offui-htt-footer-info">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} records
          </span>

          <div className="offui-htt-pagination">
            <button
              className="offui-htt-page-btn"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              Prev
            </button>

            {buildPageList(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="offui-htt-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={`offui-htt-page-btn ${page === p ? 'offui-htt-page-btn--active' : ''}`}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </button>
              ),
            )}

            <button
              className="offui-htt-page-btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrTeamTable;