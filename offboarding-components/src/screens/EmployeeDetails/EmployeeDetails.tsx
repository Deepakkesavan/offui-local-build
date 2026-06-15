import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmployeeDetails.css';

// ── Types ──────────────────────────────────────────────────────────
interface EmpDetail {
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

// ── Config ─────────────────────────────────────────────────────────
// Uses the MANAGER token so /api/managerinfo returns the full team list
const JWT_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJBZ3VzdGluSmVuaWxSYWpQQGNsYXJpdW0udGVjaCIsImVtcElkIjoxMDgxLCJkZXNpZ25hdGlvbiI6IlRlY2huaWNhbCBMZWFkIiwiaWF0IjoxNzgxNTA5MTMzLCJleHAiOjE5ODE1MTI3MzN9.EG0UdmRFpgukHuboycJj6ofjSG2BltlXQG04iJVyHnaBDNtjuWkIgfJ2j5S26PSRaZ7j5FSshuAQ-ZTkBqqBHw';
const MANAGER_INFO_URL = 'http://localhost:5206/api/managerinfo';

const axiosInstance = axios.create({
  headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  withCredentials: true,
});

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

// ── Component ──────────────────────────────────────────────────────
const EmployeeDetails = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate  = useNavigate();

  const [emp,     setEmp]     = useState<EmpDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empId) return;

    // Fetch the manager's team list and find this employee inside it.
    // This uses the same manager token / endpoint as EmployeeRecord so
    // the lookup is guaranteed to succeed for any direct report.
    axiosInstance
      .get(MANAGER_INFO_URL)
      .then((res) => {
        const member = res.data.totalMembers?.find(
          (m: EmpDetail) => m.empId === empId
        );
        if (member) setEmp(member as EmpDetail);
      })
      .catch((err) => console.error('Failed to load employee details:', err))
      .finally(() => setLoading(false));
  }, [empId]);

  if (loading) return <div className="offui-ed-loading">Loading employee details…</div>;
  if (!emp)    return <div className="offui-ed-loading">Employee not found.</div>;

  const initials = emp.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="offui-ed">

      {/* Header */}
      <div className="offui-ed-header">
        <button className="offui-ed-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <h1 className="offui-ed-title">Employee Details</h1>
          <p className="offui-ed-subtitle">Viewing profile for {emp.fullName}</p>
        </div>
      </div>

      {/* Card */}
      <div className="offui-ed-card">

        {/* Avatar + name banner */}
        <div className="offui-ed-banner">
          <div className="offui-ed-avatar">{initials}</div>
          <div>
            <h2 className="offui-ed-name">{emp.fullName}</h2>
            <p className="offui-ed-role">
              {emp.desg}
              {emp.grade ? ` · Grade ${emp.grade}` : ''}
            </p>
          </div>
        </div>

        <div className="offui-ed-divider" />

        {/* Detail grid */}
        <div className="offui-ed-grid">
          <div className="offui-ed-field">
            <label>Employee ID</label>
            <input type="text" value={emp.empId} disabled />
          </div>
          <div className="offui-ed-field">
            <label>Email</label>
            <input type="text" value={emp.email ?? '—'} disabled />
          </div>
          <div className="offui-ed-field">
            <label>Project</label>
            <input type="text" value={emp.project ?? '—'} disabled />
          </div>
          <div className="offui-ed-field">
            <label>Gender</label>
            <input type="text" value={emp.gender ?? '—'} disabled />
          </div>
          <div className="offui-ed-field">
            <label>Date of Joining</label>
            <input type="text" value={formatDate(emp.doj)} disabled />
          </div>
          <div className="offui-ed-field">
            <label>Status</label>
            <input
              type="text"
              value={emp.isOffboarding ? 'Offboarding' : 'Active'}
              disabled
            />
          </div>
        </div>

        {/* Status pill */}
        <div className="offui-ed-status-row">
          <span className="offui-ed-status-badge offui-ed-status-badge--active">
            ● Active Employee
          </span>
        </div>

      </div>
    </section>
  );
};

export default EmployeeDetails;