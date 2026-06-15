import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmployeeDetails.css';

// ── Types ──────────────────────────────────────────────────────────
interface EmpDetail {
  empId: string;
  firstName: string;
  lastName: string;
  desg: string;
  project: string | null;
  grade: string | null;
  email: string;
  gender: string | null;
  doj: string | null;
  managerEmpCode: string | null;
  reportingManager: string | null;
  personalPhoneNumber: string | null;
}

// ── Config ─────────────────────────────────────────────────────────
const JWT_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJEZWVwYWtLQGNsYXJpdW0udGVjaCIsImVtcElkIjoxMjI1LCJkZXNpZ25hdGlvbiI6IlRyYWluZWUgU29mdHdhcmUgRW5naW5lZXIiLCJpYXQiOjE3ODE1MTU2NjMsImV4cCI6MTc4MTUxOTI2M30.FF7jdkmmOJcFvnTQo7kyBhbZfj2ZbLWNMceOj_eVlupduWq4jm9ZLUWUl8TILELea-8GhX4eBeTUOE6KqXIS4g';
const MANAGER_INFO_URL = 'http://localhost:5206/api/managerinfo';

const axiosInstance = axios.create({
  headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  withCredentials: true,
});

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Component ──────────────────────────────────────────────────────
const EmployeeDetails = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate   = useNavigate();
  const [emp, setEmp]       = useState<EmpDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the full team list from managerinfo and find this employee
    axiosInstance
      .get(MANAGER_INFO_URL)
      .then((res) => {
        const member = res.data.totalMembers?.find(
          (m: { empId: string }) => m.empId === empId
        );
        if (member) setEmp(member as EmpDetail);
      })
      .catch((err) => console.error('Failed to load employee details:', err))
      .finally(() => setLoading(false));
  }, [empId]);

  if (loading) return <div className="offui-ed-loading">Loading employee details…</div>;
  if (!emp)    return <div className="offui-ed-loading">Employee not found.</div>;

  const fullName = `${emp.firstName || ''} ${emp.lastName || emp.empId}`.trim();

  return (
    <section className="offui-ed">

      {/* Header */}
      <div className="offui-ed-header">
        <button className="offui-ed-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <h1 className="offui-ed-title">Employee Details</h1>
          <p className="offui-ed-subtitle">Viewing profile for {fullName}</p>
        </div>
      </div>

      {/* Card */}
      <div className="offui-ed-card">

        {/* Avatar + name banner */}
        <div className="offui-ed-banner">
          <div className="offui-ed-avatar">
            {fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="offui-ed-name">{fullName}</h2>
            <p className="offui-ed-role">{emp.desg} {emp.grade ? `· Grade ${emp.grade}` : ''}</p>
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
            <input type="text" value={emp.gender || '—'} disabled />
          </div>
          <div className="offui-ed-field">
            <label>Date of Joining</label>
            <input type="text" value={formatDate(emp.doj)} disabled />
          </div>
          <div className="offui-ed-field">
            <label>Phone</label>
            <input type="text" value={emp.personalPhoneNumber || '—'} disabled />
          </div>
          <div className="offui-ed-field offui-ed-field--full">
            <label>Reporting Manager</label>
            <input type="text" value={emp.reportingManager ?? '—'} disabled />
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