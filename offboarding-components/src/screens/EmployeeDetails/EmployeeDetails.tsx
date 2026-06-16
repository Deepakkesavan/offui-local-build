import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { EmpDetail } from '../../types';
import { createApiClient } from '../../utils/apiClient';
import { formatDateDMY, getInitials } from '../../utils';
import { API_ENDPOINTS } from '../../config/api';
import './EmployeeDetails.css';

const api = createApiClient('manager');

const EmployeeDetails = () => {
  const { empId } = useParams<{ empId: string }>();
  const navigate  = useNavigate();

  const [emp,     setEmp]     = useState<EmpDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empId) return;

    api
      .get(API_ENDPOINTS.managerInfo)
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

  return (
    <section className="offui-ed">

      {/* Header */}
      <div className="offui-ed-header">
        <button className="offui-ed-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h1 className="offui-ed-title">Employee Details</h1>
          <p className="offui-ed-subtitle">Viewing profile for {emp.fullName}</p>
        </div>
      </div>

      {/* Card */}
      <div className="offui-ed-card">

        {/* Avatar + name banner */}
        <div className="offui-ed-banner">
          <div className="offui-ed-avatar">{getInitials(emp.fullName)}</div>
          <div>
            <h2 className="offui-ed-name">{emp.fullName}</h2>
            <p className="offui-ed-role">
              {emp.desg}{emp.grade ? ` · Grade ${emp.grade}` : ''}
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
            <input type="text" value={formatDateDMY(emp.doj)} disabled />
          </div>
          <div className="offui-ed-field">
            <label>Status</label>
            <input type="text" value={emp.isOffboarding ? 'Offboarding' : 'Active'} disabled />
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