import { useState } from 'react';
import type { TeamMember } from '../../types';
import { formatDateDMY, getInitials } from '../../utils';
import './teamTable.css';

// ── Column config ──────────────────────────────────────────────────

const COLUMNS = [
  'Employee',
  'Emp ID',
  'Role',
  'Project',
  'Joined',
  'Resignation Date',
  'Status',
  'Action',
] as const;

// ── Props ──────────────────────────────────────────────────────────

interface TeamTableProps {
  members: TeamMember[];
  loading?: boolean;
  error?: string;
  pageSize?: number;
  onViewRecord: (member: TeamMember) => void;
  onViewDetails: (member: TeamMember) => void;
}

// ── Pagination helpers ─────────────────────────────────────────────

const buildPageList = (page: number, totalPages: number): (number | '...')[] => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 3)              return [1, 2, 3, '...', totalPages];
  if (page >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', page - 1, page, page + 1, '...', totalPages];
};

// ── Component ──────────────────────────────────────────────────────

const TeamTable = ({
  members,
  loading = false,
  error = '',
  pageSize = 5,
  onViewRecord,
  onViewDetails,
}: TeamTableProps) => {
  const [page, setPage] = useState(1);

  const total      = members.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSlice  = members.slice((page - 1) * pageSize, page * pageSize);

  const handleAction = (member: TeamMember) => {
    if (member.isOffboarding) {
      onViewRecord(member);
    } else {
      onViewDetails(member);
    }
  };

  return (
    <div className="offui-tt">

      {/* Header */}
      <div className="offui-tt-header">
        {COLUMNS.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="offui-tt-state">Loading team data…</div>
      ) : error ? (
        <div className="offui-tt-state">{error}</div>
      ) : total === 0 ? (
        <div className="offui-tt-state">No direct reports found.</div>
      ) : (
        pageSlice.map((member) => (
          <div key={member.empId} className="offui-tt-row">

            {/* Name + avatar */}
            <div className="offui-tt-emp-cell">
              <div className="offui-tt-avatar">{getInitials(member.fullName)}</div>
              <div>
                <p className="offui-tt-emp-name">{member.fullName}</p>
                <p className="offui-tt-emp-email">{member.email ?? '—'}</p>
              </div>
            </div>

            <span className="offui-tt-cell">{member.empId}</span>
            <span className="offui-tt-cell">{member.desg}</span>
            <span className="offui-tt-cell">{member.project ?? '—'}</span>
            <span className="offui-tt-cell">{formatDateDMY(member.doj)}</span>

            {/* Resignation date — dash for active employees */}
            <span className="offui-tt-cell">
              {member.isOffboarding ? formatDateDMY(member.resignationDate) : '—'}
            </span>

            {/* Status badge */}
            <span
              className={`offui-tt-badge ${
                member.isOffboarding
                  ? 'offui-tt-badge--offboarding'
                  : 'offui-tt-badge--active'
              }`}
            >
              {member.isOffboarding ? 'Offboarding' : 'Active'}
            </span>

            {/* Action button */}
            <button
              className={`offui-tt-action-btn ${
                member.isOffboarding ? 'offui-tt-action-btn--offboarding' : ''
              }`}
              onClick={() => handleAction(member)}
            >
              {member.isOffboarding ? 'View Record' : 'View Details'}
            </button>

          </div>
        ))
      )}

      {/* Pagination */}
      {!loading && !error && total > pageSize && (
        <div className="offui-tt-footer">
          <span className="offui-tt-footer-info">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} members
          </span>

          <div className="offui-tt-pagination">
            <button
              className="offui-tt-page-btn"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              ‹
            </button>

            {buildPageList(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="offui-tt-page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`offui-tt-page-btn ${page === p ? 'offui-tt-page-btn--active' : ''}`}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </button>
              )
            )}

            <button
              className="offui-tt-page-btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamTable;