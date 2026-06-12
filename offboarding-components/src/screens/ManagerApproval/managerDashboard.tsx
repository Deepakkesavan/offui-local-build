import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OffuiCards from '../../components/Cards/offuiCards';
import './managerDashboard.css';

// ── Types ──────────────────────────────────────────────────────────
interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  manager: string | null;
}

interface OffboardingRecord {
  id: number;
  employeeId: string;
  currentStage: string;
  status: string;
}

// Replace with the logged-in manager's name as it appears in Employee.manager
const CURRENT_MANAGER = 'Priya Sharma';
const RECORDS_URL     = 'http://localhost:5206/api/offboarding-records';
const EMPLOYEES_URL   = 'http://localhost:5206/api/employees';
const PAGE_SIZE       = 4;

const axiosInstance = axios.create({ withCredentials: true });

// ── Initials helper ────────────────────────────────────────────────
const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

// ── Component ──────────────────────────────────────────────────────
const ManagerDashboard = () => {
  const navigate = useNavigate();

  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [offboarding, setOffboarding] = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  useEffect(() => {
    Promise.all([
      axiosInstance.get<Employee[]>(EMPLOYEES_URL),
      axiosInstance.get<OffboardingRecord[]>(RECORDS_URL),
    ])
      .then(([empRes, recRes]) => {
        // Filter to only employees reporting to this manager
        const team = empRes.data.filter(
          (e) => e.manager === CURRENT_MANAGER
        );
        setEmployees(team);

        // Build a set of employeeIds that have an active offboarding record
        const offboardingIds = new Set(
          recRes.data
            .filter((r) => r.status === 'active')
            .map((r) => r.employeeId)
        );
        setOffboarding(offboardingIds);
      })
      .catch((err) => console.error('Failed to load manager dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived counts ─────────────────────────────────────────────
  const totalMembers    = employees.length;
  const offboardingCount = employees.filter((e) => offboarding.has(e.id)).length;
  const activeCount     = totalMembers - offboardingCount;

  // ── Pagination ─────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(totalMembers / PAGE_SIZE));
  const pageSlice   = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildPages = (): (number | '...')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <section className="offui-md">

      {/* Row 1 — Heading */}
      <div className="offui-md-row1">
        <h1>My Team Records</h1>
        <p>Viewing all employees currently in your reporting line.</p>
      </div>

      {/* Row 2 — Stat cards */}
      <div className="offui-md-row2">
        <OffuiCards
          title="Total Members"
          value={String(totalMembers)}
          subtitle=""
        />
        <OffuiCards
          title="Active Status"
          value={String(activeCount)}
          subtitle=""
        />
        <OffuiCards
          title="Offboarding"
          value={String(offboardingCount)}
          subtitle=""
        />
      </div>

      {/* Row 3 — Employee table */}
      <div className="offui-md-row3">

        {/* Header */}
        <div className="offui-md-table-header">
          <span>Employee Name</span>
          <span>Employee ID</span>
          <span>Role</span>
          <span>Department</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {/* Body */}
        {loading ? (
          <div className="offui-md-state">Loading team data…</div>
        ) : employees.length === 0 ? (
          <div className="offui-md-state">No employees found in your reporting line.</div>
        ) : (
          pageSlice.map((emp) => {
            const isOffboarding = offboarding.has(emp.id);
            return (
              <div key={emp.id} className="offui-md-table-row">

                {/* Name + avatar */}
                <div className="offui-md-emp-cell">
                  <div className="offui-md-avatar">{initials(emp.name)}</div>
                  <div>
                    <p className="offui-md-emp-name">{emp.name}</p>
                    <p className="offui-md-emp-email">{emp.email}</p>
                  </div>
                </div>

                <span className="offui-md-cell-text">{emp.id}</span>
                <span className="offui-md-cell-text">{emp.designation}</span>
                <span className="offui-md-cell-text">{emp.department}</span>

                {/* Status badge */}
                <span
                  className={`offui-md-badge ${
                    isOffboarding
                      ? 'offui-md-badge--offboarding'
                      : 'offui-md-badge--active'
                  }`}
                >
                  {isOffboarding ? 'Offboarding' : 'Active'}
                </span>

                {/* Action */}
                <button
                  className="offui-md-action-btn"
                  onClick={() => navigate(`/ManagerApproval/${emp.id}`)}
                >
                  View Employee
                </button>
              </div>
            );
          })
        )}

        {/* Footer / pagination */}
        {!loading && employees.length > 0 && (
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
              >
                ‹
              </button>

              {buildPages().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="offui-md-page-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`offui-md-page-btn ${page === p ? 'offui-md-page-btn--active' : ''}`}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className="offui-md-page-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ManagerDashboard;