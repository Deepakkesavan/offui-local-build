import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OffuiCards from '../../components/Cards/offuiCards';
import TeamTable from '../../components/TeamTable/teamTable';
import type { ManagerInfo, TeamMember } from '../../types';
import { createApiClient } from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../config/api';
import './managerDashboard.css';

const api = createApiClient('manager');

const ManagerDashboard = () => {
  const navigate = useNavigate();

  const [info,    setInfo]    = useState<ManagerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api
      .get<ManagerInfo>(API_ENDPOINTS.managerInfo)
      .then((res) => setInfo(res.data))
      .catch((err) => {
        console.error('Failed to load manager info:', err);
        setError('Could not load team data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleViewRecord  = (member: TeamMember) => navigate(`/OffboardingRecord/${member.empId}`);
  const handleViewDetails = (member: TeamMember) => navigate(`/EmployeeDetails/${member.empId}`);

  // ── Not a manager ──────────────────────────────────────────────
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
      <TeamTable
        members={info?.totalMembers ?? []}
        loading={loading}
        error={error}
        pageSize={5}
        onViewRecord={handleViewRecord}
        onViewDetails={handleViewDetails}
      />

    </section>
  );
};

export default ManagerDashboard;