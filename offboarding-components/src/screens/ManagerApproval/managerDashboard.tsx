import { useEffect, useState } from 'react';
import axios from 'axios';
import OffuiCards from '../../components/Cards/offuiCards';
import './managerDashboard.css';

// ── Types ──────────────────────────────────────────────────────────
interface TeamMember {
  empId: string;
  fullName: string;
  desg: string;
  project: string | null;
  grade: string | null;
  email: string | null;
  gender: string | null;
  doj: string | null;
  isOffboarding: boolean;
}

interface ManagerInfo {
  empId: string;
  fullName: string;
  desg: string;
  email: string | null;
  project: string | null;
  grade: string | null;
  managerEmpCode: string | null;
  reportingManager: string | null;
  isReportingManager: boolean;
  noOfTotalMembers: string;
  noOfActive: string;
  noOfOffboarding: string;
  totalMembers: TeamMember[];
}

// ── Config ─────────────────────────────────────────────────────────
const JWT_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJBZ3VzdGluSmVuaWxSYWpQQGNsYXJpdW0udGVjaCIsImVtcElkIjoxMDgxLCJkZXNpZ25hdGlvbiI6IlRlY2huaWNhbCBMZWFkIiwiaWF0IjoxNzgxNTA5MTMzLCJleHAiOjE5ODE1MTI3MzN9.EG0UdmRFpgukHuboycJj6ofjSG2BltlXQG04iJVyHnaBDNtjuWkIgfJ2j5S26PSRaZ7j5FSshuAQ-ZTkBqqBHw';
const MANAGER_INFO_URL = 'http://localhost:5206/api/managerinfo';
const PAGE_SIZE = 5;

const axiosInstance = axios.create({
  headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  withCredentials: true,
});

// ── Helpers ────────────────────────────────────────────────────────
const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// ── Component ──────────────────────────────────────────────────────
const ManagerDashboard = () => {
  const [info, setInfo]       = useState<ManagerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [page, setPage]       = useState(1);

  useEffect(() => {
    axiosInstance
      .get<ManagerInfo>(MANAGER_INFO_URL)
      .then((res) => setInfo(res.data))
      .catch((err) => {
        console.error('Failed to load manager info:', err);
        setError('Could not load team data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ────────────────────────────────────────────────────
  const members      = info?.totalMembers ?? [];
  const totalMembers = members.length;
  const totalPages   = Math.max(1, Math.ceil(totalMembers / PAGE_SIZE));
  const pageSlice    = members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildPages = (): (number | '...')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)           return [1, 2, 3, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  // ── Not a manager ───────────────────────────────────────────────
  if (!loading && info && !info.isReportingManager) {
    return (
      <section className="offui-md">
        <div className="offui-md-row1">
          <h1>Manager Dashboard</h1>
          <p>You do not have any direct reports assigned to you.</p>
        </div>
        <div className="offui-md-state">
          No team members found under your employee ID ({info.empId}).
        </div>
      </section>
    );
  }

  return (
    <section className="offui-md">

      {/* Row 1 — Heading */}
      <div className="offui-md-row1">
        <h1>My Team Records</h1>
        <p>
          {info
            ? `${info.fullName} (${info.empId}) · ${info.desg}`
            : 'Loading your profile…'}
        </p>
      </div>

      {/* Row 2 — Stat cards */}
      <div className="offui-md-row2">
        <OffuiCards
          title="Total Members"
          value={info?.noOfTotalMembers ?? '—'}
          subtitle="Employees under your reporting line"
        />
        <OffuiCards
          title="Active"
          value={info?.noOfActive ?? '—'}
          subtitle="Currently not in offboarding"
        />
        <OffuiCards
          title="Offboarding"
          value={info?.noOfOffboarding ?? '—'}
          subtitle="Resignation submitted"
        />
      </div>

      {/* Row 3 — Team table */}
      <div className="offui-md-row3">

        {/* Header */}
        <div className="offui-md-table-header">
          <span>Employee</span>
          <span>Emp ID</span>
          <span>Role</span>
          <span>Project</span>
          <span>Joined</span>
          <span>Status</span>
        </div>

        {/* Body */}
        {loading ? (
          <div className="offui-md-state">Loading team data…</div>
        ) : error ? (
          <div className="offui-md-state">{error}</div>
        ) : totalMembers === 0 ? (
          <div className="offui-md-state">No direct reports found.</div>
        ) : (
          pageSlice.map((member) => (
            <div key={member.empId} className="offui-md-table-row">

              {/* Name + avatar */}
              <div className="offui-md-emp-cell">
                <div className="offui-md-avatar">{initials(member.fullName)}</div>
                <div>
                  <p className="offui-md-emp-name">{member.fullName}</p>
                  <p className="offui-md-emp-email">{member.email ?? '—'}</p>
                </div>
              </div>

              <span className="offui-md-cell-text">{member.empId}</span>
              <span className="offui-md-cell-text">{member.desg}</span>
              <span className="offui-md-cell-text">{member.project ?? '—'}</span>
              <span className="offui-md-cell-text">{formatDate(member.doj)}</span>

              {/* Status badge */}
              <span
                className={`offui-md-badge ${
                  member.isOffboarding
                    ? 'offui-md-badge--offboarding'
                    : 'offui-md-badge--active'
                }`}
              >
                {member.isOffboarding ? 'Offboarding' : 'Active'}
              </span>
            </div>
          ))
        )}

        {/* Pagination footer */}
        {!loading && !error && totalMembers > PAGE_SIZE && (
          <div className="offui-md-table-footer">
            <span className="offui-md-table-footer-info">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalMembers)} of {totalMembers} members
            </span>

            <div className="offui-md-pagination">
              <button
                className="offui-md-page-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >‹</button>

              {buildPages().map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="offui-md-page-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`offui-md-page-btn ${page === p ? 'offui-md-page-btn--active' : ''}`}
                    onClick={() => setPage(p as number)}
                  >{p}</button>
                )
              )}

              <button
                className="offui-md-page-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >›</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ManagerDashboard;